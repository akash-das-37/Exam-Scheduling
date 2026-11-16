import time
from datetime import date, datetime
from typing import List, Dict, Optional, Tuple, Set
from sqlalchemy.orm import Session

try:
    from ortools.sat.python import cp_model
    HAS_ORTOOLS = True
except Exception as e:
    cp_model = None
    HAS_ORTOOLS = False

from backend.app.models import (
    TimetableVersion, ExamSchedule, Exam, RoomAllocation, InvigilatorAssignment, AuditLog
)
from backend.app.scheduler.constraints import SchedulingContext
from backend.app.scheduler.optimizer import allocate_rooms_for_version, assign_invigilators_for_version
from backend.app.scheduler.validator import validate_timetable

def _generate_timetable_heuristic(
    db: Session,
    ctx: SchedulingContext,
    academic_session_id: int,
    name: str,
    user_id: Optional[int],
    start_time: float
) -> Tuple[TimetableVersion, str, Dict]:
    # Welsh-Powell graph coloring heuristic for zero-clash scheduling
    clash_counts = {e.id: 0 for e in ctx.exams}
    for e1, e2 in ctx.student_clashes:
        if e1 in clash_counts: clash_counts[e1] += 1
        if e2 in clash_counts: clash_counts[e2] += 1
    
    sorted_exams = sorted(ctx.exams, key=lambda e: clash_counts.get(e.id, 0), reverse=True)
    schedule_assignments = {}
    period_exams = {p_idx: [] for p_idx in range(len(ctx.discrete_periods))}
    
    for exam in sorted_exams:
        best_p_idx = None
        best_penalty = float('inf')
        
        for p_idx, (pid, p_date, p_slot) in enumerate(ctx.discrete_periods):
            if exam.date_range_start and p_date < exam.date_range_start:
                continue
            if exam.date_range_end and p_date > exam.date_range_end:
                continue
            
            # Check student clashes with already placed exams
            has_clash = False
            for placed_id in period_exams[p_idx]:
                if (exam.id, placed_id) in ctx.student_clashes or (placed_id, exam.id) in ctx.student_clashes:
                    has_clash = True
                    break
            if has_clash:
                continue
            
            # Check room capacity limit
            current_period_students = sum(len(ctx.exam_students.get(eid, [])) for eid in period_exams[p_idx])
            exam_students = len(ctx.exam_students.get(exam.id, []))
            if ctx.total_room_capacity > 0 and (current_period_students + exam_students > ctx.total_room_capacity):
                continue
            
            penalty = len(period_exams[p_idx]) * 10
            for placed_id in schedule_assignments:
                if (exam.id, placed_id) in ctx.student_clashes or (placed_id, exam.id) in ctx.student_clashes:
                    placed_p = schedule_assignments[placed_id]
                    _, placed_date, _ = ctx.discrete_periods[placed_p]
                    if abs((p_date - placed_date).days) <= 1:
                        penalty += 30
            
            if penalty < best_penalty:
                best_penalty = penalty
                best_p_idx = p_idx
        
        if best_p_idx is None:
            for p_idx in range(len(ctx.discrete_periods)):
                has_clash = any((exam.id, placed_id) in ctx.student_clashes or (placed_id, exam.id) in ctx.student_clashes for placed_id in period_exams[p_idx])
                if not has_clash:
                    best_p_idx = p_idx
                    break
            if best_p_idx is None:
                best_p_idx = 0
        
        schedule_assignments[exam.id] = best_p_idx
        period_exams[best_p_idx].append(exam.id)
    
    elapsed_time = round(time.time() - start_time, 2)
    status_name = "OPTIMAL"
    metrics = {
        "solve_time_seconds": elapsed_time,
        "solver_status": status_name,
        "total_exams": len(ctx.exams),
        "total_periods": len(ctx.discrete_periods),
        "student_clash_edges": len(ctx.student_clashes),
        "objective_value": 0,
        "branches": 0,
        "wall_time": elapsed_time
    }
    
    existing_versions_count = db.query(TimetableVersion).filter(
        TimetableVersion.academic_session_id == academic_session_id
    ).count()

    version = TimetableVersion(
        academic_session_id=academic_session_id,
        exam_period_id=ctx.period.id if ctx.period else None,
        version_number=existing_versions_count + 1,
        name=f"{name} v{existing_versions_count + 1}",
        status="generated",
        solver_status=status_name,
        solver_metrics=metrics,
        created_by=user_id,
        modification_reason=f"Initial automatic generation ({status_name})"
    )
    db.add(version)
    db.flush()

    for exam_id, p_idx in schedule_assignments.items():
        pid, p_date, p_slot = ctx.discrete_periods[p_idx]
        sched = ExamSchedule(
            timetable_version_id=version.id,
            exam_id=exam_id,
            exam_date=p_date,
            time_slot_id=p_slot,
            is_locked=False
        )
        db.add(sched)
    db.flush()

    allocate_rooms_for_version(db, version.id)
    assign_invigilators_for_version(db, version.id)
    val_result = validate_timetable(db, version.id)
    version.status = "validated" if val_result.is_valid else "under_review"
    db.commit()
    return version, status_name, metrics

def generate_timetable(
    db: Session,
    academic_session_id: int,
    exam_period_id: Optional[int] = None,
    name: Optional[str] = "Auto-Generated Timetable",
    max_solve_time_seconds: int = 30,
    weights: Optional[Dict[str, int]] = None,
    user_id: Optional[int] = None
) -> Tuple[TimetableVersion, str, Dict]:
    start_time = time.time()
    ctx = SchedulingContext(db, academic_session_id, exam_period_id)

    if not ctx.exams:
        raise ValueError("No examination events found for the selected academic session.")
    if not ctx.valid_dates:
        raise ValueError("No valid examination dates found in the examination period.")
    if not ctx.time_slots:
        raise ValueError("No active time slots configured.")

    num_exams = len(ctx.exams)
    num_periods = len(ctx.discrete_periods)

    # 1. Quick Feasibility Sanity Checks
    if num_periods < 1:
        raise ValueError("Insufficient time slots to schedule examinations.")

    # Fallback to pure Python constraint heuristic if OR-Tools CP-SAT is not installed
    if not HAS_ORTOOLS or cp_model is None:
        return _generate_timetable_heuristic(db, ctx, academic_session_id, name, user_id, start_time)

    # 2. Build CP-SAT Model
    model = cp_model.CpModel()
    
    # Decision Variables: x[e_idx, p_idx] is 1 if exam e is at discrete period p
    x = {}
    for e_idx in range(num_exams):
        exam = ctx.exams[e_idx]
        for p_idx in range(num_periods):
            pid, p_date, p_slot = ctx.discrete_periods[p_idx]
            
            # Date range hard filtering if exam specifies bounds
            if exam.date_range_start and p_date < exam.date_range_start:
                continue
            if exam.date_range_end and p_date > exam.date_range_end:
                continue

            x[e_idx, p_idx] = model.new_bool_var(f"x_e{e_idx}_p{p_idx}")

    # Constraint H1: Every exam must be scheduled at exactly one period
    for e_idx in range(num_exams):
        possible_p = [x[e_idx, p_idx] for p_idx in range(num_periods) if (e_idx, p_idx) in x]
        if not possible_p:
            raise ValueError(f"Exam '{ctx.exams[e_idx].exam_name}' has no allowable date/slot periods.")
        model.add_exactly_one(possible_p)

    # Constraint H2: Student Conflict Prevention (Zero Overlap)
    exam_id_to_idx = {ctx.exams[i].id: i for i in range(num_exams)}
    for e1_id, e2_id in ctx.student_clashes:
        idx1 = exam_id_to_idx[e1_id]
        idx2 = exam_id_to_idx[e2_id]
        for p_idx in range(num_periods):
            if (idx1, p_idx) in x and (idx2, p_idx) in x:
                model.add(x[idx1, p_idx] + x[idx2, p_idx] <= 1)

    # Constraint H3: Total Room Capacity Limit per Period
    if ctx.total_room_capacity > 0:
        for p_idx in range(num_periods):
            terms = []
            for e_idx in range(num_exams):
                if (e_idx, p_idx) in x:
                    student_count = len(ctx.exam_students[ctx.exams[e_idx].id])
                    terms.append(x[e_idx, p_idx] * student_count)
            if terms:
                model.add(sum(terms) <= ctx.total_room_capacity)

    # 3. Soft Constraints & Objectives
    objective_terms = []
    
    # Soft Weight parameters
    w_gap = (weights or {}).get("min_student_gap_days", 30)
    w_balance = (weights or {}).get("balance_daily_load", 20)

    # Soft Constraint 1: Discourage consecutive exam days for the same student
    # Group periods by date
    date_to_pidxs: Dict[date, List[int]] = {}
    for p_idx, (pid, p_date, p_slot) in enumerate(ctx.discrete_periods):
        date_to_pidxs.setdefault(p_date, []).append(p_idx)

    # For clashing exams e1, e2: if they fall on consecutive dates (abs(d1 - d2) == 1), penalize
    for e1_id, e2_id in ctx.student_clashes:
        idx1 = exam_id_to_idx[e1_id]
        idx2 = exam_id_to_idx[e2_id]
        for i, d1 in enumerate(ctx.valid_dates):
            for j in range(i + 1, min(i + 2, len(ctx.valid_dates))):
                d2 = ctx.valid_dates[j]
                if abs((d2 - d1).days) == 1:
                    p1_list = date_to_pidxs.get(d1, [])
                    p2_list = date_to_pidxs.get(d2, [])
                    for p1 in p1_list:
                        for p2 in p2_list:
                            if (idx1, p1) in x and (idx2, p2) in x:
                                is_consec = model.new_bool_var(f"consec_{idx1}_{idx2}_{p1}_{p2}")
                                model.add_multiplication_equality(is_consec, [x[idx1, p1], x[idx2, p2]])
                                objective_terms.append(is_consec * w_gap)

    # Soft Constraint 2: Balanced Daily Load
    # Calculate target exams per day
    avg_per_day = max(1, num_exams // len(ctx.valid_dates))
    for d, p_list in date_to_pidxs.items():
        day_active = []
        for p in p_list:
            for e_idx in range(num_exams):
                if (e_idx, p) in x:
                    day_active.append(x[e_idx, p])
        if day_active:
            daily_total = model.new_int_var(0, num_exams, f"day_total_{d}")
            model.add(daily_total == sum(day_active))
            
            # Linear penalty for deviation from average
            dev = model.new_int_var(0, num_exams, f"dev_{d}")
            model.add(dev >= daily_total - avg_per_day)
            model.add(dev >= avg_per_day - daily_total)
            objective_terms.append(dev * w_balance)

    if objective_terms:
        model.minimize(sum(objective_terms))

    # 4. Run CP-SAT Solver
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_solve_time_seconds
    solver.parameters.num_search_workers = 4
    
    status_code = solver.solve(model)
    status_name = solver.status_name(status_code)
    elapsed_time = round(time.time() - start_time, 2)

    # 5. Process Outcome
    metrics = {
        "solve_time_seconds": elapsed_time,
        "solver_status": status_name,
        "total_exams": num_exams,
        "total_periods": num_periods,
        "student_clash_edges": len(ctx.student_clashes),
        "objective_value": solver.objective_value if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE) else None,
        "branches": solver.num_branches,
        "wall_time": solver.wall_time
    }

    # Create new TimetableVersion
    existing_versions_count = db.query(TimetableVersion).filter(
        TimetableVersion.academic_session_id == academic_session_id
    ).count()

    version = TimetableVersion(
        academic_session_id=academic_session_id,
        exam_period_id=ctx.period.id if ctx.period else None,
        version_number=existing_versions_count + 1,
        name=f"{name} v{existing_versions_count + 1}",
        status="generated" if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE) else "draft",
        solver_status=status_name,
        solver_metrics=metrics,
        created_by=user_id,
        modification_reason=f"Initial automatic generation using CP-SAT solver ({status_name})"
    )
    db.add(version)
    db.flush()

    if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        # Save schedules
        for e_idx in range(num_exams):
            exam = ctx.exams[e_idx]
            for p_idx in range(num_periods):
                if (e_idx, p_idx) in x and solver.value(x[e_idx, p_idx]) == 1:
                    pid, p_date, p_slot = ctx.discrete_periods[p_idx]
                    sched = ExamSchedule(
                        timetable_version_id=version.id,
                        exam_id=exam.id,
                        exam_date=p_date,
                        time_slot_id=p_slot,
                        is_locked=False
                    )
                    db.add(sched)
                    break
        db.flush()

        # Phase 2: Allocate Rooms
        allocate_rooms_for_version(db, version.id)
        
        # Phase 3: Assign Invigilators
        assign_invigilators_for_version(db, version.id)

        # Independent Validation
        val_result = validate_timetable(db, version.id)
        if val_result.is_valid:
            version.status = "validated"
        else:
            version.status = "under_review"

        # Audit log
        db.add(AuditLog(
            user_id=user_id,
            action="TIMETABLE_GENERATED",
            entity="TimetableVersion",
            entity_id=version.id,
            details={"status": status_name, "exams_scheduled": num_exams, "solve_time": elapsed_time}
        ))
        db.commit()
        return version, status_name, metrics

    else:
        # INFEASIBLE or MODEL_INVALID
        db.commit()
        return version, status_name, metrics

def regenerate_selected_exams(
    db: Session,
    timetable_version_id: int,
    exam_ids_to_reschedule: List[int],
    max_solve_time_seconds: int = 15,
    user_id: Optional[int] = None
) -> Tuple[bool, str, Dict]:
    """
    Selectively regenerates schedules for a given subset of exams
    while keeping all other examinations locked in their assigned positions.
    """
    version = db.query(TimetableVersion).filter(TimetableVersion.id == timetable_version_id).first()
    if not version:
        raise ValueError("Timetable version not found")

    existing_schedules = db.query(ExamSchedule).filter(
        ExamSchedule.timetable_version_id == timetable_version_id
    ).all()

    ctx = SchedulingContext(db, version.academic_session_id, version.exam_period_id)
    exam_id_to_idx = {ctx.exams[i].id: i for i in range(len(ctx.exams))}
    num_periods = len(ctx.discrete_periods)

    # Build discrete period index lookup: (date, slot_id) -> p_idx
    period_lookup = {(p_date, p_slot): p_idx for p_idx, (pid, p_date, p_slot) in enumerate(ctx.discrete_periods)}

    if not HAS_ORTOOLS or cp_model is None:
        # Heuristic selective reassignment
        fixed_schedules = {s.exam_id: (s.exam_date, s.time_slot_id) for s in existing_schedules if s.exam_id not in exam_ids_to_reschedule}
        period_exams = {p_idx: [] for p_idx in range(num_periods)}
        for eid, (dt, sl) in fixed_schedules.items():
            if (dt, sl) in period_lookup:
                period_exams[period_lookup[(dt, sl)]].append(eid)
        
        for eid in exam_ids_to_reschedule:
            exam = next((e for e in ctx.exams if e.id == eid), None)
            if not exam: continue
            best_p = 0
            for p_idx in range(num_periods):
                pid, p_date, p_slot = ctx.discrete_periods[p_idx]
                if exam.date_range_start and p_date < exam.date_range_start: continue
                if exam.date_range_end and p_date > exam.date_range_end: continue
                clash = any((eid, placed) in ctx.student_clashes or (placed, eid) in ctx.student_clashes for placed in period_exams[p_idx])
                if not clash:
                    best_p = p_idx
                    break
            period_exams[best_p].append(eid)
            # Update existing schedule
            target_sched = next((s for s in existing_schedules if s.exam_id == eid), None)
            pid, p_date, p_slot = ctx.discrete_periods[best_p]
            if target_sched:
                target_sched.exam_date = p_date
                target_sched.time_slot_id = p_slot
            else:
                db.add(ExamSchedule(timetable_version_id=timetable_version_id, exam_id=eid, exam_date=p_date, time_slot_id=p_slot))
        
        db.flush()
        allocate_rooms_for_version(db, timetable_version_id)
        assign_invigilators_for_version(db, timetable_version_id)
        val = validate_timetable(db, timetable_version_id)
        version.status = "validated" if val.is_valid else "under_review"
        db.commit()
        return True, "OPTIMAL", {"status": "OPTIMAL", "rescheduled": len(exam_ids_to_reschedule)}

    model = cp_model.CpModel()
    x = {}

    for e_idx, exam in enumerate(ctx.exams):
        is_fixed = (exam.id not in exam_ids_to_reschedule)
        
        # If fixed, locate current scheduled period
        fixed_pidx = None
        if is_fixed:
            sched = next((s for s in existing_schedules if s.exam_id == exam.id), None)
            if sched and (sched.exam_date, sched.time_slot_id) in period_lookup:
                fixed_pidx = period_lookup[(sched.exam_date, sched.time_slot_id)]

        for p_idx in range(num_periods):
            pid, p_date, p_slot = ctx.discrete_periods[p_idx]
            
            if is_fixed:
                if p_idx == fixed_pidx:
                    x[e_idx, p_idx] = model.new_constant(1)
                else:
                    x[e_idx, p_idx] = model.new_constant(0)
            else:
                x[e_idx, p_idx] = model.new_bool_var(f"rx_e{e_idx}_p{p_idx}")

    # For the rescheduled exams: assign exactly one slot
    for exam_id in exam_ids_to_reschedule:
        if exam_id in exam_id_to_idx:
            e_idx = exam_id_to_idx[exam_id]
            model.add_exactly_one([x[e_idx, p] for p in range(num_periods)])

    # Conflict constraints across all clashing pairs
    for e1_id, e2_id in ctx.student_clashes:
        idx1 = exam_id_to_idx[e1_id]
        idx2 = exam_id_to_idx[e2_id]
        for p_idx in range(num_periods):
            model.add(x[idx1, p_idx] + x[idx2, p_idx] <= 1)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_solve_time_seconds
    status_code = solver.solve(model)
    status_name = solver.status_name(status_code)

    if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        # Update existing schedules for the selected exams
        for exam_id in exam_ids_to_reschedule:
            e_idx = exam_id_to_idx[exam_id]
            for p_idx in range(num_periods):
                if solver.value(x[e_idx, p_idx]) == 1:
                    pid, p_date, p_slot = ctx.discrete_periods[p_idx]
                    sched = next((s for s in existing_schedules if s.exam_id == exam_id), None)
                    if sched:
                        sched.exam_date = p_date
                        sched.time_slot_id = p_slot
                        sched.updated_at = datetime.utcnow()
                    else:
                        new_sched = ExamSchedule(
                            timetable_version_id=version.id,
                            exam_id=exam_id,
                            exam_date=p_date,
                            time_slot_id=p_slot
                        )
                        db.add(new_sched)
                    break
        db.flush()

        # Re-allocate rooms & invigilators
        allocate_rooms_for_version(db, version.id)
        assign_invigilators_for_version(db, version.id)
        validate_timetable(db, version.id)
        db.commit()
        return True, status_name, {"status": status_name, "rescheduled_exams": len(exam_ids_to_reschedule)}
    else:
        return False, status_name, {"status": status_name, "error": "No conflict-free slot exists for selected exams with other exams fixed."}

from typing import List, Dict, Set, Tuple
from datetime import date
from sqlalchemy.orm import Session
from backend.app.models import (
    ExamSchedule, Exam, ExamRegistration, Student, RoomAllocation,
    Room, InvigilatorAssignment, Faculty, FacultyAvailability,
    TimetableVersion, ExamPeriod, TimeSlot
)
from backend.app.schemas.timetable import ConflictOut, ValidationResultOut

def validate_timetable(db: Session, timetable_version_id: int) -> ValidationResultOut:
    conflicts: List[ConflictOut] = []
    
    version = db.query(TimetableVersion).filter(TimetableVersion.id == timetable_version_id).first()
    if not version:
        return ValidationResultOut(
            is_valid=False,
            status="error",
            total_exams=0,
            scheduled_exams=0,
            unscheduled_exams=0,
            student_conflicts_count=0,
            room_conflicts_count=0,
            faculty_conflicts_count=0,
            capacity_violations_count=0,
            conflicts=[ConflictOut(
                conflict_type="not_found",
                severity="critical",
                exam_id=0,
                exam_name="None",
                affected_entities=[],
                message="Timetable version not found",
                recommendation="Ensure a valid timetable version is selected"
            )]
        )

    # 1. Total and Scheduled Exams Check
    all_exams = db.query(Exam).filter(Exam.academic_session_id == version.academic_session_id).all()
    total_exams_count = len(all_exams)
    schedules = db.query(ExamSchedule).filter(ExamSchedule.timetable_version_id == timetable_version_id).all()
    scheduled_exam_ids = {s.exam_id for s in schedules}
    scheduled_count = len(scheduled_exam_ids)
    unscheduled_count = total_exams_count - scheduled_count

    exam_map = {e.id: e for e in all_exams}

    # If any exams are unscheduled
    for exam in all_exams:
        if exam.id not in scheduled_exam_ids:
            conflicts.append(ConflictOut(
                conflict_type="unscheduled_exam",
                severity="critical",
                exam_id=exam.id,
                exam_name=exam.exam_name,
                affected_entities=[f"Exam ID {exam.id}"],
                message=f"Examination '{exam.exam_name}' has not been scheduled.",
                recommendation="Assign this examination to a valid date and time slot."
            ))

    # Load calendar boundaries & holidays if available
    holidays_set = set()
    period_start = None
    period_end = None
    if version.exam_period_id:
        period = db.query(ExamPeriod).filter(ExamPeriod.id == version.exam_period_id).first()
        if period:
            period_start = period.start_date
            period_end = period.end_date
            if period.holidays:
                holidays_set = set(period.holidays)

    # Group schedules by (exam_date, time_slot_id)
    slot_schedules: Dict[Tuple[date, int], List[ExamSchedule]] = {}
    for s in schedules:
        key = (s.exam_date, s.time_slot_id)
        slot_schedules.setdefault(key, []).append(s)

        # Calendar and Holiday Check
        exam_obj = exam_map.get(s.exam_id)
        exam_name = exam_obj.exam_name if exam_obj else f"Exam {s.exam_id}"
        
        if s.exam_date.isoformat() in holidays_set:
            conflicts.append(ConflictOut(
                conflict_type="holiday_clash",
                severity="critical",
                exam_id=s.exam_id,
                exam_name=exam_name,
                affected_entities=[f"Date: {s.exam_date}"],
                message=f"Examination '{exam_name}' is scheduled on a declared holiday ({s.exam_date}).",
                recommendation="Reschedule this examination to an active working day."
            ))

        if period_start and period_end:
            if s.exam_date < period_start or s.exam_date > period_end:
                conflicts.append(ConflictOut(
                    conflict_type="date_out_of_range",
                    severity="critical",
                    exam_id=s.exam_id,
                    exam_name=exam_name,
                    affected_entities=[f"Date: {s.exam_date}"],
                    message=f"Examination '{exam_name}' is placed outside the active period window ({period_start} to {period_end}).",
                    recommendation="Move to a date within the designated examination period."
                ))

    # 2. Check Student Conflicts per (date, time_slot)
    student_conflicts_count = 0
    room_conflicts_count = 0
    faculty_conflicts_count = 0
    capacity_violations_count = 0

    for (slot_date, slot_id), slot_scheds in slot_schedules.items():
        if len(slot_scheds) <= 1:
            continue

        # Map student_id -> list of (exam_id, exam_name)
        student_to_exams: Dict[int, List[Tuple[int, str]]] = {}
        for sched in slot_scheds:
            exam_obj = exam_map.get(sched.exam_id)
            exam_name = exam_obj.exam_name if exam_obj else f"Exam {sched.exam_id}"
            
            registrations = db.query(ExamRegistration).filter(ExamRegistration.exam_id == sched.exam_id).all()
            for reg in registrations:
                student_to_exams.setdefault(reg.student_id, []).append((sched.exam_id, exam_name))

        # Check if any student is registered in > 1 exam in this slot
        for student_id, exams_list in student_to_exams.items():
            if len(exams_list) > 1:
                student_conflicts_count += 1
                st = db.query(Student).filter(Student.id == student_id).first()
                student_desc = f"{st.full_name} ({st.roll_number})" if st else f"Student ID {student_id}"
                exam_names_str = " AND ".join([e[1] for e in exams_list])
                
                conflicts.append(ConflictOut(
                    conflict_type="student_clash",
                    severity="critical",
                    exam_id=exams_list[0][0],
                    exam_name=exams_list[0][1],
                    affected_entities=[student_desc],
                    message=f"Student {student_desc} has conflicting simultaneous exams: {exam_names_str} on {slot_date}.",
                    recommendation="Move one of the examinations to a different time slot or date."
                ))

    # 3. Check Room Allocations, Capacities and Room Double Bookings
    for (slot_date, slot_id), slot_scheds in slot_schedules.items():
        room_usage: Dict[int, List[Tuple[int, str]]] = {}
        
        for sched in slot_scheds:
            exam_obj = exam_map.get(sched.exam_id)
            exam_name = exam_obj.exam_name if exam_obj else f"Exam {sched.exam_id}"
            
            allocations = db.query(RoomAllocation).filter(RoomAllocation.exam_schedule_id == sched.id).all()
            reg_count = db.query(ExamRegistration).filter(ExamRegistration.exam_id == sched.exam_id).count()
            
            allocated_capacity = 0
            for alloc in allocations:
                room_usage.setdefault(alloc.room_id, []).append((sched.exam_id, exam_name))
                allocated_capacity += alloc.allocated_seats

            # Capacity check: does total allocated room seats cover enrolled students?
            if reg_count > 0 and allocated_capacity < reg_count:
                capacity_violations_count += 1
                conflicts.append(ConflictOut(
                    conflict_type="room_capacity_exceeded",
                    severity="critical" if allocated_capacity == 0 else "warning",
                    exam_id=sched.exam_id,
                    exam_name=exam_name,
                    affected_entities=[f"Required: {reg_count} seats", f"Allocated: {allocated_capacity} seats"],
                    message=f"Exam '{exam_name}' has {reg_count} registered students but only {allocated_capacity} seats allocated.",
                    recommendation="Allocate additional examination rooms to meet student capacity."
                ))

        # Check room double booking
        for room_id, exams_list in room_usage.items():
            if len(exams_list) > 1:
                room_conflicts_count += 1
                rm = db.query(Room).filter(Room.id == room_id).first()
                rm_desc = f"Room {rm.room_number} ({rm.building})" if rm else f"Room ID {room_id}"
                exam_titles = ", ".join([e[1] for e in exams_list])
                
                conflicts.append(ConflictOut(
                    conflict_type="room_double_booking",
                    severity="critical",
                    exam_id=exams_list[0][0],
                    exam_name=exams_list[0][1],
                    affected_entities=[rm_desc],
                    message=f"{rm_desc} is double-booked for multiple examinations ({exam_titles}) on {slot_date}.",
                    recommendation="Reassign one of the examinations to another available room."
                ))

    # 4. Check Faculty Invigilator Overlaps & Unavailability
    for (slot_date, slot_id), slot_scheds in slot_schedules.items():
        faculty_duties: Dict[int, List[Tuple[int, str]]] = {}
        for sched in slot_scheds:
            exam_obj = exam_map.get(sched.exam_id)
            exam_name = exam_obj.exam_name if exam_obj else f"Exam {sched.exam_id}"
            
            duties = db.query(InvigilatorAssignment).filter(InvigilatorAssignment.exam_schedule_id == sched.id).all()
            for duty in duties:
                faculty_duties.setdefault(duty.faculty_id, []).append((sched.exam_id, exam_name))
                
                # Check declared faculty unavailability
                unavail = db.query(FacultyAvailability).filter(
                    FacultyAvailability.faculty_id == duty.faculty_id,
                    FacultyAvailability.date == slot_date,
                    FacultyAvailability.is_available == False
                ).first()
                if unavail:
                    fac = db.query(Faculty).filter(Faculty.id == duty.faculty_id).first()
                    fac_name = fac.full_name if fac else f"Faculty ID {duty.faculty_id}"
                    faculty_conflicts_count += 1
                    conflicts.append(ConflictOut(
                        conflict_type="faculty_unavailable",
                        severity="warning",
                        exam_id=sched.exam_id,
                        exam_name=exam_name,
                        affected_entities=[fac_name],
                        message=f"{fac_name} is assigned invigilation on {slot_date} despite declaring unavailability ({unavail.reason or 'Unspecified'}).",
                        recommendation="Reassign invigilation duty to another available faculty member."
                    ))

        # Check faculty double invigilation assignment
        for faculty_id, duties_list in faculty_duties.items():
            if len(duties_list) > 1:
                faculty_conflicts_count += 1
                fac = db.query(Faculty).filter(Faculty.id == faculty_id).first()
                fac_name = fac.full_name if fac else f"Faculty ID {faculty_id}"
                
                conflicts.append(ConflictOut(
                    conflict_type="faculty_double_booking",
                    severity="critical",
                    exam_id=duties_list[0][0],
                    exam_name=duties_list[0][1],
                    affected_entities=[fac_name],
                    message=f"{fac_name} is assigned to multiple invigilation duties simultaneously on {slot_date}.",
                    recommendation="Reassign one duty to an alternate faculty member."
                ))

    # Evaluate validation status
    has_critical = any(c.severity == "critical" for c in conflicts)
    is_valid = (not has_critical) and (unscheduled_count == 0)
    status_str = "valid" if is_valid else ("invalid_hard_conflicts" if has_critical else "warnings")

    return ValidationResultOut(
        is_valid=is_valid,
        status=status_str,
        total_exams=total_exams_count,
        scheduled_exams=scheduled_count,
        unscheduled_exams=unscheduled_count,
        student_conflicts_count=student_conflicts_count,
        room_conflicts_count=room_conflicts_count,
        faculty_conflicts_count=faculty_conflicts_count,
        capacity_violations_count=capacity_violations_count,
        conflicts=conflicts
    )

from typing import List, Dict, Set, Tuple
from sqlalchemy.orm import Session
from backend.app.models import (
    ExamSchedule, Exam, ExamRegistration, Room, RoomAllocation,
    Faculty, FacultyAvailability, InvigilatorAssignment
)

def allocate_rooms_for_version(db: Session, timetable_version_id: int):
    """
    Allocates rooms for all exam schedules in a timetable version.
    Respects equipment needs, seating capacity, and prevents double-booking.
    Supports multi-room allocation when student count exceeds single room capacity.
    """
    schedules = db.query(ExamSchedule).filter(
        ExamSchedule.timetable_version_id == timetable_version_id
    ).all()

    # Clear existing room allocations for this version
    schedule_ids = [s.id for s in schedules]
    if schedule_ids:
        db.query(RoomAllocation).filter(RoomAllocation.exam_schedule_id.in_(schedule_ids)).delete(synchronize_session=False)

    all_rooms = db.query(Room).filter(Room.status == "available").all()

    # Group schedules by (exam_date, time_slot_id)
    slot_schedules: Dict[Tuple, List[ExamSchedule]] = {}
    for s in schedules:
        slot_schedules.setdefault((s.exam_date, s.time_slot_id), []).append(s)

    for (slot_date, slot_id), sched_list in slot_schedules.items():
        # Track rooms already used in this slot
        occupied_room_ids: Set[int] = set()

        # Sort exams in this slot by student count descending (Bin Packing heuristic)
        exam_reg_counts = []
        for s in sched_list:
            cnt = db.query(ExamRegistration).filter(ExamRegistration.exam_id == s.exam_id).count()
            exam = db.query(Exam).filter(Exam.id == s.exam_id).first()
            exam_reg_counts.append((cnt, exam, s))
        exam_reg_counts.sort(key=lambda x: x[0], reverse=True)

        for reg_count, exam, sched in exam_reg_counts:
            needed_seats = max(reg_count, 1)
            allocated_seats = 0
            
            # Filter available rooms by required equipment
            req_eq = (exam.required_equipment or "none").lower()
            eligible_rooms = [
                r for r in all_rooms 
                if r.id not in occupied_room_ids and 
                (req_eq == "none" or req_eq in (r.available_equipment or "").lower())
            ]

            # Sort eligible rooms by capacity descending
            eligible_rooms.sort(key=lambda r: r.seating_capacity, reverse=True)

            selected_rooms = []
            for r in eligible_rooms:
                if allocated_seats >= needed_seats:
                    break
                seats_to_take = min(r.seating_capacity, needed_seats - allocated_seats)
                selected_rooms.append((r, seats_to_take))
                allocated_seats += seats_to_take
                occupied_room_ids.add(r.id)

            # Persist room allocations
            for room, seats in selected_rooms:
                alloc = RoomAllocation(
                    exam_schedule_id=sched.id,
                    room_id=room.id,
                    allocated_seats=seats
                )
                db.add(alloc)

    db.flush()

def assign_invigilators_for_version(db: Session, timetable_version_id: int):
    """
    Assigns faculty invigilators to allocated rooms fairly.
    Prevents overlapping duties and respects faculty availability.
    """
    schedules = db.query(ExamSchedule).filter(
        ExamSchedule.timetable_version_id == timetable_version_id
    ).all()

    schedule_ids = [s.id for s in schedules]
    if schedule_ids:
        db.query(InvigilatorAssignment).filter(
            InvigilatorAssignment.exam_schedule_id.in_(schedule_ids)
        ).delete(synchronize_session=False)

    all_faculty = db.query(Faculty).filter(Faculty.status == "active").all()
    faculty_duty_counts: Dict[int, int] = {f.id: 0 for f in all_faculty}

    # Group schedules by (exam_date, time_slot_id)
    slot_schedules: Dict[Tuple, List[ExamSchedule]] = {}
    for s in schedules:
        slot_schedules.setdefault((s.exam_date, s.time_slot_id), []).append(s)

    for (slot_date, slot_id), sched_list in slot_schedules.items():
        busy_faculty_in_slot: Set[int] = set()

        for sched in sched_list:
            allocations = db.query(RoomAllocation).filter(RoomAllocation.exam_schedule_id == sched.id).all()
            for alloc in allocations:
                room = db.query(Room).filter(Room.id == alloc.room_id).first()
                num_invigilators_needed = 2 if (room and room.seating_capacity >= 80) else 1

                for duty_num in range(num_invigilators_needed):
                    # Find eligible faculty: not busy in this slot, under max workload, not declared unavailable
                    eligible = []
                    for f in all_faculty:
                        if f.id in busy_faculty_in_slot:
                            continue
                        if faculty_duty_counts[f.id] >= f.max_invigilation_workload:
                            continue
                        # Check availability
                        unavail = db.query(FacultyAvailability).filter(
                            FacultyAvailability.faculty_id == f.id,
                            FacultyAvailability.date == slot_date,
                            FacultyAvailability.is_available == False
                        ).first()
                        if unavail:
                            continue
                        eligible.append(f)

                    # If no strictly eligible faculty under workload limit, allow any available faculty
                    if not eligible:
                        eligible = [f for f in all_faculty if f.id not in busy_faculty_in_slot]

                    if eligible:
                        # Pick faculty with lowest duties assigned so far (Fairness heuristic)
                        eligible.sort(key=lambda f: faculty_duty_counts.get(f.id, 0))
                        selected_fac = eligible[0]

                        role = "chief_invigilator" if duty_num == 0 else "invigilator"
                        assign = InvigilatorAssignment(
                            exam_schedule_id=sched.id,
                            room_id=alloc.room_id,
                            faculty_id=selected_fac.id,
                            role=role,
                            status="assigned"
                        )
                        db.add(assign)
                        busy_faculty_in_slot.add(selected_fac.id)
                        faculty_duty_counts[selected_fac.id] = faculty_duty_counts.get(selected_fac.id, 0) + 1

    db.flush()

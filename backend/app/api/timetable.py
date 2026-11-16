from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import (
    TimetableVersion, ExamSchedule, Exam, RoomAllocation, InvigilatorAssignment,
    TimetableChange, AuditLog, Student, Faculty, TimeSlot, Room
)
from backend.app.schemas.timetable import (
    TimetableVersionOut, ExamScheduleOut, ExamScheduleUpdate, PublishRequest
)
from backend.app.schemas.room import RoomAllocationOut
from backend.app.schemas.invigilation import InvigilatorAssignmentOut
from backend.app.scheduler.validator import validate_timetable
from backend.app.scheduler.optimizer import allocate_rooms_for_version, assign_invigilators_for_version
from backend.app.notifications.notification_service import broadcast_timetable_published
from backend.app.api.deps import get_current_active_admin, get_current_user

router = APIRouter(prefix="/timetable", tags=["Timetable & Schedules"])

@router.get("/versions", response_model=List[TimetableVersionOut])
def list_timetable_versions(session_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(TimetableVersion)
    if session_id:
        query = query.filter(TimetableVersion.academic_session_id == session_id)
    versions = query.order_by(TimetableVersion.created_at.desc()).all()
    
    results = []
    for v in versions:
        results.append(TimetableVersionOut(
            id=v.id,
            academic_session_id=v.academic_session_id,
            exam_period_id=v.exam_period_id,
            version_number=v.version_number,
            name=v.name,
            status=v.status,
            published_at=v.published_at,
            modification_reason=v.modification_reason,
            solver_status=v.solver_status,
            solver_metrics=v.solver_metrics,
            is_active=v.is_active,
            created_at=v.created_at,
            updated_at=v.updated_at,
            session_name=v.academic_session.name if v.academic_session else None,
            period_name=v.exam_period.name if v.exam_period else None,
            total_exams=len(v.academic_session.semesters) if v.academic_session else 0,
            scheduled_exams_count=len(v.schedules)
        ))
    return results

@router.get("/version/{version_id}/schedules", response_model=List[ExamScheduleOut])
def get_version_schedules(version_id: int, db: Session = Depends(get_db)):
    schedules = db.query(ExamSchedule).filter(
        ExamSchedule.timetable_version_id == version_id
    ).order_by(ExamSchedule.exam_date, ExamSchedule.time_slot_id).all()

    results = []
    for s in schedules:
        exam = s.exam
        slot = s.time_slot
        
        # Room allocations
        room_alloc_outs = []
        for a in s.room_allocations:
            rm = a.room
            room_alloc_outs.append(RoomAllocationOut(
                id=a.id,
                exam_schedule_id=a.exam_schedule_id,
                room_id=a.room_id,
                allocated_seats=a.allocated_seats,
                room_number=rm.room_number if rm else None,
                building=rm.building if rm else None,
                room_type=rm.room_type if rm else None
            ))

        # Invigilation duties
        invig_outs = []
        for iv in s.invigilator_assignments:
            fac = iv.faculty
            rm = iv.room
            invig_outs.append(InvigilatorAssignmentOut(
                id=iv.id,
                exam_schedule_id=iv.exam_schedule_id,
                room_id=iv.room_id,
                faculty_id=iv.faculty_id,
                role=iv.role,
                status=iv.status,
                faculty_name=fac.full_name if fac else None,
                faculty_code=fac.faculty_code if fac else None,
                room_number=rm.room_number if rm else None,
                building=rm.building if rm else None,
                exam_name=exam.exam_name if exam else None,
                exam_date=s.exam_date,
                time_slot_name=slot.name if slot else None
            ))

        results.append(ExamScheduleOut(
            id=s.id,
            timetable_version_id=s.timetable_version_id,
            exam_id=s.exam_id,
            exam_date=s.exam_date,
            time_slot_id=s.time_slot_id,
            is_locked=s.is_locked,
            notes=s.notes,
            created_at=s.created_at,
            exam_name=exam.exam_name if exam else None,
            subject_code=exam.subject.subject_code if exam and exam.subject else None,
            subject_name=exam.subject.subject_name if exam and exam.subject else None,
            exam_type=exam.exam_type if exam else None,
            department_name=exam.department.name if exam and exam.department else None,
            semester_number=exam.semester_number if exam else None,
            expected_students=exam.expected_student_count if exam else 0,
            time_slot_name=slot.name if slot else None,
            start_time=slot.start_time if slot else None,
            end_time=slot.end_time if slot else None,
            room_allocations=room_alloc_outs,
            invigilator_assignments=invig_outs
        ))
    return results

@router.put("/schedule/{schedule_id}")
def update_schedule(
    schedule_id: int,
    upd: ExamScheduleUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_active_admin)
):
    """
    Manual fine-tuning / drag-and-drop rescheduling.
    Validates conflicts immediately and maintains full change history and audit trail.
    """
    sched = db.query(ExamSchedule).filter(ExamSchedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule entry not found")

    old_date = sched.exam_date
    old_slot = sched.time_slot_id

    # Apply proposed change
    sched.exam_date = upd.exam_date
    sched.time_slot_id = upd.time_slot_id
    if upd.notes is not None:
        sched.notes = upd.notes
    if upd.is_locked is not None:
        sched.is_locked = upd.is_locked
    sched.updated_at = datetime.utcnow()
    db.flush()

    # Automatically reallocate rooms & invigilators for updated slot
    allocate_rooms_for_version(db, sched.timetable_version_id)
    assign_invigilators_for_version(db, sched.timetable_version_id)

    # Automatic conflict detection after manual change
    val = validate_timetable(db, sched.timetable_version_id)

    # Record timetable change
    change_record = TimetableChange(
        timetable_version_id=sched.timetable_version_id,
        exam_id=sched.exam_id,
        changed_by=admin.id,
        old_date=old_date,
        new_date=upd.exam_date,
        old_slot_id=old_slot,
        new_slot_id=upd.time_slot_id,
        reason=upd.reason or "Manual schedule change",
        conflicts_detected=[c.dict() for c in val.conflicts]
    )
    db.add(change_record)

    # Audit log
    db.add(AuditLog(
        user_id=admin.id,
        action="SCHEDULE_MANUALLY_EDITED",
        entity="ExamSchedule",
        entity_id=sched.id,
        details={
            "old_date": str(old_date),
            "new_date": str(upd.exam_date),
            "conflicts_count": len(val.conflicts)
        }
    ))

    db.commit()

    return {
        "success": True,
        "message": "Schedule updated successfully",
        "validation": val
    }

@router.post("/publish/{version_id}")
def publish_timetable(
    version_id: int,
    req: PublishRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_active_admin)
):
    """
    Validates and officially publishes a timetable version.
    Rule: Never allow an invalid timetable with hard conflicts to be published!
    """
    version = db.query(TimetableVersion).filter(TimetableVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Timetable version not found")

    # Run independent validation before publishing
    val = validate_timetable(db, version_id)
    if not val.is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish invalid timetable. Found {len(val.conflicts)} conflict(s). Please resolve conflicts first."
        )

    # Archive any currently published versions for this session
    db.query(TimetableVersion).filter(
        TimetableVersion.academic_session_id == version.academic_session_id,
        TimetableVersion.status == "published"
    ).update({"status": "archived"})

    version.status = "published"
    version.published_at = datetime.utcnow()
    version.modification_reason = req.reason or "Officially approved and published"

    # Audit log
    db.add(AuditLog(
        user_id=admin.id,
        action="TIMETABLE_PUBLISHED",
        entity="TimetableVersion",
        entity_id=version.id,
        details={"version_name": version.name, "reason": version.modification_reason}
    ))

    db.commit()

    # Dispatch publication notification to students and faculty
    broadcast_timetable_published(db, version_id)

    return {
        "success": True,
        "message": f"Timetable '{version.name}' published successfully and notifications dispatched."
    }

# Student personalized timetable
@router.get("/student/{student_id}", response_model=List[ExamScheduleOut])
def get_student_timetable(student_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Find published timetable version
    published_version = db.query(TimetableVersion).filter(
        TimetableVersion.status == "published"
    ).order_by(TimetableVersion.published_at.desc()).first()

    # If admin or viewing own profile and no published version, show latest generated/validated
    target_version_id = None
    if published_version:
        target_version_id = published_version.id
    elif user.role == "admin":
        latest = db.query(TimetableVersion).order_by(TimetableVersion.id.desc()).first()
        if latest:
            target_version_id = latest.id

    if not target_version_id:
        return []

    from backend.app.models import ExamRegistration
    registrations = db.query(ExamRegistration).filter(ExamRegistration.student_id == student_id).all()
    exam_ids = [r.exam_id for r in registrations]

    schedules = db.query(ExamSchedule).filter(
        ExamSchedule.timetable_version_id == target_version_id,
        ExamSchedule.exam_id.in_(exam_ids)
    ).order_by(ExamSchedule.exam_date, ExamSchedule.time_slot_id).all()

    results = []
    for s in schedules:
        exam = s.exam
        slot = s.time_slot
        room_alloc_outs = [
            RoomAllocationOut(
                id=a.id,
                exam_schedule_id=a.exam_schedule_id,
                room_id=a.room_id,
                allocated_seats=a.allocated_seats,
                room_number=a.room.room_number if a.room else None,
                building=a.room.building if a.room else None,
                room_type=a.room.room_type if a.room else None
            )
            for a in s.room_allocations
        ]
        results.append(ExamScheduleOut(
            id=s.id,
            timetable_version_id=s.timetable_version_id,
            exam_id=s.exam_id,
            exam_date=s.exam_date,
            time_slot_id=s.time_slot_id,
            is_locked=s.is_locked,
            notes=s.notes,
            created_at=s.created_at,
            exam_name=exam.exam_name if exam else None,
            subject_code=exam.subject.subject_code if exam and exam.subject else None,
            subject_name=exam.subject.subject_name if exam and exam.subject else None,
            exam_type=exam.exam_type if exam else None,
            department_name=exam.department.name if exam and exam.department else None,
            semester_number=exam.semester_number if exam else None,
            expected_students=exam.expected_student_count if exam else 0,
            time_slot_name=slot.name if slot else None,
            start_time=slot.start_time if slot else None,
            end_time=slot.end_time if slot else None,
            room_allocations=room_alloc_outs,
            invigilator_assignments=[]
        ))
    return results

# Faculty personalized invigilation duty roster
@router.get("/faculty/{faculty_id}", response_model=List[ExamScheduleOut])
def get_faculty_roster(faculty_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    published_version = db.query(TimetableVersion).filter(
        TimetableVersion.status == "published"
    ).order_by(TimetableVersion.published_at.desc()).first()

    target_version_id = None
    if published_version:
        target_version_id = published_version.id
    elif user.role == "admin":
        latest = db.query(TimetableVersion).order_by(TimetableVersion.id.desc()).first()
        if latest:
            target_version_id = latest.id

    if not target_version_id:
        return []

    assignments = db.query(InvigilatorAssignment).join(
        ExamSchedule, InvigilatorAssignment.exam_schedule_id == ExamSchedule.id
    ).filter(
        InvigilatorAssignment.faculty_id == faculty_id,
        ExamSchedule.timetable_version_id == target_version_id
    ).all()

    sched_ids = [a.exam_schedule_id for a in assignments]
    schedules = db.query(ExamSchedule).filter(ExamSchedule.id.in_(sched_ids)).order_by(
        ExamSchedule.exam_date, ExamSchedule.time_slot_id
    ).all()

    results = []
    for s in schedules:
        exam = s.exam
        slot = s.time_slot
        room_alloc_outs = [
            RoomAllocationOut(
                id=a.id,
                exam_schedule_id=a.exam_schedule_id,
                room_id=a.room_id,
                allocated_seats=a.allocated_seats,
                room_number=a.room.room_number if a.room else None,
                building=a.room.building if a.room else None,
                room_type=a.room.room_type if a.room else None
            )
            for a in s.room_allocations
        ]
        results.append(ExamScheduleOut(
            id=s.id,
            timetable_version_id=s.timetable_version_id,
            exam_id=s.exam_id,
            exam_date=s.exam_date,
            time_slot_id=s.time_slot_id,
            is_locked=s.is_locked,
            notes=s.notes,
            created_at=s.created_at,
            exam_name=exam.exam_name if exam else None,
            subject_code=exam.subject.subject_code if exam and exam.subject else None,
            subject_name=exam.subject.subject_name if exam and exam.subject else None,
            exam_type=exam.exam_type if exam else None,
            department_name=exam.department.name if exam and exam.department else None,
            semester_number=exam.semester_number if exam else None,
            expected_students=exam.expected_student_count if exam else 0,
            time_slot_name=slot.name if slot else None,
            start_time=slot.start_time if slot else None,
            end_time=slot.end_time if slot else None,
            room_allocations=room_alloc_outs,
            invigilator_assignments=[]
        ))
    return results

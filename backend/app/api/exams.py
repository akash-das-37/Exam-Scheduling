from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Exam, ExamRegistration, ExamPeriod, TimeSlot, Subject, Department, Course, StudentSubject
from backend.app.schemas.exam import (
    ExamCreate, ExamUpdate, ExamOut,
    ExamPeriodCreate, ExamPeriodOut,
    TimeSlotCreate, TimeSlotOut,
    ExamRegistrationCreate, ExamRegistrationOut
)
from backend.app.api.deps import get_current_active_admin, get_current_user

router = APIRouter(prefix="", tags=["Examinations"])

# Exams
@router.get("/exams", response_model=List[ExamOut])
def list_exams(
    department_id: Optional[int] = None,
    course_id: Optional[int] = None,
    semester: Optional[int] = None,
    exam_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Exam)
    if department_id:
        query = query.filter(Exam.department_id == department_id)
    if course_id:
        query = query.filter(Exam.course_id == course_id)
    if semester:
        query = query.filter(Exam.semester_number == semester)
    if exam_type:
        query = query.filter(Exam.exam_type == exam_type)
    if status:
        query = query.filter(Exam.status == status)

    exams = query.all()
    results = []
    for ex in exams:
        results.append(ExamOut(
            id=ex.id,
            subject_id=ex.subject_id,
            exam_name=ex.exam_name,
            exam_type=ex.exam_type,
            department_id=ex.department_id,
            course_id=ex.course_id,
            semester_number=ex.semester_number,
            academic_session_id=ex.academic_session_id,
            date_range_start=ex.date_range_start,
            date_range_end=ex.date_range_end,
            duration_minutes=ex.duration_minutes,
            required_equipment=ex.required_equipment,
            expected_student_count=ex.expected_student_count,
            status=ex.status,
            created_at=ex.created_at,
            subject_code=ex.subject.subject_code if ex.subject else None,
            department_name=ex.department.name if ex.department else None,
            course_name=ex.course.name if ex.course else None,
            registered_students_count=len(ex.registrations)
        ))
    return results

@router.post("/exams", response_model=ExamOut)
def create_exam(ex_in: ExamCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    ex = Exam(
        subject_id=ex_in.subject_id,
        exam_name=ex_in.exam_name,
        exam_type=ex_in.exam_type,
        department_id=ex_in.department_id,
        course_id=ex_in.course_id,
        semester_number=ex_in.semester_number,
        academic_session_id=ex_in.academic_session_id,
        date_range_start=ex_in.date_range_start,
        date_range_end=ex_in.date_range_end,
        duration_minutes=ex_in.duration_minutes,
        required_equipment=ex_in.required_equipment,
        expected_student_count=ex_in.expected_student_count,
        status="pending"
    )
    db.add(ex)
    db.flush()

    # Automatically register students enrolled in this subject
    enrolled_students = db.query(StudentSubject).filter(StudentSubject.subject_id == ex.subject_id).all()
    for idx, reg in enumerate(enrolled_students):
        er = ExamRegistration(
            exam_id=ex.id,
            student_id=reg.student_id,
            is_backlog=reg.is_backlog,
            seat_number=f"S-{idx+1:03d}",
            status="confirmed"
        )
        db.add(er)

    ex.expected_student_count = len(enrolled_students)
    db.commit()
    db.refresh(ex)

    return ExamOut(
        id=ex.id,
        subject_id=ex.subject_id,
        exam_name=ex.exam_name,
        exam_type=ex.exam_type,
        department_id=ex.department_id,
        course_id=ex.course_id,
        semester_number=ex.semester_number,
        academic_session_id=ex.academic_session_id,
        date_range_start=ex.date_range_start,
        date_range_end=ex.date_range_end,
        duration_minutes=ex.duration_minutes,
        required_equipment=ex.required_equipment,
        expected_student_count=ex.expected_student_count,
        status=ex.status,
        created_at=ex.created_at,
        subject_code=ex.subject.subject_code if ex.subject else None,
        department_name=ex.department.name if ex.department else None,
        course_name=ex.course.name if ex.course else None,
        registered_students_count=len(ex.registrations)
    )

@router.put("/exams/{exam_id}", response_model=ExamOut)
def update_exam(exam_id: int, ex_in: ExamUpdate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    ex = db.query(Exam).filter(Exam.id == exam_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exam not found")

    if ex_in.exam_name is not None:
        ex.exam_name = ex_in.exam_name
    if ex_in.exam_type is not None:
        ex.exam_type = ex_in.exam_type
    if ex_in.date_range_start is not None:
        ex.date_range_start = ex_in.date_range_start
    if ex_in.date_range_end is not None:
        ex.date_range_end = ex_in.date_range_end
    if ex_in.duration_minutes is not None:
        ex.duration_minutes = ex_in.duration_minutes
    if ex_in.required_equipment is not None:
        ex.required_equipment = ex_in.required_equipment
    if ex_in.status is not None:
        ex.status = ex_in.status

    db.commit()
    db.refresh(ex)
    return ExamOut(
        id=ex.id,
        subject_id=ex.subject_id,
        exam_name=ex.exam_name,
        exam_type=ex.exam_type,
        department_id=ex.department_id,
        course_id=ex.course_id,
        semester_number=ex.semester_number,
        academic_session_id=ex.academic_session_id,
        date_range_start=ex.date_range_start,
        date_range_end=ex.date_range_end,
        duration_minutes=ex.duration_minutes,
        required_equipment=ex.required_equipment,
        expected_student_count=ex.expected_student_count,
        status=ex.status,
        created_at=ex.created_at,
        subject_code=ex.subject.subject_code if ex.subject else None,
        department_name=ex.department.name if ex.department else None,
        course_name=ex.course.name if ex.course else None,
        registered_students_count=len(ex.registrations)
    )

@router.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    ex = db.query(Exam).filter(Exam.id == exam_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(ex)
    db.commit()
    return {"message": "Exam deleted successfully"}

# Exam Periods
@router.get("/exam-periods", response_model=List[ExamPeriodOut])
def list_exam_periods(db: Session = Depends(get_db)):
    return db.query(ExamPeriod).all()

@router.post("/exam-periods", response_model=ExamPeriodOut)
def create_exam_period(period_in: ExamPeriodCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    period = ExamPeriod(
        academic_session_id=period_in.academic_session_id,
        name=period_in.name,
        start_date=period_in.start_date,
        end_date=period_in.end_date,
        available_days=period_in.available_days,
        holidays=period_in.holidays,
        status=period_in.status
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return period

# Time Slots
@router.get("/time-slots", response_model=List[TimeSlotOut])
def list_time_slots(db: Session = Depends(get_db)):
    return db.query(TimeSlot).all()

@router.post("/time-slots", response_model=TimeSlotOut)
def create_time_slot(ts_in: TimeSlotCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    ts = TimeSlot(
        name=ts_in.name,
        start_time=ts_in.start_time,
        end_time=ts_in.end_time,
        session_type=ts_in.session_type,
        is_active=ts_in.is_active
    )
    db.add(ts)
    db.commit()
    db.refresh(ts)
    return ts

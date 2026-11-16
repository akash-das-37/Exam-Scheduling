from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Subject, StudentSubject, BacklogRecord, Student, Department, Course, Exam, ExamRegistration
from backend.app.schemas.subject import (
    SubjectCreate, SubjectUpdate, SubjectOut,
    StudentSubjectCreate, StudentSubjectOut,
    BacklogRecordCreate, BacklogRecordOut
)
from backend.app.api.deps import get_current_active_admin, get_current_user

router = APIRouter(prefix="", tags=["Subjects & Registrations"])

# Subjects
@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(
    department_id: Optional[int] = None,
    course_id: Optional[int] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Subject)
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    if course_id:
        query = query.filter(Subject.course_id == course_id)
    if semester:
        query = query.filter(Subject.semester_number == semester)

    subjects = query.all()
    results = []
    for sb in subjects:
        results.append(SubjectOut(
            id=sb.id,
            subject_code=sb.subject_code,
            subject_name=sb.subject_name,
            department_id=sb.department_id,
            course_id=sb.course_id,
            semester_number=sb.semester_number,
            subject_type=sb.subject_type,
            credits=sb.credits,
            exam_duration_minutes=sb.exam_duration_minutes,
            required_equipment=sb.required_equipment,
            status=sb.status,
            department_name=sb.department.name if sb.department else None,
            course_name=sb.course.name if sb.course else None,
            registered_students_count=len(sb.student_registrations)
        ))
    return results

@router.post("/subjects", response_model=SubjectOut)
def create_subject(sb_in: SubjectCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    existing = db.query(Subject).filter(Subject.subject_code == sb_in.subject_code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject with this code already exists")

    sb = Subject(
        subject_code=sb_in.subject_code.upper(),
        subject_name=sb_in.subject_name,
        department_id=sb_in.department_id,
        course_id=sb_in.course_id,
        semester_number=sb_in.semester_number,
        subject_type=sb_in.subject_type,
        credits=sb_in.credits,
        exam_duration_minutes=sb_in.exam_duration_minutes,
        required_equipment=sb_in.required_equipment,
        status=sb_in.status
    )
    db.add(sb)
    db.commit()
    db.refresh(sb)
    return SubjectOut(
        id=sb.id,
        subject_code=sb.subject_code,
        subject_name=sb.subject_name,
        department_id=sb.department_id,
        course_id=sb.course_id,
        semester_number=sb.semester_number,
        subject_type=sb.subject_type,
        credits=sb.credits,
        exam_duration_minutes=sb.exam_duration_minutes,
        required_equipment=sb.required_equipment,
        status=sb.status,
        department_name=sb.department.name if sb.department else None,
        course_name=sb.course.name if sb.course else None,
        registered_students_count=0
    )

@router.put("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, sb_in: SubjectUpdate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    sb = db.query(Subject).filter(Subject.id == subject_id).first()
    if not sb:
        raise HTTPException(status_code=404, detail="Subject not found")

    if sb_in.subject_name is not None:
        sb.subject_name = sb_in.subject_name
    if sb_in.department_id is not None:
        sb.department_id = sb_in.department_id
    if sb_in.course_id is not None:
        sb.course_id = sb_in.course_id
    if sb_in.semester_number is not None:
        sb.semester_number = sb_in.semester_number
    if sb_in.subject_type is not None:
        sb.subject_type = sb_in.subject_type
    if sb_in.credits is not None:
        sb.credits = sb_in.credits
    if sb_in.exam_duration_minutes is not None:
        sb.exam_duration_minutes = sb_in.exam_duration_minutes
    if sb_in.required_equipment is not None:
        sb.required_equipment = sb_in.required_equipment
    if sb_in.status is not None:
        sb.status = sb_in.status

    db.commit()
    db.refresh(sb)
    return SubjectOut(
        id=sb.id,
        subject_code=sb.subject_code,
        subject_name=sb.subject_name,
        department_id=sb.department_id,
        course_id=sb.course_id,
        semester_number=sb.semester_number,
        subject_type=sb.subject_type,
        credits=sb.credits,
        exam_duration_minutes=sb.exam_duration_minutes,
        required_equipment=sb.required_equipment,
        status=sb.status,
        department_name=sb.department.name if sb.department else None,
        course_name=sb.course.name if sb.course else None,
        registered_students_count=len(sb.student_registrations)
    )

# Student Subject Registrations
@router.get("/registrations", response_model=List[StudentSubjectOut])
def list_registrations(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(StudentSubject)
    if student_id:
        query = query.filter(StudentSubject.student_id == student_id)
    if subject_id:
        query = query.filter(StudentSubject.subject_id == subject_id)

    regs = query.all()
    results = []
    for r in regs:
        results.append(StudentSubjectOut(
            id=r.id,
            student_id=r.student_id,
            subject_id=r.subject_id,
            is_backlog=r.is_backlog,
            registration_date=r.registration_date,
            status=r.status,
            subject_code=r.subject.subject_code if r.subject else None,
            subject_name=r.subject.subject_name if r.subject else None,
            student_name=r.student.full_name if r.student else None,
            roll_number=r.student.roll_number if r.student else None
        ))
    return results

@router.post("/registrations", response_model=StudentSubjectOut)
def register_student_subject(reg_in: StudentSubjectCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    existing = db.query(StudentSubject).filter(
        StudentSubject.student_id == reg_in.student_id,
        StudentSubject.subject_id == reg_in.subject_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student is already registered for this subject")

    reg = StudentSubject(
        student_id=reg_in.student_id,
        subject_id=reg_in.subject_id,
        academic_session_id=reg_in.academic_session_id,
        is_backlog=reg_in.is_backlog,
        status="registered"
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return StudentSubjectOut(
        id=reg.id,
        student_id=reg.student_id,
        subject_id=reg.subject_id,
        is_backlog=reg.is_backlog,
        registration_date=reg.registration_date,
        status=reg.status,
        subject_code=reg.subject.subject_code if reg.subject else None,
        subject_name=reg.subject.subject_name if reg.subject else None,
        student_name=reg.student.full_name if reg.student else None,
        roll_number=reg.student.roll_number if reg.student else None
    )

# Backlogs
@router.get("/backlog", response_model=List[BacklogRecordOut])
def list_backlogs(student_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(BacklogRecord)
    if student_id:
        query = query.filter(BacklogRecord.student_id == student_id)
    records = query.all()
    results = []
    for b in records:
        results.append(BacklogRecordOut(
            id=b.id,
            student_id=b.student_id,
            subject_id=b.subject_id,
            failed_session_id=b.failed_session_id,
            status=b.status,
            attempts_count=b.attempts_count,
            remarks=b.remarks,
            created_at=b.created_at,
            student_name=b.student.full_name if b.student else None,
            roll_number=b.student.roll_number if b.student else None,
            subject_code=b.subject.subject_code if b.subject else None,
            subject_name=b.subject.subject_name if b.subject else None
        ))
    return results

@router.post("/backlog", response_model=BacklogRecordOut)
def record_backlog(b_in: BacklogRecordCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    b = BacklogRecord(
        student_id=b_in.student_id,
        subject_id=b_in.subject_id,
        failed_session_id=b_in.failed_session_id,
        status="pending",
        attempts_count=1,
        remarks=b_in.remarks
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return BacklogRecordOut(
        id=b.id,
        student_id=b.student_id,
        subject_id=b.subject_id,
        failed_session_id=b.failed_session_id,
        status=b.status,
        attempts_count=b.attempts_count,
        remarks=b.remarks,
        created_at=b.created_at,
        student_name=b.student.full_name if b.student else None,
        roll_number=b.student.roll_number if b.student else None,
        subject_code=b.subject.subject_code if b.subject else None,
        subject_name=b.subject.subject_name if b.subject else None
    )

@router.post("/backlog/register")
def register_backlog_exam(backlog_id: int, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    b = db.query(BacklogRecord).filter(BacklogRecord.id == backlog_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Backlog record not found")

    # Enroll in student_subjects as backlog
    existing_ss = db.query(StudentSubject).filter(
        StudentSubject.student_id == b.student_id,
        StudentSubject.subject_id == b.subject_id
    ).first()
    if not existing_ss:
        ss = StudentSubject(
            student_id=b.student_id,
            subject_id=b.subject_id,
            is_backlog=True,
            status="registered"
        )
        db.add(ss)

    b.status = "registered"
    db.commit()
    return {"message": "Backlog student successfully registered for examination session"}

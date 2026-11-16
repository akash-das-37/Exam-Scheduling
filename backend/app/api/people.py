from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.models import Student, Faculty, User, UserRole, Department, Course, InvigilatorAssignment
from backend.app.schemas.people import (
    StudentCreate, StudentUpdate, StudentOut,
    FacultyCreate, FacultyUpdate, FacultyOut
)
from backend.app.api.deps import get_current_active_admin, get_current_user
from backend.app.reports.excel_handler import export_students_excel, import_students_excel

router = APIRouter(prefix="", tags=["Students & Faculty"])

# Students
@router.get("/students", response_model=List[StudentOut])
def list_students(
    department_id: Optional[int] = None,
    course_id: Optional[int] = None,
    semester: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Student)
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if course_id:
        query = query.filter(Student.course_id == course_id)
    if semester:
        query = query.filter(Student.current_semester_number == semester)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Student.full_name.ilike(search_pattern)) |
            (Student.roll_number.ilike(search_pattern)) |
            (Student.email.ilike(search_pattern))
        )
    
    students = query.offset(skip).limit(limit).all()
    results = []
    for st in students:
        results.append(StudentOut(
            id=st.id,
            user_id=st.user_id,
            roll_number=st.roll_number,
            full_name=st.full_name,
            email=st.email,
            phone=st.phone,
            department_id=st.department_id,
            course_id=st.course_id,
            current_semester_number=st.current_semester_number,
            academic_session_id=st.academic_session_id,
            enrollment_year=st.enrollment_year,
            status=st.status,
            created_at=st.created_at,
            department_name=st.department.name if st.department else None,
            course_name=st.course.name if st.course else None,
            registered_subjects_count=len(st.subject_registrations),
            backlog_count=len(st.backlogs)
        ))
    return results

@router.get("/students/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    st = db.query(Student).filter(Student.id == student_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentOut(
        id=st.id,
        user_id=st.user_id,
        roll_number=st.roll_number,
        full_name=st.full_name,
        email=st.email,
        phone=st.phone,
        department_id=st.department_id,
        course_id=st.course_id,
        current_semester_number=st.current_semester_number,
        academic_session_id=st.academic_session_id,
        enrollment_year=st.enrollment_year,
        status=st.status,
        created_at=st.created_at,
        department_name=st.department.name if st.department else None,
        course_name=st.course.name if st.course else None,
        registered_subjects_count=len(st.subject_registrations),
        backlog_count=len(st.backlogs)
    )

@router.post("/students", response_model=StudentOut)
def create_student(st_in: StudentCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    existing = db.query(Student).filter(
        (Student.roll_number == st_in.roll_number) | (Student.email == st_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student with this roll number or email already exists")

    # Create user
    user = User(
        email=st_in.email,
        hashed_password=get_password_hash(st_in.password or "student123"),
        full_name=st_in.full_name,
        role=UserRole.STUDENT.value,
        phone=st_in.phone,
        is_active=True
    )
    db.add(user)
    db.flush()

    student = Student(
        user_id=user.id,
        roll_number=st_in.roll_number,
        full_name=st_in.full_name,
        email=st_in.email,
        phone=st_in.phone,
        department_id=st_in.department_id,
        course_id=st_in.course_id,
        current_semester_number=st_in.current_semester_number,
        academic_session_id=st_in.academic_session_id,
        enrollment_year=st_in.enrollment_year,
        status=st_in.status
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return get_student(student.id, db)

@router.put("/students/{student_id}", response_model=StudentOut)
def update_student(student_id: int, st_in: StudentUpdate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    st = db.query(Student).filter(Student.id == student_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")

    if st_in.full_name is not None:
        st.full_name = st_in.full_name
        if st.user:
            st.user.full_name = st_in.full_name
    if st_in.email is not None:
        st.email = st_in.email
        if st.user:
            st.user.email = st_in.email
    if st_in.phone is not None:
        st.phone = st_in.phone
        if st.user:
            st.user.phone = st_in.phone
    if st_in.department_id is not None:
        st.department_id = st_in.department_id
    if st_in.course_id is not None:
        st.course_id = st_in.course_id
    if st_in.current_semester_number is not None:
        st.current_semester_number = st_in.current_semester_number
    if st_in.status is not None:
        st.status = st_in.status

    db.commit()
    db.refresh(st)
    return get_student(st.id, db)

@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    st = db.query(Student).filter(Student.id == student_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    st.status = "inactive"
    if st.user:
        st.user.is_active = False
    db.commit()
    return {"message": "Student deactivated successfully"}

@router.get("/students-export/excel")
def export_students(db: Session = Depends(get_db)):
    xlsx_bytes = export_students_excel(db)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students_roster.xlsx"}
    )

@router.post("/students-import/excel")
async def import_students(file: UploadFile = File(...), db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    contents = await file.read()
    result = import_students_excel(db, contents)
    return result

# Faculty
@router.get("/faculty", response_model=List[FacultyOut])
def list_faculty(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Faculty)
    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    faculty_list = query.all()
    results = []
    for f in faculty_list:
        results.append(FacultyOut(
            id=f.id,
            user_id=f.user_id,
            faculty_code=f.faculty_code,
            full_name=f.full_name,
            email=f.email,
            phone=f.phone,
            department_id=f.department_id,
            designation=f.designation,
            max_invigilation_workload=f.max_invigilation_workload,
            status=f.status,
            created_at=f.created_at,
            department_name=f.department.name if f.department else None,
            assigned_duties_count=len(f.invigilation_duties)
        ))
    return results

@router.post("/faculty", response_model=FacultyOut)
def create_faculty(f_in: FacultyCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    existing = db.query(Faculty).filter(
        (Faculty.faculty_code == f_in.faculty_code) | (Faculty.email == f_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Faculty with this code or email already exists")

    user = User(
        email=f_in.email,
        hashed_password=get_password_hash(f_in.password or "faculty123"),
        full_name=f_in.full_name,
        role=UserRole.FACULTY.value,
        phone=f_in.phone,
        is_active=True
    )
    db.add(user)
    db.flush()

    fac = Faculty(
        user_id=user.id,
        faculty_code=f_in.faculty_code,
        full_name=f_in.full_name,
        email=f_in.email,
        phone=f_in.phone,
        department_id=f_in.department_id,
        designation=f_in.designation,
        max_invigilation_workload=f_in.max_invigilation_workload,
        status=f_in.status
    )
    db.add(fac)
    db.commit()
    db.refresh(fac)
    return FacultyOut(
        id=fac.id,
        user_id=fac.user_id,
        faculty_code=fac.faculty_code,
        full_name=fac.full_name,
        email=fac.email,
        phone=fac.phone,
        department_id=fac.department_id,
        designation=fac.designation,
        max_invigilation_workload=fac.max_invigilation_workload,
        status=fac.status,
        created_at=fac.created_at,
        department_name=fac.department.name if fac.department else None,
        assigned_duties_count=0
    )

@router.put("/faculty/{faculty_id}", response_model=FacultyOut)
def update_faculty(faculty_id: int, f_in: FacultyUpdate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    fac = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")

    if f_in.full_name is not None:
        fac.full_name = f_in.full_name
        if fac.user:
            fac.user.full_name = f_in.full_name
    if f_in.email is not None:
        fac.email = f_in.email
        if fac.user:
            fac.user.email = f_in.email
    if f_in.phone is not None:
        fac.phone = f_in.phone
        if fac.user:
            fac.user.phone = f_in.phone
    if f_in.department_id is not None:
        fac.department_id = f_in.department_id
    if f_in.designation is not None:
        fac.designation = f_in.designation
    if f_in.max_invigilation_workload is not None:
        fac.max_invigilation_workload = f_in.max_invigilation_workload
    if f_in.status is not None:
        fac.status = f_in.status

    db.commit()
    db.refresh(fac)
    return FacultyOut(
        id=fac.id,
        user_id=fac.user_id,
        faculty_code=fac.faculty_code,
        full_name=fac.full_name,
        email=fac.email,
        phone=fac.phone,
        department_id=fac.department_id,
        designation=fac.designation,
        max_invigilation_workload=fac.max_invigilation_workload,
        status=fac.status,
        created_at=fac.created_at,
        department_name=fac.department.name if fac.department else None,
        assigned_duties_count=len(fac.invigilation_duties)
    )

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Department, AcademicSession, Course, Semester
from backend.app.schemas.academic import (
    DepartmentCreate, DepartmentOut,
    AcademicSessionCreate, AcademicSessionOut,
    CourseCreate, CourseOut,
    SemesterCreate, SemesterOut
)
from backend.app.api.deps import get_current_active_admin, get_current_user

router = APIRouter(prefix="", tags=["Academic Management"])

# Departments
@router.get("/departments", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    results = []
    for d in depts:
        results.append(DepartmentOut(
            id=d.id,
            name=d.name,
            code=d.code,
            description=d.description,
            status=d.status,
            created_at=d.created_at,
            courses_count=len(d.courses),
            students_count=len(d.students),
            faculty_count=len(d.faculty)
        ))
    return results

@router.post("/departments", response_model=DepartmentOut)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    existing = db.query(Department).filter(Department.code == dept_in.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this code already exists")
    dept = Department(
        name=dept_in.name,
        code=dept_in.code.upper(),
        description=dept_in.description,
        status=dept_in.status
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return DepartmentOut(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        status=dept.status,
        created_at=dept.created_at,
        courses_count=0,
        students_count=0,
        faculty_count=0
    )

@router.put("/departments/{dept_id}", response_model=DepartmentOut)
def update_department(dept_id: int, dept_in: DepartmentCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.name = dept_in.name
    dept.code = dept_in.code.upper()
    dept.description = dept_in.description
    dept.status = dept_in.status
    db.commit()
    db.refresh(dept)
    return DepartmentOut(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        status=dept.status,
        created_at=dept.created_at,
        courses_count=len(dept.courses),
        students_count=len(dept.students),
        faculty_count=len(dept.faculty)
    )

# Academic Sessions
@router.get("/academic-sessions", response_model=List[AcademicSessionOut])
def list_academic_sessions(db: Session = Depends(get_db)):
    return db.query(AcademicSession).all()

@router.post("/academic-sessions", response_model=AcademicSessionOut)
def create_academic_session(sess_in: AcademicSessionCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    if sess_in.is_current:
        db.query(AcademicSession).update({"is_current": False})
    sess = AcademicSession(
        name=sess_in.name,
        start_date=sess_in.start_date,
        end_date=sess_in.end_date,
        is_current=sess_in.is_current,
        status=sess_in.status
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return sess

# Courses
@router.get("/courses", response_model=List[CourseOut])
def list_courses(department_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if department_id:
        query = query.filter(Course.department_id == department_id)
    courses = query.all()
    results = []
    for c in courses:
        results.append(CourseOut(
            id=c.id,
            name=c.name,
            code=c.code,
            department_id=c.department_id,
            duration_years=c.duration_years,
            total_semesters=c.total_semesters,
            status=c.status,
            department_name=c.department.name if c.department else None
        ))
    return results

@router.post("/courses", response_model=CourseOut)
def create_course(c_in: CourseCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    course = Course(
        name=c_in.name,
        code=c_in.code.upper(),
        department_id=c_in.department_id,
        duration_years=c_in.duration_years,
        total_semesters=c_in.total_semesters,
        status=c_in.status
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseOut(
        id=course.id,
        name=course.name,
        code=course.code,
        department_id=course.department_id,
        duration_years=course.duration_years,
        total_semesters=course.total_semesters,
        status=course.status,
        department_name=course.department.name if course.department else None
    )

# Semesters
@router.get("/semesters", response_model=List[SemesterOut])
def list_semesters(course_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Semester)
    if course_id:
        query = query.filter(Semester.course_id == course_id)
    semesters = query.all()
    results = []
    for s in semesters:
        results.append(SemesterOut(
            id=s.id,
            semester_number=s.semester_number,
            course_id=s.course_id,
            academic_session_id=s.academic_session_id,
            start_date=s.start_date,
            end_date=s.end_date,
            status=s.status,
            course_name=s.course.name if s.course else None,
            session_name=s.academic_session.name if s.academic_session else None
        ))
    return results

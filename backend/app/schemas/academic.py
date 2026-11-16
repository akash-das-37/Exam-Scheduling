from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    status: str = "active"

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    created_at: datetime
    courses_count: Optional[int] = 0
    students_count: Optional[int] = 0
    faculty_count: Optional[int] = 0

    class Config:
        from_attributes = True

class AcademicSessionBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_current: bool = False
    status: str = "active"

class AcademicSessionCreate(AcademicSessionBase):
    pass

class AcademicSessionOut(AcademicSessionBase):
    id: int

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    name: str
    code: str
    department_id: int
    duration_years: int = 4
    total_semesters: int = 8
    status: str = "active"

class CourseCreate(CourseBase):
    pass

class CourseOut(CourseBase):
    id: int
    department_name: Optional[str] = None

    class Config:
        from_attributes = True

class SemesterBase(BaseModel):
    semester_number: int
    course_id: int
    academic_session_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "active"

class SemesterCreate(SemesterBase):
    pass

class SemesterOut(SemesterBase):
    id: int
    course_name: Optional[str] = None
    session_name: Optional[str] = None

    class Config:
        from_attributes = True

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class StudentBase(BaseModel):
    roll_number: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: int
    course_id: int
    current_semester_number: int = 1
    academic_session_id: Optional[int] = None
    enrollment_year: int
    status: str = "active"

class StudentCreate(StudentBase):
    password: Optional[str] = "student123"

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    course_id: Optional[int] = None
    current_semester_number: Optional[int] = None
    academic_session_id: Optional[int] = None
    status: Optional[str] = None

class StudentOut(StudentBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    department_name: Optional[str] = None
    course_name: Optional[str] = None
    registered_subjects_count: Optional[int] = 0
    backlog_count: Optional[int] = 0

    class Config:
        from_attributes = True

class FacultyBase(BaseModel):
    faculty_code: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: int
    designation: str = "Assistant Professor"
    max_invigilation_workload: int = 6
    status: str = "active"

class FacultyCreate(FacultyBase):
    password: Optional[str] = "faculty123"

class FacultyUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    max_invigilation_workload: Optional[int] = None
    status: Optional[str] = None

class FacultyOut(FacultyBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    department_name: Optional[str] = None
    assigned_duties_count: Optional[int] = 0

    class Config:
        from_attributes = True

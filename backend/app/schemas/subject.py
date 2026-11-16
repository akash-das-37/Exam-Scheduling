from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SubjectBase(BaseModel):
    subject_code: str
    subject_name: str
    department_id: int
    course_id: int
    semester_number: int
    subject_type: str = "theory"  # theory, practical, lab, elective
    credits: int = 3
    exam_duration_minutes: int = 180
    required_equipment: Optional[str] = None
    status: str = "active"

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    subject_name: Optional[str] = None
    department_id: Optional[int] = None
    course_id: Optional[int] = None
    semester_number: Optional[int] = None
    subject_type: Optional[str] = None
    credits: Optional[int] = None
    exam_duration_minutes: Optional[int] = None
    required_equipment: Optional[str] = None
    status: Optional[str] = None

class SubjectOut(SubjectBase):
    id: int
    department_name: Optional[str] = None
    course_name: Optional[str] = None
    registered_students_count: Optional[int] = 0

    class Config:
        from_attributes = True

class StudentSubjectCreate(BaseModel):
    student_id: int
    subject_id: int
    academic_session_id: Optional[int] = None
    is_backlog: bool = False

class StudentSubjectOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    is_backlog: bool
    registration_date: datetime
    status: str
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    student_name: Optional[str] = None
    roll_number: Optional[str] = None

    class Config:
        from_attributes = True

class BacklogRecordCreate(BaseModel):
    student_id: int
    subject_id: int
    failed_session_id: Optional[int] = None
    remarks: Optional[str] = None

class BacklogRecordOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    failed_session_id: Optional[int] = None
    status: str
    attempts_count: int
    remarks: Optional[str] = None
    created_at: datetime
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None

    class Config:
        from_attributes = True

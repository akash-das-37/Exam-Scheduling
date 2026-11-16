from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime

class ExamPeriodBase(BaseModel):
    academic_session_id: int
    name: str
    start_date: date
    end_date: date
    available_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    holidays: List[str] = []
    status: str = "active"

class ExamPeriodCreate(ExamPeriodBase):
    pass

class ExamPeriodOut(ExamPeriodBase):
    id: int

    class Config:
        from_attributes = True

class TimeSlotBase(BaseModel):
    name: str
    start_time: str
    end_time: str
    session_type: str = "morning"
    is_active: bool = True

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotOut(TimeSlotBase):
    id: int

    class Config:
        from_attributes = True

class ExamBase(BaseModel):
    subject_id: int
    exam_name: str
    exam_type: str = "regular"  # regular, backlog, supplementary, practical, internal, end_semester
    department_id: int
    course_id: int
    semester_number: int
    academic_session_id: int
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None
    duration_minutes: int = 180
    required_equipment: Optional[str] = None
    expected_student_count: int = 0
    status: str = "pending"

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    exam_name: Optional[str] = None
    exam_type: Optional[str] = None
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None
    duration_minutes: Optional[int] = None
    required_equipment: Optional[str] = None
    status: Optional[str] = None

class ExamOut(ExamBase):
    id: int
    created_at: datetime
    subject_code: Optional[str] = None
    department_name: Optional[str] = None
    course_name: Optional[str] = None
    registered_students_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ExamRegistrationCreate(BaseModel):
    exam_id: int
    student_id: int
    is_backlog: bool = False
    seat_number: Optional[str] = None

class ExamRegistrationOut(BaseModel):
    id: int
    exam_id: int
    student_id: int
    is_backlog: bool
    seat_number: Optional[str] = None
    status: str
    registered_at: datetime
    student_name: Optional[str] = None
    roll_number: Optional[str] = None

    class Config:
        from_attributes = True

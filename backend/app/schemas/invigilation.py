from pydantic import BaseModel
from typing import Optional
from datetime import date

class FacultyAvailabilityBase(BaseModel):
    faculty_id: int
    date: date
    time_slot_id: Optional[int] = None
    is_available: bool = True
    reason: Optional[str] = None

class FacultyAvailabilityCreate(FacultyAvailabilityBase):
    pass

class FacultyAvailabilityOut(FacultyAvailabilityBase):
    id: int
    faculty_name: Optional[str] = None
    time_slot_name: Optional[str] = None

    class Config:
        from_attributes = True

class InvigilatorAssignmentBase(BaseModel):
    exam_schedule_id: int
    room_id: int
    faculty_id: int
    role: str = "invigilator"  # chief_invigilator, invigilator, reliever
    status: str = "assigned"

class InvigilatorAssignmentCreate(InvigilatorAssignmentBase):
    pass

class InvigilatorAssignmentOut(InvigilatorAssignmentBase):
    id: int
    faculty_name: Optional[str] = None
    faculty_code: Optional[str] = None
    room_number: Optional[str] = None
    building: Optional[str] = None
    exam_name: Optional[str] = None
    exam_date: Optional[date] = None
    time_slot_name: Optional[str] = None

    class Config:
        from_attributes = True

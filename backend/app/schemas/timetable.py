from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from backend.app.schemas.room import RoomAllocationOut
from backend.app.schemas.invigilation import InvigilatorAssignmentOut

class ExamScheduleOut(BaseModel):
    id: int
    timetable_version_id: int
    exam_id: int
    exam_date: date
    time_slot_id: int
    is_locked: bool
    notes: Optional[str] = None
    created_at: datetime
    # Expanded details
    exam_name: Optional[str] = None
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    exam_type: Optional[str] = None
    department_name: Optional[str] = None
    semester_number: Optional[int] = None
    expected_students: Optional[int] = 0
    time_slot_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room_allocations: List[RoomAllocationOut] = []
    invigilator_assignments: List[InvigilatorAssignmentOut] = []

    class Config:
        from_attributes = True

class ExamScheduleUpdate(BaseModel):
    exam_date: date
    time_slot_id: int
    room_ids: Optional[List[int]] = None
    faculty_ids: Optional[List[int]] = None
    is_locked: Optional[bool] = None
    notes: Optional[str] = None
    reason: Optional[str] = "Manual schedule modification"

class TimetableVersionOut(BaseModel):
    id: int
    academic_session_id: int
    exam_period_id: Optional[int] = None
    version_number: int
    name: str
    status: str
    published_at: Optional[datetime] = None
    modification_reason: Optional[str] = None
    solver_status: Optional[str] = None
    solver_metrics: Optional[Dict[str, Any]] = {}
    is_active: bool
    created_at: datetime
    updated_at: datetime
    session_name: Optional[str] = None
    period_name: Optional[str] = None
    total_exams: Optional[int] = 0
    scheduled_exams_count: Optional[int] = 0

    class Config:
        from_attributes = True

class GenerateRequest(BaseModel):
    academic_session_id: int
    exam_period_id: Optional[int] = None
    name: Optional[str] = "Generated Schedule"
    max_solve_time_seconds: int = 30
    weights: Optional[Dict[str, int]] = None  # e.g. {"min_student_gap_days": 30, "balance_daily_load": 20}

class RegenerateRequest(BaseModel):
    timetable_version_id: int
    exam_ids: List[int]
    max_solve_time_seconds: int = 15

class ConflictOut(BaseModel):
    conflict_type: str  # student_clash, room_double_booking, room_capacity_exceeded, faculty_clash, date_out_of_range
    severity: str       # critical, warning
    exam_id: int
    exam_name: str
    affected_entities: List[str]
    message: str
    recommendation: str

class ValidationResultOut(BaseModel):
    is_valid: bool
    status: str  # valid, invalid_hard_conflicts, warnings
    total_exams: int
    scheduled_exams: int
    unscheduled_exams: int
    student_conflicts_count: int
    room_conflicts_count: int
    faculty_conflicts_count: int
    capacity_violations_count: int
    conflicts: List[ConflictOut]

class RecommendSlotRequest(BaseModel):
    timetable_version_id: int
    exam_id: int

class RecommendedSlotOut(BaseModel):
    exam_date: date
    time_slot_id: int
    time_slot_name: str
    score: float
    reasons: List[str]
    student_clash_count: int
    available_rooms: List[str]
    total_spare_capacity: int
    is_feasible: bool

class PublishRequest(BaseModel):
    reason: Optional[str] = "Approved and published by Examination Board"

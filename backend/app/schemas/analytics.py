from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardStatsOut(BaseModel):
    total_students: int
    total_faculty: int
    total_departments: int
    total_subjects: int
    total_exams: int
    total_rooms: int
    total_room_capacity: int
    scheduled_exams: int
    unscheduled_exams: int
    backlog_registrations_count: int
    detected_conflicts_count: int
    active_timetable_version: Optional[str] = None
    active_timetable_status: Optional[str] = None

class DateDistributionChart(BaseModel):
    date: str
    count: int

class DepartmentDistributionChart(BaseModel):
    department_name: str
    department_code: str
    exam_count: int

class ExamTypeDistributionChart(BaseModel):
    type: str
    count: int

class RoomUtilizationChart(BaseModel):
    room_number: str
    utilization_percentage: float
    total_slots_used: int

class FacultyWorkloadChart(BaseModel):
    faculty_name: str
    duties_assigned: int
    max_workload: int

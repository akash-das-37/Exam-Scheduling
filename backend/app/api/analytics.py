from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.models import (
    Student, Faculty, Department, Subject, Exam, Room, ExamRegistration,
    TimetableVersion, ExamSchedule, RoomAllocation, InvigilatorAssignment,
    BacklogRecord
)
from backend.app.schemas.analytics import (
    DashboardStatsOut, DateDistributionChart, DepartmentDistributionChart,
    ExamTypeDistributionChart, RoomUtilizationChart, FacultyWorkloadChart
)
from backend.app.scheduler.validator import validate_timetable

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])

@router.get("/dashboard", response_model=DashboardStatsOut)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_students = db.query(Student).count()
    total_faculty = db.query(Faculty).count()
    total_departments = db.query(Department).count()
    total_subjects = db.query(Subject).count()
    total_exams = db.query(Exam).count()
    total_rooms = db.query(Room).count()
    total_room_capacity = db.query(func.sum(Room.seating_capacity)).scalar() or 0

    # Get latest active timetable version
    latest_version = db.query(TimetableVersion).order_by(TimetableVersion.id.desc()).first()
    
    scheduled_exams = 0
    detected_conflicts = 0
    active_version_name = None
    active_version_status = None

    if latest_version:
        active_version_name = latest_version.name
        active_version_status = latest_version.status
        schedules = db.query(ExamSchedule).filter(ExamSchedule.timetable_version_id == latest_version.id).all()
        scheduled_exams = len({s.exam_id for s in schedules})
        
        # Validation conflicts
        val = validate_timetable(db, latest_version.id)
        detected_conflicts = len(val.conflicts)

    unscheduled_exams = max(0, total_exams - scheduled_exams)
    backlog_registrations = db.query(ExamRegistration).filter(ExamRegistration.is_backlog == True).count()

    return DashboardStatsOut(
        total_students=total_students,
        total_faculty=total_faculty,
        total_departments=total_departments,
        total_subjects=total_subjects,
        total_exams=total_exams,
        total_rooms=total_rooms,
        total_room_capacity=total_room_capacity,
        scheduled_exams=scheduled_exams,
        unscheduled_exams=unscheduled_exams,
        backlog_registrations_count=backlog_registrations,
        detected_conflicts_count=detected_conflicts,
        active_timetable_version=active_version_name,
        active_timetable_status=active_version_status
    )

@router.get("/charts/date-distribution", response_model=List[DateDistributionChart])
def get_date_distribution(timetable_version_id: int = None, db: Session = Depends(get_db)):
    target_v_id = timetable_version_id
    if not target_v_id:
        latest = db.query(TimetableVersion).order_by(TimetableVersion.id.desc()).first()
        target_v_id = latest.id if latest else 0

    schedules = db.query(ExamSchedule).filter(
        ExamSchedule.timetable_version_id == target_v_id
    ).all()

    counts = {}
    for s in schedules:
        d_str = s.exam_date.strftime("%b %d")
        counts[d_str] = counts.get(d_str, 0) + 1

    return [DateDistributionChart(date=k, count=v) for k, v in counts.items()]

@router.get("/charts/department-distribution", response_model=List[DepartmentDistributionChart])
def get_dept_distribution(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    results = []
    for d in depts:
        cnt = db.query(Exam).filter(Exam.department_id == d.id).count()
        results.append(DepartmentDistributionChart(
            department_name=d.name,
            department_code=d.code,
            exam_count=cnt
        ))
    return results

@router.get("/charts/exam-types", response_model=List[ExamTypeDistributionChart])
def get_exam_type_distribution(db: Session = Depends(get_db)):
    types = ["regular", "backlog", "practical", "supplementary"]
    results = []
    for t in types:
        cnt = db.query(Exam).filter(Exam.exam_type == t).count()
        results.append(ExamTypeDistributionChart(type=t.capitalize(), count=cnt))
    return results

@router.get("/charts/faculty-workload", response_model=List[FacultyWorkloadChart])
def get_faculty_workload(timetable_version_id: int = None, db: Session = Depends(get_db)):
    target_v_id = timetable_version_id
    if not target_v_id:
        latest = db.query(TimetableVersion).order_by(TimetableVersion.id.desc()).first()
        target_v_id = latest.id if latest else 0

    faculty_list = db.query(Faculty).all()
    results = []
    for f in faculty_list:
        assigned = db.query(InvigilatorAssignment).join(
            ExamSchedule, InvigilatorAssignment.exam_schedule_id == ExamSchedule.id
        ).filter(
            InvigilatorAssignment.faculty_id == f.id,
            ExamSchedule.timetable_version_id == target_v_id
        ).count()

        results.append(FacultyWorkloadChart(
            faculty_name=f.full_name,
            duties_assigned=assigned,
            max_workload=f.max_invigilation_workload
        ))
    return results

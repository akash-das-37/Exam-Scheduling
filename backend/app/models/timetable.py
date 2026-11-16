from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class TimetableVersion(Base):
    __tablename__ = "timetable_versions"

    id = Column(Integer, primary_key=True, index=True)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=False)
    exam_period_id = Column(Integer, ForeignKey("exam_periods.id"), nullable=True)
    version_number = Column(Integer, default=1)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="draft")  # draft, generated, under_review, validated, published, archived
    published_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    modification_reason = Column(Text, nullable=True)
    solver_status = Column(String(50), nullable=True)  # OPTIMAL, FEASIBLE, INFEASIBLE, UNKNOWN
    solver_metrics = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    academic_session = relationship("AcademicSession", back_populates="timetable_versions")
    exam_period = relationship("ExamPeriod", back_populates="timetable_versions")
    schedules = relationship("ExamSchedule", back_populates="timetable_version", cascade="all, delete-orphan")
    changes = relationship("TimetableChange", back_populates="timetable_version", cascade="all, delete-orphan")

class ExamSchedule(Base):
    __tablename__ = "exam_schedules"

    id = Column(Integer, primary_key=True, index=True)
    timetable_version_id = Column(Integer, ForeignKey("timetable_versions.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    exam_date = Column(Date, nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    is_locked = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    timetable_version = relationship("TimetableVersion", back_populates="schedules")
    exam = relationship("Exam", back_populates="schedules")
    time_slot = relationship("TimeSlot", back_populates="exam_schedules")
    room_allocations = relationship("RoomAllocation", back_populates="exam_schedule", cascade="all, delete-orphan")
    invigilator_assignments = relationship("InvigilatorAssignment", back_populates="exam_schedule", cascade="all, delete-orphan")

class TimetableChange(Base):
    __tablename__ = "timetable_changes"

    id = Column(Integer, primary_key=True, index=True)
    timetable_version_id = Column(Integer, ForeignKey("timetable_versions.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    old_date = Column(Date, nullable=True)
    new_date = Column(Date, nullable=True)
    old_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=True)
    new_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=True)
    reason = Column(Text, nullable=True)
    conflicts_detected = Column(JSON, default=[])
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    timetable_version = relationship("TimetableVersion", back_populates="changes")
    exam = relationship("Exam", back_populates="changes")

class SchedulingConstraint(Base):
    __tablename__ = "scheduling_constraints"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)  # e.g., "min_student_gap_days"
    name = Column(String(255), nullable=False)
    category = Column(String(50), default="soft")  # hard, soft
    weight = Column(Integer, default=10)           # 1 to 100
    value = Column(String(100), default="1")
    description = Column(Text, nullable=True)

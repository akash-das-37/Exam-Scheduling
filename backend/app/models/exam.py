from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class ExamPeriod(Base):
    __tablename__ = "exam_periods"

    id = Column(Integer, primary_key=True, index=True)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=False)
    name = Column(String(255), nullable=False)  # e.g., "Fall 2026 End-Semester Exams"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    available_days = Column(JSON, default=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])
    holidays = Column(JSON, default=[])  # List of "YYYY-MM-DD"
    status = Column(String(50), default="active")

    # Relationships
    academic_session = relationship("AcademicSession", back_populates="exam_periods")
    timetable_versions = relationship("TimetableVersion", back_populates="exam_period")

class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g. "Morning Session (09:30 - 12:30)"
    start_time = Column(String(10), nullable=False)  # "09:30"
    end_time = Column(String(10), nullable=False)    # "12:30"
    session_type = Column(String(50), default="morning")  # morning, afternoon, evening
    is_active = Column(Boolean, default=True)

    # Relationships
    exam_schedules = relationship("ExamSchedule", back_populates="time_slot")
    faculty_availabilities = relationship("FacultyAvailability", back_populates="time_slot")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    exam_name = Column(String(255), nullable=False)
    exam_type = Column(String(50), default="regular")  # regular, backlog, supplementary, practical, internal, end_semester
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=False)
    date_range_start = Column(Date, nullable=True)
    date_range_end = Column(Date, nullable=True)
    duration_minutes = Column(Integer, default=180)
    required_equipment = Column(String(255), nullable=True)
    expected_student_count = Column(Integer, default=0)
    status = Column(String(50), default="pending")  # pending, scheduled, completed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="exams")
    department = relationship("Department")
    course = relationship("Course")
    academic_session = relationship("AcademicSession")
    registrations = relationship("ExamRegistration", back_populates="exam", cascade="all, delete-orphan")
    schedules = relationship("ExamSchedule", back_populates="exam", cascade="all, delete-orphan")
    changes = relationship("TimetableChange", back_populates="exam")

class ExamRegistration(Base):
    __tablename__ = "exam_registrations"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    is_backlog = Column(Boolean, default=False)
    seat_number = Column(String(50), nullable=True)
    status = Column(String(50), default="confirmed")  # confirmed, cancelled
    registered_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="registrations")
    student = relationship("Student", back_populates="exam_registrations")

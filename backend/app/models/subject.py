from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(50), unique=True, index=True, nullable=False)
    subject_name = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    subject_type = Column(String(50), default="theory")  # theory, practical, lab, elective
    credits = Column(Integer, default=3)
    exam_duration_minutes = Column(Integer, default=180)  # 3 hours standard
    required_equipment = Column(String(255), nullable=True)  # computers, drawing_boards, none
    status = Column(String(50), default="active")

    # Relationships
    department = relationship("Department", back_populates="subjects")
    course = relationship("Course", back_populates="subjects")
    student_registrations = relationship("StudentSubject", back_populates="subject", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")
    backlog_records = relationship("BacklogRecord", back_populates="subject")

class StudentSubject(Base):
    __tablename__ = "student_subjects"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=True)
    is_backlog = Column(Boolean, default=False)
    registration_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="registered")  # registered, dropped, completed

    # Relationships
    student = relationship("Student", back_populates="subject_registrations")
    subject = relationship("Subject", back_populates="student_registrations")

class BacklogRecord(Base):
    __tablename__ = "backlog_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    failed_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=True)
    status = Column(String(50), default="pending")  # pending, registered, cleared
    attempts_count = Column(Integer, default=1)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="backlogs")
    subject = relationship("Subject", back_populates="backlog_records")

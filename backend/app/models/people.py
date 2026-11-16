from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    roll_number = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    current_semester_number = Column(Integer, default=1)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=True)
    enrollment_year = Column(Integer, nullable=False)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    course = relationship("Course", back_populates="students")
    subject_registrations = relationship("StudentSubject", back_populates="student", cascade="all, delete-orphan")
    exam_registrations = relationship("ExamRegistration", back_populates="student", cascade="all, delete-orphan")
    backlogs = relationship("BacklogRecord", back_populates="student", cascade="all, delete-orphan")

class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    faculty_code = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    designation = Column(String(100), default="Assistant Professor")
    max_invigilation_workload = Column(Integer, default=6)  # max duties per exam period
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty")
    availabilities = relationship("FacultyAvailability", back_populates="faculty", cascade="all, delete-orphan")
    invigilation_duties = relationship("InvigilatorAssignment", back_populates="faculty", cascade="all, delete-orphan")

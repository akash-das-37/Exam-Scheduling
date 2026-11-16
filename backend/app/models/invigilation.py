from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class FacultyAvailability(Base):
    __tablename__ = "faculty_availability"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    date = Column(Date, nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=True)  # Null indicates whole day
    is_available = Column(Boolean, default=True)
    reason = Column(Text, nullable=True)

    # Relationships
    faculty = relationship("Faculty", back_populates="availabilities")
    time_slot = relationship("TimeSlot", back_populates="faculty_availabilities")

class InvigilatorAssignment(Base):
    __tablename__ = "invigilator_assignments"

    id = Column(Integer, primary_key=True, index=True)
    exam_schedule_id = Column(Integer, ForeignKey("exam_schedules.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    role = Column(String(50), default="invigilator")  # chief_invigilator, invigilator, reliever
    status = Column(String(50), default="assigned")   # assigned, confirmed, swapped, attended

    # Relationships
    exam_schedule = relationship("ExamSchedule", back_populates="invigilator_assignments")
    room = relationship("Room", back_populates="invigilation_assignments")
    faculty = relationship("Faculty", back_populates="invigilation_duties")

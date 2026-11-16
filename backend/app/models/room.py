from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, index=True, nullable=False)
    building = Column(String(100), nullable=False)
    floor = Column(Integer, default=1)
    room_type = Column(String(50), default="classroom")  # classroom, exam_hall, computer_lab, auditorium
    seating_capacity = Column(Integer, nullable=False)
    available_equipment = Column(String(255), nullable=True)  # computers, projectors, none
    accessibility = Column(Boolean, default=True)  # wheelchair accessible
    status = Column(String(50), default="available")  # available, maintenance, reserved

    # Relationships
    allocations = relationship("RoomAllocation", back_populates="room", cascade="all, delete-orphan")
    invigilation_assignments = relationship("InvigilatorAssignment", back_populates="room", cascade="all, delete-orphan")

class RoomAllocation(Base):
    __tablename__ = "room_allocations"

    id = Column(Integer, primary_key=True, index=True)
    exam_schedule_id = Column(Integer, ForeignKey("exam_schedules.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    allocated_seats = Column(Integer, nullable=False)

    # Relationships
    exam_schedule = relationship("ExamSchedule", back_populates="room_allocations")
    room = relationship("Room", back_populates="allocations")

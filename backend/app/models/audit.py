from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)   # e.g., "TIMETABLE_GENERATED", "EXAM_RESCHEDULED", "PUBLISHED"
    entity = Column(String(100), nullable=False)   # e.g., "ExamSchedule", "TimetableVersion"
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, default={})
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="info")  # info, warning, alert, duty_assigned
    status = Column(String(50), default="unread")           # unread, read, archived
    delivery_channel = Column(String(50), default="in_app") # in_app, email, both
    sent_at = Column(DateTime, default=datetime.utcnow)
    error_details = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="notifications")

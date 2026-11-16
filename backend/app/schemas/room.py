from pydantic import BaseModel
from typing import Optional

class RoomBase(BaseModel):
    room_number: str
    building: str
    floor: int = 1
    room_type: str = "classroom"  # classroom, exam_hall, computer_lab, auditorium
    seating_capacity: int
    available_equipment: Optional[str] = "none"
    accessibility: bool = True
    status: str = "available"

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    building: Optional[str] = None
    floor: Optional[int] = None
    room_type: Optional[str] = None
    seating_capacity: Optional[int] = None
    available_equipment: Optional[str] = None
    accessibility: Optional[bool] = None
    status: Optional[str] = None

class RoomOut(RoomBase):
    id: int

    class Config:
        from_attributes = True

class RoomAllocationOut(BaseModel):
    id: int
    exam_schedule_id: int
    room_id: int
    allocated_seats: int
    room_number: Optional[str] = None
    building: Optional[str] = None
    room_type: Optional[str] = None

    class Config:
        from_attributes = True

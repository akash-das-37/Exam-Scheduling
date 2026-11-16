from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Room, RoomAllocation, ExamSchedule
from backend.app.schemas.room import RoomCreate, RoomUpdate, RoomOut, RoomAllocationOut
from backend.app.api.deps import get_current_active_admin, get_current_user

router = APIRouter(prefix="", tags=["Rooms & Allocations"])

@router.get("/rooms", response_model=List[RoomOut])
def list_rooms(
    building: Optional[str] = None,
    room_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Room)
    if building:
        query = query.filter(Room.building == building)
    if room_type:
        query = query.filter(Room.room_type == room_type)
    if status:
        query = query.filter(Room.status == status)
    return query.all()

@router.post("/rooms", response_model=RoomOut)
def create_room(r_in: RoomCreate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    existing = db.query(Room).filter(Room.room_number == r_in.room_number.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room with this number already exists")

    rm = Room(
        room_number=r_in.room_number.upper(),
        building=r_in.building,
        floor=r_in.floor,
        room_type=r_in.room_type,
        seating_capacity=r_in.seating_capacity,
        available_equipment=r_in.available_equipment,
        accessibility=r_in.accessibility,
        status=r_in.status
    )
    db.add(rm)
    db.commit()
    db.refresh(rm)
    return rm

@router.put("/rooms/{room_id}", response_model=RoomOut)
def update_room(room_id: int, r_in: RoomUpdate, db: Session = Depends(get_db), admin=Depends(get_current_active_admin)):
    rm = db.query(Room).filter(Room.id == room_id).first()
    if not rm:
        raise HTTPException(status_code=404, detail="Room not found")

    if r_in.building is not None:
        rm.building = r_in.building
    if r_in.floor is not None:
        rm.floor = r_in.floor
    if r_in.room_type is not None:
        rm.room_type = r_in.room_type
    if r_in.seating_capacity is not None:
        rm.seating_capacity = r_in.seating_capacity
    if r_in.available_equipment is not None:
        rm.available_equipment = r_in.available_equipment
    if r_in.accessibility is not None:
        rm.accessibility = r_in.accessibility
    if r_in.status is not None:
        rm.status = r_in.status

    db.commit()
    db.refresh(rm)
    return rm

@router.get("/rooms/utilization")
def get_room_utilization(timetable_version_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Computes room utilization percentage across a timetable version or all active schedules.
    """
    rooms = db.query(Room).filter(Room.status == "available").all()
    query = db.query(RoomAllocation)
    if timetable_version_id:
        query = query.join(ExamSchedule, RoomAllocation.exam_schedule_id == ExamSchedule.id).filter(
            ExamSchedule.timetable_version_id == timetable_version_id
        )

    allocs = query.all()
    room_slot_counts = {}
    for a in allocs:
        room_slot_counts[a.room_id] = room_slot_counts.get(a.room_id, 0) + 1

    # Estimate total available discrete slots (e.g. 30 slots standard period)
    max_slots = max(max(room_slot_counts.values(), default=1), 15)
    
    results = []
    for r in rooms:
        used = room_slot_counts.get(r.id, 0)
        pct = round((used / max_slots) * 100, 1)
        results.append({
            "room_id": r.id,
            "room_number": r.room_number,
            "building": r.building,
            "capacity": r.seating_capacity,
            "slots_used": used,
            "utilization_percentage": min(pct, 100.0)
        })
    results.sort(key=lambda x: x["utilization_percentage"], reverse=True)
    return results

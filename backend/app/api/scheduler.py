from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.timetable import (
    GenerateRequest, RegenerateRequest, ValidationResultOut,
    ConflictOut, RecommendSlotRequest, RecommendedSlotOut
)
from backend.app.scheduler.engine import generate_timetable, regenerate_selected_exams
from backend.app.scheduler.validator import validate_timetable
from backend.app.scheduler.recommendations import recommend_alternative_slots, explain_schedule_assignment
from backend.app.api.deps import get_current_active_admin, get_current_user

router = APIRouter(prefix="/scheduler", tags=["Scheduler Engine"])

@router.post("/generate")
def run_automatic_generation(
    req: GenerateRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_active_admin)
):
    try:
        version, status_name, metrics = generate_timetable(
            db=db,
            academic_session_id=req.academic_session_id,
            exam_period_id=req.exam_period_id,
            name=req.name or "Auto-Generated Timetable",
            max_solve_time_seconds=req.max_solve_time_seconds,
            weights=req.weights,
            user_id=admin.id
        )
        return {
            "success": status_name in ["OPTIMAL", "FEASIBLE"],
            "version_id": version.id,
            "version_name": version.name,
            "solver_status": status_name,
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/regenerate-selected")
def run_selective_regeneration(
    req: RegenerateRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_active_admin)
):
    success, status_name, metrics = regenerate_selected_exams(
        db=db,
        timetable_version_id=req.timetable_version_id,
        exam_ids_to_reschedule=req.exam_ids,
        max_solve_time_seconds=req.max_solve_time_seconds,
        user_id=admin.id
    )
    return {
        "success": success,
        "solver_status": status_name,
        "details": metrics
    }

@router.post("/validate/{version_id}", response_model=ValidationResultOut)
def run_validation(
    version_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return validate_timetable(db, version_id)

@router.get("/conflicts/{version_id}", response_model=List[ConflictOut])
def get_conflicts(
    version_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    res = validate_timetable(db, version_id)
    return res.conflicts

@router.post("/recommend-slots", response_model=List[RecommendedSlotOut])
def get_slot_recommendations(
    req: RecommendSlotRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_active_admin)
):
    return recommend_alternative_slots(db, req.timetable_version_id, req.exam_id)

@router.get("/explain/{schedule_id}")
def get_explanation(
    schedule_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return explain_schedule_assignment(db, schedule_id)

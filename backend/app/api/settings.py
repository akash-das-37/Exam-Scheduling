from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.app.core.database import get_db
from backend.app.models import SchedulingConstraint
from backend.app.core.config import settings
from backend.app.api.deps import get_current_active_admin

router = APIRouter(prefix="/settings", tags=["System Settings & Constraints"])

class ConstraintUpdate(BaseModel):
    weight: int
    value: str

class SystemSettingsUpdate(BaseModel):
    college_name: str
    constraints: Dict[str, ConstraintUpdate]

@router.get("")
def get_system_settings(db: Session = Depends(get_db)):
    constraints = db.query(SchedulingConstraint).all()
    return {
        "college_name": settings.COLLEGE_NAME,
        "college_code": settings.COLLEGE_CODE,
        "api_version": settings.VERSION,
        "constraints": [
            {
                "id": c.id,
                "key": c.key,
                "name": c.name,
                "category": c.category,
                "weight": c.weight,
                "value": c.value,
                "description": c.description
            }
            for c in constraints
        ]
    }

@router.put("/constraints/{key}")
def update_constraint(
    key: str,
    upd: ConstraintUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_active_admin)
):
    c = db.query(SchedulingConstraint).filter(SchedulingConstraint.key == key).first()
    if not c:
        raise HTTPException(status_code=404, detail="Constraint key not found")
    c.weight = upd.weight
    c.value = upd.value
    db.commit()
    return {"message": f"Constraint '{c.name}' updated successfully", "key": key, "weight": c.weight, "value": c.value}

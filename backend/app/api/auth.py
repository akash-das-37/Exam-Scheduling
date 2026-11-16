from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.models.user import User
from backend.app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut, ForgotPasswordRequest, ResetPasswordRequest
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    role_val = req.role.lower() if req.role in ["admin", "faculty", "student"] else "student"
    hashed = get_password_hash(req.password)
    new_user = User(
        email=req.email,
        hashed_password=hashed,
        full_name=req.full_name,
        role=role_val,
        phone=req.phone,
        is_active=True
    )
    db.add(new_user)
    db.flush()
    
    student_id = None
    faculty_id = None
    if role_val == "student":
        from backend.app.models.people import Student
        dept_id = req.department_id or 1
        st = Student(
            user_id=new_user.id,
            roll_number=req.roll_number or f"STU{new_user.id:04d}",
            full_name=req.full_name,
            email=req.email,
            phone=req.phone,
            department_id=dept_id,
            current_semester=1,
            enrollment_year=2026,
            status="active"
        )
        db.add(st)
        db.flush()
        student_id = st.id
    elif role_val == "faculty":
        from backend.app.models.people import Faculty
        dept_id = req.department_id or 1
        fac = Faculty(
            user_id=new_user.id,
            faculty_code=f"FAC{new_user.id:03d}",
            full_name=req.full_name,
            email=req.email,
            phone=req.phone,
            department_id=dept_id,
            designation=req.designation or "Assistant Professor",
            max_invigilation_duties=6,
            status="active"
        )
        db.add(fac)
        db.flush()
        faculty_id = fac.id
    
    db.commit()
    token = create_access_token(subject=new_user.id, role=new_user.role)
    user_out = UserOut(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        phone=new_user.phone,
        is_active=new_user.is_active,
        created_at=new_user.created_at,
        student_id=student_id,
        faculty_id=faculty_id
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_out)

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    student_id = user.student_profile.id if user.student_profile else None
    faculty_id = user.faculty_profile.id if user.faculty_profile else None

    token = create_access_token(subject=user.id, role=user.role)
    user_out = UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
        student_id=student_id,
        faculty_id=faculty_id
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_out)

@router.get("/me", response_model=UserOut)
def get_current_user_profile(user: User = Depends(get_current_user)):
    student_id = user.student_profile.id if user.student_profile else None
    faculty_id = user.faculty_profile.id if user.faculty_profile else None
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
        student_id=student_id,
        faculty_id=faculty_id
    )

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        return {"message": "If this email is registered, a password reset link has been dispatched."}
    # Return simulated token for demonstration
    reset_token = create_access_token(subject=user.id, role="reset")
    return {
        "message": "Password reset instructions dispatched.",
        "simulated_reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    from jose import jwt
    from backend.app.core.config import settings
    try:
        payload = jwt.decode(req.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid token")
        user.hashed_password = get_password_hash(req.new_password)
        db.commit()
        return {"message": "Password has been successfully updated"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

@router.post("/logout")
def logout(user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

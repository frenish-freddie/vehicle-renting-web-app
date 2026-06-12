from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
from app.database.connection import get_db
from app.models.models import User, Driver, RoleEnum
from app.schemas.schemas import UserRegister, UserLogin, UserResponse, Token
from app.auth.security import get_password_hash, verify_password
from app.auth.jwt import create_access_token
from datetime import timedelta

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ---------------------------------------------------------------------------
# Hardcoded super-admin credentials (override via env vars for production)
# These are intentionally NOT registered via /register — only login works.
# ---------------------------------------------------------------------------
_ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@flexiride.com")
_ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    if user_in.role == "admin" or user_in.role == RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration of Admin accounts is strictly prohibited."
        )

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered."
        )

    # Hash the password
    hashed_pw = get_password_hash(user_in.password)

    # Create new user
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pw,
        role=user_in.role if user_in.role in [e.value for e in RoleEnum] else RoleEnum.guest,
        phone=user_in.phone,
        avatar_url=user_in.avatar_url,
        preferred_language=user_in.preferred_language
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If the user is a driver, automatically initialize a Driver profile
    if new_user.role == RoleEnum.driver:
        new_driver = Driver(
            user_id=new_user.id,
            name=new_user.name,
            dl_classes='["LMV"]',  # Default/pending
            experience_years=0,
            languages='["English"]',
            service_area='{"city": "Thrissur"}',
            vehicle_types_handled='["car"]',
            daily_rate=0.0,
            rating_avg=5.0,
            is_approved=False
        )
        db.add(new_driver)
        db.commit()

    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):

    # -----------------------------------------------------------------------
    # Super-admin shortcut: issue an admin JWT without DB password verification.
    # This is the ONLY way to obtain an admin token — /register cannot create admins.
    # -----------------------------------------------------------------------
    if credentials.email == _ADMIN_EMAIL and credentials.password == _ADMIN_PASSWORD:
        # Look up the admin user record for their name/id (graceful fallback if not seeded)
        admin_user = db.query(User).filter(User.email == _ADMIN_EMAIL).first()
        admin_id   = admin_user.id   if admin_user else 0
        admin_name = admin_user.name if admin_user else "Admin"

        access_token = create_access_token(
            data={
                "sub":  _ADMIN_EMAIL,
                "role": "admin",
                "name": admin_name,
                "id":   admin_id,
            }
        )
        return {"access_token": access_token, "token_type": "bearer"}

    # -----------------------------------------------------------------------
    # Normal user login flow (Guest / Host / Driver)
    # -----------------------------------------------------------------------
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Prevent a regular user from escalating to admin via DB role manipulation
    effective_role = user.role.value if hasattr(user.role, "value") else str(user.role)
    if effective_role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is restricted. Use the admin credentials.",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": effective_role, "name": user.name, "id": user.id}
    )
    return {"access_token": access_token, "token_type": "bearer"}

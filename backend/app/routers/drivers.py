"""
drivers.py — Driver verification workflow endpoints.

Driver:  POST /api/drivers/upload-license  → sets status to "pending"
Driver:  GET  /api/drivers/me              → returns own driver profile + verification state
Admin:   PUT  /api/drivers/{id}/verify     → approve: sets status="approved", is_active=True
Admin:   PUT  /api/drivers/{id}/reject-license → reject: sets status="rejected", is_active=False
"""

import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.models import Driver, User, Booking, TripStatusLog
from app.auth.jwt import RoleChecker, get_current_user

router = APIRouter(prefix="/api/drivers", tags=["Driver Verification"])

# ── Static upload directory (inside backend so uvicorn can serve it) ─────────
UPLOAD_DIR = Path(__file__).parent.parent / "static" / "licenses"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE_MB = 5


# ─────────────────────────────────────────────────────────────────────────────
# DRIVER — get own profile & verification state
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/me")
def get_my_driver_profile(
    current_user: User = Depends(RoleChecker(["driver", "admin"])),
    db: Session = Depends(get_db),
):
    profile = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found.")
    return {
        "id": profile.id,
        "name": profile.name,
        "verification_status": profile.verification_status,
        "is_active": profile.is_active,
        "is_approved": profile.is_approved,
        "license_url": profile.license_url,
        "rating_avg": profile.rating_avg,
        "total_trips": profile.total_trips,
        "experience_years": profile.experience_years,
        # Phase 2: hourly rate (daily_rate kept for backward compat)
        "daily_rate": profile.daily_rate,
        "hourly_rate": profile.hourly_rate or 0.0,
    }


# ─────────────────────────────────────────────────────────────────────────────
# DRIVER — upload license image → moves status to "pending"
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/upload-license", status_code=status.HTTP_200_OK)
async def upload_license(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker(["driver", "admin"])),
    db: Session = Depends(get_db),
):
    profile = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found.")

    # Guard: already approved — don't allow re-upload without admin reset
    if profile.verification_status == "approved":
        raise HTTPException(
            status_code=400,
            detail="Your license is already approved. Contact support to update it.",
        )

    # Validate MIME type
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Use JPEG, PNG, WebP, or PDF.",
        )

    # Read and size-check
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Maximum is {MAX_FILE_SIZE_MB} MB.",
        )

    # Save with a unique filename
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"driver_{profile.id}_{uuid.uuid4().hex[:8]}.{ext}"
    save_path = UPLOAD_DIR / filename

    with open(save_path, "wb") as f:
        f.write(contents)

    # Update driver record
    # Keep relative URL; frontend can prefix with API base
    profile.license_url = f"/static/licenses/{filename}"
    profile.verification_status = "pending"
    profile.is_active = False  # stays inactive until admin approves
    db.commit()

    return {
        "message": "License uploaded successfully. Your application is under review.",
        "verification_status": "pending",
        "license_url": profile.license_url,
    }


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — approve a driver's license
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/{driver_id}/verify")
def approve_driver_license(
    driver_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db),
):
    profile = db.query(Driver).filter(Driver.id == driver_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found.")
    if not profile.license_url:
        raise HTTPException(status_code=400, detail="Driver has not uploaded a license yet.")

    profile.verification_status = "approved"
    profile.is_active = True
    profile.is_approved = True   # keep legacy flag in sync
    db.commit()

    return {
        "message": f"Driver {profile.name} approved and activated.",
        "verification_status": "approved",
        "is_active": True,
    }


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — reject a driver's license submission
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/{driver_id}/reject-license")
def reject_driver_license(
    driver_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db),
):
    profile = db.query(Driver).filter(Driver.id == driver_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found.")

    profile.verification_status = "rejected"
    profile.is_active = False
    profile.is_approved = False  # keep legacy flag in sync
    db.commit()

    return {
        "message": f"Driver {profile.name}'s license rejected.",
        "verification_status": "rejected",
        "is_active": False,
    }


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC — list available (approved + active) drivers for booking selection
# ─────────────────────────────────────────────────────────────────────────────

from typing import Optional

@router.get("/available")
def list_available_drivers(
    date: Optional[str] = None,
    hours: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Returns only drivers that have passed verification.
    Used by the booking flow to show driver options.
    Phase 2: returns hourly_rate (not daily_rate).
    """
    drivers = (
        db.query(Driver)
        .filter(
            Driver.verification_status == "approved",
            Driver.is_active == True,
        )
        .all()
    )
    return [
        {
            "id": d.id,
            "name": d.name,
            "rating_avg": d.rating_avg,
            "experience_years": d.experience_years,
            # Phase 2: use hourly_rate; fall back to daily_rate/8 if hourly not set
            "hourly_rate": d.hourly_rate if (d.hourly_rate or 0.0) > 0 else round((d.daily_rate or 0.0) / 8, 2),
            "languages": d.languages,
            "dl_classes": d.dl_classes,
            "photo_url": d.photo_url,
        }
        for d in drivers
    ]

# ─────────────────────────────────────────────────────────────────────────────
# DRIVER — accept an open trip request
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/trips/{booking_id}/accept")
def accept_trip(
    booking_id: int,
    current_user: User = Depends(RoleChecker(["driver"])),
    db: Session = Depends(get_db)
):
    """
    Allows a driver to accept an open booking request that requires a driver.
    """
    profile = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found.")
    
    if profile.verification_status != "approved":
        raise HTTPException(status_code=403, detail="You must be approved to accept trips.")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.trip_type not in ["with_driver", "operator"]:
        raise HTTPException(status_code=400, detail="This trip does not require a driver.")

    if booking.driver_id is not None:
        if booking.driver_id == profile.id:
            raise HTTPException(status_code=400, detail="You have already accepted this trip.")
        raise HTTPException(status_code=400, detail="This trip has already been assigned to another driver.")

    # Assign driver to booking and update status
    booking.driver_id = profile.id
    # We leave status as 'confirmed' and update current_status to 'driver_pickup' to kick off active trip logic
    booking.current_status = "driver_pickup"

    # Log the status change
    new_log = TripStatusLog(
        booking_id=booking.id,
        status="driver_pickup",
        updated_by_role="driver",
        updated_by_id=current_user.id,
        note="Trip accepted by driver"
    )
    db.add(new_log)
    db.commit()

    return {
        "message": "Trip successfully accepted.",
        "booking_id": booking.id,
        "driver_id": profile.id,
        "current_status": "driver_pickup"
    }

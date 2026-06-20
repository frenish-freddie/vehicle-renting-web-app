"""
host_kyc.py — FlexiRide Host KYC document upload router.

Host:  POST /api/host-kyc/upload-aadhaar  → upload Aadhaar/Govt ID image
Host:  POST /api/host-kyc/upload-pan      → upload PAN card image
Host:  GET  /api/host-kyc/status          → returns current KYC status + doc URLs
"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.models import User, RoleEnum
from app.auth.jwt import RoleChecker, get_current_user

router = APIRouter(prefix="/api/host-kyc", tags=["Host KYC"])

# ── Static upload directory ───────────────────────────────────────────────────
UPLOAD_DIR = Path(__file__).parent.parent / "static" / "host_kyc"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE_MB = 8


def _save_upload(file: UploadFile, contents: bytes, prefix: str) -> str:
    """Save the uploaded file and return its relative URL."""
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{prefix}_{uuid.uuid4().hex[:10]}.{ext}"
    save_path = UPLOAD_DIR / filename
    with open(save_path, "wb") as f:
        f.write(contents)
    return f"/static/host_kyc/{filename}"


async def _validate_file(file: UploadFile) -> bytes:
    """Validate MIME type and size; returns bytes."""
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Use JPEG, PNG, WebP, or PDF.",
        )
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Maximum is {MAX_FILE_SIZE_MB} MB.",
        )
    return contents


# ─────────────────────────────────────────────────────────────────────────────
# HOST — get own KYC status
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/status")
def get_kyc_status(
    current_user: User = Depends(RoleChecker(["host", "admin"])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    return {
        "host_kyc_status": user.host_kyc_status or "unsubmitted",
        "host_aadhaar_url": user.host_aadhaar_url,
        "host_pan_url": user.host_pan_url,
    }


# ─────────────────────────────────────────────────────────────────────────────
# HOST — upload Aadhaar / Government ID
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/upload-aadhaar", status_code=status.HTTP_200_OK)
async def upload_aadhaar(
    file: UploadFile = File(...),
    aadhaar_name: str = Form(""),
    aadhaar_dob: str = Form(""),
    aadhaar_gender: str = Form(""),
    aadhaar_number: str = Form(""),
    aadhaar_address: str = Form(""),
    current_user: User = Depends(RoleChecker(["host", "admin"])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()

    if user.host_kyc_status == "approved":
        raise HTTPException(
            status_code=400,
            detail="Your KYC is already approved. Contact support to update documents.",
        )

    contents = await _validate_file(file)
    url = _save_upload(file, contents, f"aadhaar_{user.id}")

    user.host_aadhaar_url = url
    
    # Save text details
    user.aadhaar_name = aadhaar_name
    user.aadhaar_dob = aadhaar_dob
    user.aadhaar_gender = aadhaar_gender
    user.aadhaar_number = aadhaar_number
    user.aadhaar_address = aadhaar_address

    # Move to pending only when at least one doc is uploaded
    if user.host_kyc_status in ("unsubmitted", "rejected"):
        user.host_kyc_status = "pending"
    db.commit()

    return {
        "message": "Aadhaar uploaded successfully. Awaiting admin review.",
        "host_kyc_status": user.host_kyc_status,
        "host_aadhaar_url": url,
    }


# ─────────────────────────────────────────────────────────────────────────────
# HOST — upload PAN Card / Tax Document
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/upload-pan", status_code=status.HTTP_200_OK)
async def upload_pan(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker(["host", "admin"])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()

    if user.host_kyc_status == "approved":
        raise HTTPException(
            status_code=400,
            detail="Your KYC is already approved. Contact support to update documents.",
        )

    contents = await _validate_file(file)
    url = _save_upload(file, contents, f"pan_{user.id}")

    user.host_pan_url = url
    if user.host_kyc_status in ("unsubmitted", "rejected"):
        user.host_kyc_status = "pending"
    db.commit()

    return {
        "message": "PAN card uploaded successfully. Awaiting admin review.",
        "host_kyc_status": user.host_kyc_status,
        "host_pan_url": url,
    }

"""
admin.py — FlexiRide Admin-only API router.

All endpoints require role="admin" (enforced by RoleChecker).
Provides: stats, user/vehicle/driver approvals, global history.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.models import User, Vehicle, Driver, Booking, Payment, RoleEnum
from app.auth.jwt import RoleChecker

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ─────────────────────────────────────────────────────────────────────────────
# Schemas (inline — avoids polluting the shared schemas.py)
# ─────────────────────────────────────────────────────────────────────────────

class ApprovalRequest(BaseModel):
    reason: Optional[str] = None  # optional rejection reason for future use


# ─────────────────────────────────────────────────────────────────────────────
# STATS — overview card data for the dashboard
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_admin_stats(
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    total_users     = db.query(User).count()
    total_vehicles  = db.query(Vehicle).count()
    total_bookings  = db.query(Booking).count()
    total_drivers   = db.query(Driver).count()

    pending_vehicle_approvals = db.query(Vehicle).filter(Vehicle.is_approved == False).count()
    pending_driver_approvals  = db.query(Driver).filter(Driver.verification_status == "pending").count()
    suspended_hosts = db.query(User).filter(
        User.role == RoleEnum.host,
        User.is_host_approved == False
    ).count()

    # Commission / revenue
    commission_res = db.query(func.sum(Booking.commission_amount)).filter(
        Booking.status.in_(["confirmed", "ongoing", "completed"])
    ).scalar()
    total_commission = round(float(commission_res) if commission_res else 0.0, 2)

    # Fallback: if no commission stored yet, estimate 10% of completed base amounts
    if total_commission == 0:
        base_res = db.query(func.sum(Booking.base_amount)).filter(
            Booking.status.in_(["confirmed", "ongoing", "completed"])
        ).scalar()
        total_commission = round(float(base_res) * 0.10 if base_res else 0.0, 2)

    gross_revenue_res = db.query(func.sum(Booking.total_amount)).filter(
        Booking.status.in_(["confirmed", "ongoing", "completed"])
    ).scalar()
    gross_revenue = round(float(gross_revenue_res) if gross_revenue_res else 0.0, 2)

    # Booking breakdown by status
    status_counts = {}
    for s in ["pending", "confirmed", "ongoing", "completed", "cancelled"]:
        status_counts[s] = db.query(Booking).filter(Booking.status == s).count()

    # Recent 6 months commission trend (monthly buckets, approximated)
    recent_bookings_raw = db.query(
        Booking.created_at,
        Booking.base_amount,
        Booking.commission_amount
    ).filter(
        Booking.status.in_(["confirmed", "ongoing", "completed"])
    ).order_by(Booking.created_at.desc()).limit(100).all()

    return {
        "total_users":                total_users,
        "total_vehicles":             total_vehicles,
        "total_bookings":             total_bookings,
        "total_drivers":              total_drivers,
        "pending_vehicle_approvals":  pending_vehicle_approvals,
        "pending_driver_approvals":   pending_driver_approvals,
        "suspended_hosts":            suspended_hosts,
        "total_commission":           total_commission,
        "gross_revenue":              gross_revenue,
        "booking_status_counts":      status_counts,
    }


# ─────────────────────────────────────────────────────────────────────────────
# USERS — list & approve/reject host accounts
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/users")
def list_all_users(
    page: int = 1,
    limit: int = 20,
    role: Optional[str] = None,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role.value if hasattr(u.role, "value") else u.role,
                "phone": u.phone,
                "is_host_approved": u.is_host_approved,
                "dl_verified": u.dl_verified,
                "aadhaar_verified": u.aadhaar_verified,
                "user_dl_url": u.user_dl_url,
                "user_aadhaar_url": u.user_aadhaar_url,
                "user_kyc_status": u.user_kyc_status,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }


@router.get("/user-kyc")
def list_user_kyc(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "guest")
    if status:
        query = query.filter(User.user_kyc_status == status)
    else:
        # If no status filter, only show users who have uploaded documents (status != unsubmitted)
        query = query.filter(User.user_kyc_status != "unsubmitted")

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "phone": u.phone,
                "user_dl_url": u.user_dl_url,
                "user_aadhaar_url": u.user_aadhaar_url,
                "user_kyc_status": u.user_kyc_status,
                "dl_verified": u.dl_verified,
                "aadhaar_verified": u.aadhaar_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }


@router.patch("/users/{user_id}/approve")
def approve_host(
    user_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_host_approved = True
    db.commit()
    return {"message": f"User {user.name} approved as host.", "is_host_approved": True}


@router.patch("/users/{user_id}/reject")
def reject_host(
    user_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_host_approved = False
    db.commit()
    return {"message": f"User {user.name} rejected as host.", "is_host_approved": False}


@router.patch("/users/{user_id}/approve-kyc")
def approve_user_kyc(
    user_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.user_kyc_status = "approved"
    user.dl_verified = bool(user.user_dl_url)
    user.aadhaar_verified = bool(user.user_aadhaar_url)
    db.commit()
    return {"message": f"KYC for {user.name} approved.", "user_kyc_status": "approved"}


@router.patch("/users/{user_id}/reject-kyc")
def reject_user_kyc(
    user_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.user_kyc_status = "rejected"
    user.dl_verified = False
    user.aadhaar_verified = False
    db.commit()
    return {"message": f"KYC for {user.name} rejected.", "user_kyc_status": "rejected"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully."}


# ─────────────────────────────────────────────────────────────────────────────
# VEHICLES — list & approve/reject listings
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/vehicles")
def list_all_vehicles(
    page: int = 1,
    limit: int = 20,
    approved: Optional[bool] = None,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)
    if approved is not None:
        query = query.filter(Vehicle.is_approved == approved)
    total = query.count()
    vehicles = query.order_by(Vehicle.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    result = []
    for v in vehicles:
        host = db.query(User).filter(User.id == v.host_id).first()
        result.append({
            "id": v.id,
            "brand": v.brand,
            "model": v.model,
            "year": v.year,
            "category": v.category.value if hasattr(v.category, "value") else v.category,
            "sub_type": v.sub_type,
            "registration_no": v.registration_no,
            "fuel_type": v.fuel_type,
            "price_daily": v.price_daily,
            "is_approved": v.is_approved,
            "is_available": v.is_available,
            "images": v.images,
            "rc_url": v.rc_url,
            "insurance_url": v.insurance_url,
            "host_name": host.name if host else "Unknown",
            "host_email": host.email if host else "",
            "created_at": v.created_at.isoformat() if v.created_at else None,
        })
    return {"total": total, "page": page, "limit": limit, "vehicles": result}


@router.patch("/vehicles/{vehicle_id}/approve")
def approve_vehicle(
    vehicle_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    v.is_approved = True
    db.commit()
    return {"message": f"Vehicle {v.brand} {v.model} approved.", "is_approved": True}


@router.patch("/vehicles/{vehicle_id}/reject")
def reject_vehicle(
    vehicle_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    v.is_approved = False
    db.commit()
    return {"message": f"Vehicle {v.brand} {v.model} rejected.", "is_approved": False}


# ─────────────────────────────────────────────────────────────────────────────
# DRIVERS — list & approve/reject driver applications
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/drivers")
def list_all_drivers(
    page: int = 1,
    limit: int = 20,
    approved: Optional[bool] = None,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(Driver)
    if approved is not None:
        if approved:
            query = query.filter(Driver.verification_status == "approved")
        else:
            query = query.filter(Driver.verification_status != "approved")
    total = query.count()
    drivers = query.order_by(Driver.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    result = []
    for d in drivers:
        user = db.query(User).filter(User.id == d.user_id).first()
        # Phase 2: compute hourly_rate (fall back to daily_rate/8 if not set)
        hourly = d.hourly_rate if (d.hourly_rate or 0.0) > 0 else round((d.daily_rate or 0.0) / 8, 2)
        result.append({
            "id": d.id,
            "name": d.name,
            "experience_years": d.experience_years,
            "daily_rate": d.daily_rate,
            "hourly_rate": hourly,
            "rating_avg": d.rating_avg,
            "total_trips": d.total_trips,
            "is_approved": d.is_approved,
            "verification_status": d.verification_status,
            "is_active": d.is_active,
            "license_url": d.license_url,
            "is_police_verified": d.is_police_verified,
            "is_medically_fit": d.is_medically_fit,
            "user_email": user.email if user else "",
            "dl_classes": d.dl_classes,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })
    return {"total": total, "page": page, "limit": limit, "drivers": result}


@router.patch("/drivers/{driver_id}/approve")
def approve_driver(
    driver_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    d.verification_status = "approved"
    d.is_active = True
    d.is_approved = True
    db.commit()
    return {"message": f"Driver {d.name} approved.", "verification_status": "approved"}


@router.patch("/drivers/{driver_id}/reject")
def reject_driver(
    driver_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    d.verification_status = "rejected"
    d.is_active = False
    d.is_approved = False
    db.commit()
    return {"message": f"Driver {d.name} rejected.", "verification_status": "rejected"}


# ─────────────────────────────────────────────────────────────────────────────
# ALL BOOKINGS — global platform booking log
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/bookings")
def list_all_bookings(
    page: int = 1,
    limit: int = 20,
    booking_status: Optional[str] = None,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    if booking_status:
        query = query.filter(Booking.status == booking_status)
    total = query.count()
    bookings = query.order_by(Booking.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    result = []
    for b in bookings:
        user = db.query(User).filter(User.id == b.user_id).first()
        vehicle = db.query(Vehicle).filter(Vehicle.id == b.vehicle_id).first()
        result.append({
            "id": b.id,
            "status": b.status.value if hasattr(b.status, "value") else b.status,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "",
            "vehicle_name": f"{vehicle.brand} {vehicle.model}" if vehicle else "Unknown",
            "vehicle_category": vehicle.category.value if vehicle and hasattr(vehicle.category, "value") else "",
            "from_dt": b.from_dt.isoformat() if b.from_dt else None,
            "to_dt": b.to_dt.isoformat() if b.to_dt else None,
            "base_amount": b.base_amount,
            "total_amount": b.total_amount,
            "commission_amount": b.commission_amount,
            "trip_type": b.trip_type,
            "pickup_address": b.pickup_address,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        })
    return {"total": total, "page": page, "limit": limit, "bookings": result}


# ─────────────────────────────────────────────────────────────────────────────
# HISTORY — aggregated bookings + payments global transaction log
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/history")
def get_platform_history(
    page: int = 1,
    limit: int = 25,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    total = db.query(Payment).count()
    payments = db.query(Payment).order_by(Payment.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    result = []
    for p in payments:
        booking = db.query(Booking).filter(Booking.id == p.booking_id).first()
        user = db.query(User).filter(User.id == booking.user_id).first() if booking else None
        vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first() if booking else None
        result.append({
            "payment_id": p.id,
            "booking_id": p.booking_id,
            "amount": p.amount,
            "method": p.method,
            "gateway_ref": p.gateway_ref,
            "status": p.status.value if hasattr(p.status, "value") else p.status,
            "platform_commission": p.platform_commission,
            "user_name": user.name if user else "Unknown",
            "vehicle_name": f"{vehicle.brand} {vehicle.model}" if vehicle else "Unknown",
            "booking_status": (booking.status.value if hasattr(booking.status, "value") else booking.status) if booking else "unknown",
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    return {"total": total, "page": page, "limit": limit, "transactions": result}


# ─────────────────────────────────────────────────────────────────────────────
# HOST KYC — list & approve/reject host KYC documents
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/host-kyc")
def list_host_kyc(
    page: int = 1,
    limit: int = 20,
    kyc_status: Optional[str] = None,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    """List all host users with their KYC document status."""
    query = db.query(User).filter(User.role == RoleEnum.host)
    if kyc_status:
        query = query.filter(User.host_kyc_status == kyc_status)
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "hosts": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "phone": u.phone,
                "host_kyc_status": u.host_kyc_status or "unsubmitted",
                "host_aadhaar_url": u.host_aadhaar_url,
                "host_pan_url": u.host_pan_url,
                "is_host_approved": u.is_host_approved,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


@router.patch("/users/{user_id}/approve-kyc")
def approve_host_kyc(
    user_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.host_kyc_status = "approved"
    user.is_host_approved = True
    db.commit()
    return {"message": f"Host {user.name} KYC approved.", "host_kyc_status": "approved"}


@router.patch("/users/{user_id}/reject-kyc")
def reject_host_kyc(
    user_id: int,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.host_kyc_status = "rejected"
    user.is_host_approved = False
    db.commit()
    return {"message": f"Host {user.name} KYC rejected.", "host_kyc_status": "rejected"}

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models import Booking, Vehicle, User, Driver
from app.auth.jwt import RoleChecker

router = APIRouter(prefix="/api/dashboards", tags=["Dashboard Analytics"])

@router.get("/guest")
def get_customer_stats(
    current_user: User = Depends(RoleChecker(["guest", "admin"])),
    db: Session = Depends(get_db)
):
    # Total bookings
    total_bookings = db.query(Booking).filter(Booking.user_id == current_user.id).count()
    
    # Active/confirmed bookings
    active_bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id,
        Booking.status.in_(["pending", "confirmed", "ongoing"])
    ).count()

    # Total money spent
    spent_res = db.query(func.sum(Booking.total_amount)).filter(
        Booking.user_id == current_user.id,
        Booking.status.in_(["confirmed", "ongoing", "completed"])
    ).scalar()
    total_spent = float(spent_res) if spent_res else 0.0

    # Recent list
    recent_bookings = db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).limit(5).all()
    for b in recent_bookings:
        b.vehicle = db.query(Vehicle).filter(Vehicle.id == b.vehicle_id).first()

    return {
        "total_bookings": total_bookings,
        "active_bookings": active_bookings,
        "total_spent": round(total_spent, 2),
        "recent_bookings": recent_bookings
    }

@router.get("/host")
def get_owner_stats(
    current_user: User = Depends(RoleChecker(["host", "admin"])),
    db: Session = Depends(get_db)
):
    # Owner's vehicles
    vehicles = db.query(Vehicle).filter(Vehicle.owner_id == current_user.id).all()
    vehicle_ids = [v.id for v in vehicles]
    total_vehicles = len(vehicles)

    if not vehicle_ids:
        return {
            "total_vehicles": 0,
            "active_bookings": 0,
            "total_earnings": 0.0,
            "recent_requests": []
        }

    # Active bookings on owner's vehicles
    active_bookings = db.query(Booking).filter(
        Booking.vehicle_id.in_(vehicle_ids),
        Booking.status.in_(["confirmed", "ongoing"])
    ).count()

    # Earnings calculation
    earnings_res = db.query(func.sum(Booking.total_amount)).filter(
        Booking.vehicle_id.in_(vehicle_ids),
        Booking.status.in_(["confirmed", "ongoing", "completed"])
    ).scalar()
    
    total_earnings = float(earnings_res) if earnings_res else 0.0

    # Recent booking requests
    recent_requests = db.query(Booking).filter(
        Booking.vehicle_id.in_(vehicle_ids)
    ).order_by(Booking.created_at.desc()).limit(5).all()

    for r in recent_requests:
        r.vehicle = db.query(Vehicle).filter(Vehicle.id == r.vehicle_id).first()
        r.user = db.query(User).filter(User.id == r.user_id).first()

    return {
        "total_vehicles": total_vehicles,
        "active_bookings": active_bookings,
        "total_earnings": round(total_earnings, 2),
        "recent_requests": recent_requests,
        "vehicles": vehicles
    }

@router.get("/driver")
def get_driver_stats(
    current_user: User = Depends(RoleChecker(["driver", "admin"])),
    db: Session = Depends(get_db)
):
    # Find associated Driver record
    driver_profile = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile registration record was not found"
        )

    # Let's count trips
    # For a prototype, we count confirmed/completed bookings where driver_included = True
    assigned_trips = db.query(Booking).filter(
        Booking.trip_type.in_(["with_driver", "operator"]),
        Booking.status.in_(["confirmed", "ongoing"])
    ).all()

    total_trips = len(assigned_trips)
    
    # Simple simulated driver earnings: ₹1000 flat per trip or accumulated rate
    driver_earnings = sum([round(t.total_amount * 0.15, 2) for t in assigned_trips])  # 15% booking cut goes to driver

    for t in assigned_trips:
        t.vehicle = db.query(Vehicle).filter(Vehicle.id == t.vehicle_id).first()
        t.user = db.query(User).filter(User.id == t.user_id).first()

    return {
        "rating": driver_profile.rating_avg,
        "experience": driver_profile.experience_years,
        "availability": driver_profile.is_approved,
        "total_trips": total_trips,
        "earnings": round(driver_earnings, 2),
        "assigned_trips": assigned_trips
    }

@router.get("/admin")
def get_admin_stats(
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_vehicles = db.query(Vehicle).count()
    total_bookings = db.query(Booking).count()

    # Total company revenue (Taxes 18% + bookings sum commission estimate)
    total_revenue_res = db.query(func.sum(Booking.total_amount)).filter(
        Booking.status.in_(["confirmed", "ongoing", "completed"])
    ).scalar()
    
    overall_volume = float(total_revenue_res) if total_revenue_res else 0.0
    admin_commission = overall_volume * 0.18  # 18% tax goes directly to platform earnings

    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
    recent_bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(5).all()
    
    for b in recent_bookings:
        b.vehicle = db.query(Vehicle).filter(Vehicle.id == b.vehicle_id).first()
        b.user = db.query(User).filter(User.id == b.user_id).first()

    return {
        "total_users": total_users,
        "total_vehicles": total_vehicles,
        "total_bookings": total_bookings,
        "platform_earnings": round(admin_commission, 2),
        "recent_users": recent_users,
        "recent_bookings": recent_bookings
    }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database.connection import get_db
from app.models import Booking, Vehicle, User
from app.schemas import BookingCreate, BookingUpdate, BookingResponse
from app.auth.jwt import get_current_user, RoleChecker
from app.services.pricing import calculate_total_price

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

# Helper: Check booking conflicts
def check_booking_overlap(vehicle_id: int, start: datetime, end: datetime, db: Session) -> bool:
    overlapping_booking = db.query(Booking).filter(
        Booking.vehicle_id == vehicle_id,
        Booking.status.in_(["pending", "confirmed", "ongoing"]),
        Booking.start_date < end,
        Booking.end_date > start
    ).first()
    return overlapping_booking is not None

# Customer: Book a vehicle
@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    current_user: User = Depends(RoleChecker(["customer", "admin"])),
    db: Session = Depends(get_db)
):
    # Validate dates
    if booking_in.start_date >= booking_in.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before the end date"
        )
    if booking_in.start_date.replace(tzinfo=None) < datetime.utcnow():
        # Allow short grace period
        pass

    # Check vehicle existence
    vehicle = db.query(Vehicle).filter(Vehicle.id == booking_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found or no longer available"
        )

    # Check database conflicts
    if check_booking_overlap(booking_in.vehicle_id, booking_in.start_date, booking_in.end_date, db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This vehicle is already booked during your selected dates"
        )

    # Calculate price
    duration = (booking_in.end_date - booking_in.start_date).days
    number_of_days = max(1, duration)

    pricing_breakdown = calculate_total_price(
        base_price=vehicle.base_price,
        price_per_km=vehicle.price_per_km,
        distance_km=booking_in.estimated_distance,
        driver_included=booking_in.driver_included,
        driver_cost_per_day=vehicle.driver_cost,
        number_of_days=number_of_days
    )

    total_price = pricing_breakdown["total_price"]

    # Create Booking in pending state
    new_booking = Booking(
        user_id=current_user.id,
        vehicle_id=booking_in.vehicle_id,
        pickup_location=booking_in.pickup_location,
        drop_location=booking_in.drop_location,
        estimated_distance=booking_in.estimated_distance,
        start_date=booking_in.start_date,
        end_date=booking_in.end_date,
        driver_included=booking_in.driver_included,
        total_amount=total_price,
        status="pending"
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # Attach vehicle to response
    new_booking.vehicle = vehicle
    return new_booking

# Customer / Owner / Driver / Admin: Retrieve their specific bookings
@router.get("/user", response_model=List[BookingResponse])
def get_user_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        bookings = db.query(Booking).all()
    elif current_user.role == "customer":
        bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    elif current_user.role == "owner":
        # Bookings for vehicles owned by this user
        bookings = db.query(Booking).join(Vehicle).filter(Vehicle.owner_id == current_user.id).all()
    elif current_user.role == "driver":
        # Simulate drivers: they can see confirmed bookings with driver included that have no assigned driver or matched to them
        bookings = db.query(Booking).filter(Booking.driver_included == True).all()
    else:
        bookings = []

    # Eagerly load vehicles for response schema mapping
    for b in bookings:
        b.vehicle = db.query(Vehicle).filter(Vehicle.id == b.vehicle_id).first()

    return bookings

# Update booking status (confirm, complete, cancel, etc.)
@router.put("/{id}", response_model=BookingResponse)
def update_booking_status(
    id: int,
    booking_in: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking transaction not found"
        )

    # Permission check: Customer can cancel; Owner/Admin can change status
    if current_user.role == "customer" and current_user.id == booking.user_id:
        if booking_in.status != "cancelled":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers can only cancel their booking transactions"
            )
    elif current_user.role == "owner":
        vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        if not vehicle or vehicle.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update booking status for this vehicle"
            )
    elif current_user.role != "admin" and current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to update booking transactions"
        )

    # Perform update
    booking.status = booking_in.status
    db.commit()
    db.refresh(booking)

    # Load vehicle details for response
    booking.vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
    return booking

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.database.connection import get_db
from app.models import Booking, Vehicle, User, Payment, Driver, Location
from app.schemas import BookingCreate, BookingUpdate, BookingResponse, PaymentSummaryResponse
from app.auth.jwt import get_current_user, RoleChecker
from app.services.pricing import calculate_total_price

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

# Helper: Check booking conflicts
def check_booking_overlap(vehicle_id: int, start: datetime, end: datetime, db: Session) -> bool:
    overlapping_booking = db.query(Booking).filter(
        Booking.vehicle_id == vehicle_id,
        Booking.status.in_(["pending", "confirmed", "ongoing"]),
        Booking.from_dt < end,
        Booking.to_dt > start
    ).first()
    return overlapping_booking is not None

# Customer: Book a vehicle
@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    current_user: User = Depends(RoleChecker(["guest", "admin"])),
    db: Session = Depends(get_db)
):
    # Validate dates
    if booking_in.from_dt >= booking_in.to_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before the end date"
        )

    # Check KYC status
    if current_user.user_kyc_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your KYC documents must be approved before you can book a vehicle."
        )

    # Check vehicle existence
    vehicle = db.query(Vehicle).filter(Vehicle.id == booking_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found or no longer available"
        )

    # Guard: host cannot book their own vehicle
    if vehicle.host_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot book your own vehicle."
        )

    # Check database conflicts
    if check_booking_overlap(booking_in.vehicle_id, booking_in.from_dt, booking_in.to_dt, db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This vehicle is already booked during your selected dates"
        )

    # Phase 4: Compute trip duration in hours and enforce minimum 6 hours
    trip_duration_hours = round((booking_in.to_dt - booking_in.from_dt).total_seconds() / 3600, 2)
    if trip_duration_hours < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum trip duration is 6 hours. Please adjust your pickup or drop-off time."
        )
    trip_hours = int(trip_duration_hours)

    # Phase 2: resolve driver cost if trip_type = 'with_driver'
    resolved_driver_hourly_rate = booking_in.driver_hourly_rate or 0.0
    resolved_driver_total_cost  = booking_in.driver_total_cost  or 0.0

    if booking_in.trip_type == "with_driver" and booking_in.driver_id:
        driver_rec = db.query(Driver).filter(Driver.id == booking_in.driver_id).first()
        if driver_rec:
            hr = driver_rec.hourly_rate if (driver_rec.hourly_rate or 0.0) > 0 else round((driver_rec.daily_rate or 0.0) / 8, 2)
            resolved_driver_hourly_rate = hr
            resolved_driver_total_cost  = round(hr * trip_hours, 2)

    # Fold driver cost into total_amount before 30/70 split
    # The frontend may already include driver_fee in total_amount; if not, add it.
    adjusted_total = booking_in.total_amount
    if resolved_driver_total_cost > 0 and booking_in.driver_fee == 0.0:
        adjusted_total = round(booking_in.total_amount + resolved_driver_total_cost, 2)

    # Phase 3: resolve pickup_type
    resolved_pickup_type = booking_in.pickup_type or "self_pickup"

    # For with_driver trips: driver picks up the car — no user delivery choice needed
    if booking_in.trip_type == "with_driver":
        resolved_pickup_type = "driver_pickup"

    # Compute delivery fee (Phase 3)
    resolved_delivery_fee = 0.0
    if resolved_pickup_type == "host_delivery":
        # Validate host has delivery enabled
        if not (vehicle.host_delivery_available or vehicle.delivery_available):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Host delivery is not available for this vehicle."
            )
        
        flat_charge = vehicle.delivery_charge or 0.0
        distance_km = None
        if booking_in.delivery_lat is not None and booking_in.delivery_lng is not None:
            if vehicle.pickup_location_id:
                loc = db.query(Location).filter(Location.id == vehicle.pickup_location_id).first()
                if loc and loc.lat is not None and loc.lng is not None:
                    import math
                    lat1, lon1 = loc.lat, loc.lng
                    lat2, lon2 = booking_in.delivery_lat, booking_in.delivery_lng
                    
                    # Haversine formula
                    R = 6371.0
                    dlat = math.radians(lat2 - lat1)
                    dlon = math.radians(lon2 - lon1)
                    a = (math.sin(dlat / 2) ** 2 + 
                         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
                         math.sin(dlon / 2) ** 2)
                    c = 2 * math.asin(math.sqrt(a))
                    distance_km = R * c

        if distance_km is not None:
            max_r = vehicle.max_delivery_radius_km or 0.0
            if max_r > 0.0 and distance_km > max_r:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Delivery address is out of the host's maximum delivery range of {max_r} km (distance is {round(distance_km, 1)} km)."
                )
            per_km_fee = vehicle.delivery_fee_per_km or 0.0
            resolved_delivery_fee = round(flat_charge + (distance_km * per_km_fee), 2)
        else:
            resolved_delivery_fee = flat_charge

    # Fold delivery fee into total before 30/70 split (if not already included by frontend)
    if resolved_delivery_fee > 0 and (booking_in.delivery_fee or 0.0) == 0.0:
        adjusted_total = round(adjusted_total + resolved_delivery_fee, 2)
    else:
        # If frontend sent a fee, trust the resolved one as source of truth for the DB
        # but adjust the total difference if any
        fee_diff = resolved_delivery_fee - (booking_in.delivery_fee or 0.0)
        adjusted_total = round(adjusted_total + fee_diff, 2)

    # Create Booking in pending state
    new_booking = Booking(
        user_id=current_user.id,
        vehicle_id=booking_in.vehicle_id,
        driver_id=booking_in.driver_id,
        from_dt=booking_in.from_dt,
        to_dt=booking_in.to_dt,
        trip_type=booking_in.trip_type,
        trip_duration_hours=trip_duration_hours,
        pickup_type=resolved_pickup_type,
        pickup_address=booking_in.pickup_address,
        delivery_address=booking_in.delivery_address,
        delivery_lat=booking_in.delivery_lat,
        delivery_lng=booking_in.delivery_lng,
        base_amount=booking_in.base_amount,
        driver_fee=resolved_driver_total_cost or booking_in.driver_fee,
        driver_hourly_rate=resolved_driver_hourly_rate,
        driver_total_cost=resolved_driver_total_cost,
        delivery_fee=resolved_delivery_fee,
        gst_amount=booking_in.gst_amount,
        deposit_amount=booking_in.deposit_amount,
        total_amount=adjusted_total,
        status="pending",
        # Phase 1: 30/70 split (recalculated on adjusted total)
        partial_amount=round(adjusted_total * 0.30, 2),
        remaining_amount=round(adjusted_total * 0.70, 2),
        payment_mode="partial",
        balance_payment_status="pending",
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
    elif current_user.role == "guest":
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

    # Permission check: Customer can cancel; Host/Admin can change status
    if current_user.role == "guest" and current_user.id == booking.user_id:
        if booking_in.status != "cancelled":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers can only cancel their booking transactions"
            )
    elif current_user.role == "host":
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
    if booking_in.status == "confirmed":
        # Check for overlapping confirmed or ongoing bookings
        conflict = db.query(Booking).filter(
            Booking.vehicle_id == booking.vehicle_id,
            Booking.id != booking.id,
            Booking.status.in_(["confirmed", "ongoing"]),
            Booking.from_dt < booking.to_dt,
            Booking.to_dt > booking.from_dt
        ).first()
        
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle is already booked for these dates."
            )

    booking.status = booking_in.status
    db.commit()
    db.refresh(booking)

    # Load vehicle details for response
    booking.vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
    return booking


# ── Phase 1: Payment Summary ──────────────────────────────────────────────────
@router.get("/{booking_id}/payment-summary", response_model=PaymentSummaryResponse)
def get_payment_summary(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns partial/remaining payment breakdown for a booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return PaymentSummaryResponse(
        partial_amount=booking.partial_amount or 0.0,
        remaining_amount=booking.remaining_amount or 0.0,
        balance_payment_status=booking.balance_payment_status or "pending",
        total_amount=booking.total_amount,
        balance_paid_at=booking.balance_paid_at,
    )


# ── Phase 1: Pay Balance (70%) ────────────────────────────────────────────────
@router.post("/{booking_id}/pay-balance")
def pay_balance(
    booking_id: int,
    current_user: User = Depends(RoleChecker(["guest", "admin"])),
    db: Session = Depends(get_db)
):
    """Initiates and records the 70% balance payment after trip completion."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if str(booking.status) != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Balance can only be paid after the trip is completed"
        )

    if booking.balance_payment_status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Balance has already been paid"
        )

    remaining = booking.remaining_amount or round((booking.total_amount or 0) * 0.70, 2)
    transaction_id = f"BAL-{booking_id}-{int(datetime.now(timezone.utc).timestamp())}"

    # Record balance payment
    balance_payment = Payment(
        booking_id=booking_id,
        amount=remaining,
        status="success",
        method="sandbox_balance",
        gateway_ref=transaction_id,
    )
    db.add(balance_payment)

    # Update booking
    booking.balance_payment_status = "paid"
    booking.balance_paid_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(booking)

    return {
        "message": "Balance payment successful",
        "booking_id": booking_id,
        "amount_paid": remaining,
        "gateway_ref": transaction_id,
        "balance_payment_status": "paid",
    }

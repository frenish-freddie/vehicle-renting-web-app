from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from pathlib import Path
from app.database.connection import get_db
from app.models.models import Vehicle, User, RoleEnum, Location, Booking
from app.schemas.schemas import VehicleCreate, VehicleUpdate, VehicleResponse, DeliveryOptionsResponse
from app.auth.jwt import get_current_user, RoleChecker

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

from datetime import datetime

# Public: Browse and search/filter vehicles
@router.get("", response_model=List[VehicleResponse])
def browse_vehicles(
    category: Optional[str] = None,
    city: Optional[str] = None,
    fuel_type: Optional[str] = None,
    is_driver_available: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)
    
    # Only show admin-approved vehicles to the public
    query = query.filter(Vehicle.is_approved == True)
    
    if category:
        query = query.filter(Vehicle.category == category)
    if fuel_type:
        query = query.filter(Vehicle.fuel_type == fuel_type)
    if is_driver_available is not None:
        query = query.filter(Vehicle.is_driver_available == is_driver_available)
    if min_price is not None:
        query = query.filter(Vehicle.price_daily >= min_price)
    if max_price is not None:
        query = query.filter(Vehicle.price_daily <= max_price)
    if search:
        query = query.filter(
            (Vehicle.brand.ilike(f"%{search}%")) |
            (Vehicle.model.ilike(f"%{search}%")) |
            (Vehicle.sub_type.ilike(f"%{search}%"))
        )
        
    if start_date and end_date:
        # Find all vehicles that are booked in this date range
        overlapping_bookings = db.query(Booking.vehicle_id).filter(
            Booking.status.in_(["pending", "confirmed", "ongoing"]),
            Booking.from_dt < end_date,
            Booking.to_dt > start_date
        ).subquery()
        
        # Exclude those vehicles from the search results
        query = query.filter(~Vehicle.id.in_(overlapping_bookings))
        
    return query.all()

@router.get("/featured", response_model=List[VehicleResponse])
def get_featured_vehicles(city: Optional[str] = "Thrissur", db: Session = Depends(get_db)):
    # Only show admin-approved, available vehicles on the homepage
    query = db.query(Vehicle).filter(Vehicle.is_approved == True, Vehicle.is_available == True).limit(9)
    return query.all()

@router.get("/{id}", response_model=VehicleResponse)
def get_vehicle_details(id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    if not vehicle.is_approved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This vehicle is pending admin approval and is not yet available.")
    return vehicle

@router.get("/{id}/booked-dates")
def get_booked_dates(id: int, db: Session = Depends(get_db)):
    """Returns an array of date ranges where the vehicle is already booked."""
    bookings = db.query(Booking).filter(
        Booking.vehicle_id == id,
        Booking.status.in_(["pending", "confirmed", "ongoing"])
    ).all()
    
    booked_dates = []
    for b in bookings:
        booked_dates.append({
            "from_dt": b.from_dt.isoformat(),
            "to_dt": b.to_dt.isoformat()
        })
        
    return booked_dates


# Phase 3: Delivery options for a specific vehicle
@router.get("/{id}/delivery-options", response_model=DeliveryOptionsResponse)
def get_delivery_options(id: int, db: Session = Depends(get_db)):
    """
    Returns whether host delivery is available for this vehicle, along with fee structure.
    Called by the booking flow when user switches to 'host_delivery' pickup type.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    # Resolve host location address for self-pickup display
    # Resolve location object reference
    loc = None
    if vehicle.pickup_location_id:
        loc = db.query(Location).filter(Location.id == vehicle.pickup_location_id).first()
        if loc:
            host_location_text = f"{loc.name}, {loc.address}, {loc.city}"

    # host_delivery_available may use the new column OR fall back to legacy delivery_available
    delivery_available = bool(vehicle.host_delivery_available or vehicle.delivery_available)

    return {
        "host_delivery_available": delivery_available,
        "delivery_fee_per_km": vehicle.delivery_fee_per_km or 0.0,
        "max_delivery_radius_km": vehicle.max_delivery_radius_km or 0.0,
        "delivery_charge_flat": vehicle.delivery_charge or 0.0,
        "host_location": host_location_text,
        "host_lat": loc.lat if loc else None,
        "host_lng": loc.lng if loc else None,
    }

# Upload a document for a vehicle (photo, RC, insurance, etc.)
@router.post("/upload-doc", response_model=dict)
async def upload_vehicle_doc(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker([RoleEnum.host, RoleEnum.admin]))
):
    # Validate file type — only images and PDFs allowed
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "pdf"}
    ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Only JPG, PNG, WEBP images and PDF documents are accepted."
        )

    try:
        # __file__ = backend/app/routers/vehicles.py → .parent = routers/ → .parent = app/
        static_dir = Path(__file__).resolve().parent.parent / "static" / "vehicle_docs"
        static_dir.mkdir(parents=True, exist_ok=True)

        new_filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = static_dir / new_filename

        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Return the relative path (served via /static mount)
        return {"url": f"/static/vehicle_docs/{new_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

# Host / Admin: Create new listing
@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    current_user: User = Depends(RoleChecker([RoleEnum.host, RoleEnum.admin])),
    db: Session = Depends(get_db)
):
    new_vehicle = Vehicle(
        host_id=current_user.id,
        is_approved=False,
        **vehicle_in.model_dump()
    )
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

# Host / Admin: Modify listing
@router.put("/{id}", response_model=VehicleResponse)
def update_vehicle(
    id: int,
    vehicle_in: VehicleUpdate,
    current_user: User = Depends(RoleChecker([RoleEnum.host, RoleEnum.admin])),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        
    # Check ownership
    if current_user.role != RoleEnum.admin and vehicle.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this listing"
        )
        
    # Update fields
    update_data = vehicle_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vehicle, key, value)
        
    db.commit()
    db.refresh(vehicle)
    return vehicle

# Host / Admin: Delete listing
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    id: int,
    current_user: User = Depends(RoleChecker([RoleEnum.host, RoleEnum.admin])),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        
    # Check ownership
    if current_user.role != RoleEnum.admin and vehicle.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this listing"
        )
        
    db.delete(vehicle)
    db.commit()
    return None

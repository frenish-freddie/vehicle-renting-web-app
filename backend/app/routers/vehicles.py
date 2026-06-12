from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.models import Vehicle, User, RoleEnum, Location
from app.schemas.schemas import VehicleCreate, VehicleUpdate, VehicleResponse, DeliveryOptionsResponse
from app.auth.jwt import get_current_user, RoleChecker

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

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
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)
    
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
        
    return query.all()

@router.get("/featured", response_model=List[VehicleResponse])
def get_featured_vehicles(city: Optional[str] = "Thrissur", db: Session = Depends(get_db)):
    # Mock featured vehicles
    query = db.query(Vehicle).limit(9)
    return query.all()

@router.get("/{id}", response_model=VehicleResponse)
def get_vehicle_details(id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


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

# Host / Admin: Create new listing
@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    current_user: User = Depends(RoleChecker([RoleEnum.host, RoleEnum.admin])),
    db: Session = Depends(get_db)
):
    new_vehicle = Vehicle(
        host_id=current_user.id,
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

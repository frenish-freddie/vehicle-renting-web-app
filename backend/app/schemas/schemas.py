from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional, List, Any
from datetime import datetime

# ----------------- JWT SCHEMAS -----------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# ----------------- USER SCHEMAS -----------------
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "guest"
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_language: str = "English"

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    dl_verified: bool
    aadhaar_verified: bool
    wallet_balance: float
    referral_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- DRIVER SCHEMAS -----------------
class DriverBase(BaseModel):
    name: str
    photo_url: Optional[str] = None
    dl_classes: str
    experience_years: int
    languages: str
    bio: Optional[str] = None
    service_area: str
    vehicle_types_handled: str
    certifications: Optional[str] = None
    daily_rate: float
    hourly_rate: Optional[float] = None

class DriverCreate(DriverBase):
    user_id: int

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    photo_url: Optional[str] = None
    dl_classes: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[str] = None
    bio: Optional[str] = None
    service_area: Optional[str] = None
    vehicle_types_handled: Optional[str] = None
    certifications: Optional[str] = None
    daily_rate: Optional[float] = None
    hourly_rate: Optional[float] = None

class DriverResponse(DriverBase):
    id: int
    user_id: int
    is_police_verified: bool
    is_medically_fit: bool
    is_approved: bool
    rating_avg: float
    total_trips: int
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- VEHICLE SCHEMAS -----------------
class VehicleBase(BaseModel):
    category: str
    sub_type: str
    brand: str
    model: str
    year: int
    fuel_type: str
    transmission: Optional[str] = None
    seats: Optional[int] = None
    payload_capacity: Optional[float] = None
    registration_no: str
    color: Optional[str] = None
    images: str
    features: Optional[str] = None
    description: Optional[str] = None
    specs: Optional[str] = None
    is_available: bool = True
    is_driver_available: bool = False
    driver_daily_rate: float = 0.0
    pickup_location_id: Optional[int] = None
    delivery_available: bool = False
    delivery_charge: float = 0.0
    # Phase 3: granular delivery settings
    host_delivery_available: bool = False
    delivery_fee_per_km: float = 0.0
    max_delivery_radius_km: float = 0.0
    rc_url: Optional[str] = None
    insurance_url: Optional[str] = None
    price_hourly: Optional[float] = None
    price_daily: float
    price_weekly: Optional[float] = None
    price_monthly: Optional[float] = None
    security_deposit: float = 0.0
    min_rental_hours: int = 24
    excess_km_charge: float = 0.0
    fuel_policy: str = "full-to-full"
    documents_required: str

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    is_available: Optional[bool] = None
    price_daily: Optional[float] = None
    # Add other updatable fields as needed

class VehicleResponse(VehicleBase):
    id: int
    host_id: int
    rating_avg: float
    total_bookings: int
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- LOCATION SCHEMAS -----------------
class LocationBase(BaseModel):
    city: str
    name: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    type: str

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# ----------------- DELIVERY OPTIONS RESPONSE (Phase 3) -----------------
class DeliveryOptionsResponse(BaseModel):
    host_delivery_available: bool
    delivery_fee_per_km: float
    max_delivery_radius_km: float
    delivery_charge_flat: float  # existing flat delivery_charge
    host_location: Optional[str] = None  # textual address for self-pickup display
    host_lat: Optional[float] = None
    host_lng: Optional[float] = None

    class Config:
        from_attributes = True


# ----------------- DRIVER AVAILABLE SCHEMA (Phase 2) -----------------
class DriverAvailableItem(BaseModel):
    id: int
    name: str
    hourly_rate: float
    rating_avg: float
    experience_years: int
    languages: str
    dl_classes: str
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


# ----------------- BOOKING SCHEMAS -----------------
class BookingBase(BaseModel):
    vehicle_id: int
    driver_id: Optional[int] = None
    from_dt: datetime
    to_dt: datetime
    trip_type: str = "self_drive"
    trip_duration_hours: float = 0.0
    # Phase 3: pickup / delivery
    pickup_type: str = "self_pickup"   # 'self_pickup' | 'host_delivery' | 'driver_pickup'
    pickup_address: str
    delivery_address: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    add_ons: Optional[str] = None
    coupon_code: Optional[str] = None
    base_amount: float
    driver_fee: float = 0.0
    # Phase 2: hourly driver pricing
    driver_hourly_rate: float = 0.0
    driver_total_cost: float = 0.0
    delivery_fee: float = 0.0
    gst_amount: float = 0.0
    deposit_amount: float = 0.0
    total_amount: float
    gst_invoice_requested: bool = False
    gst_number: Optional[str] = None
    business_name: Optional[str] = None

class BookingCreate(BookingBase):
    @model_validator(mode='after')
    def validate_pickup_and_delivery(self):
        if self.trip_type == "with_driver":
            self.pickup_type = "driver_pickup"
            self.delivery_address = None
            self.delivery_lat = None
            self.delivery_lng = None
        elif self.trip_type == "self_drive" and self.pickup_type == "host_delivery":
            if not self.delivery_address or self.delivery_lat is None or self.delivery_lng is None:
                raise ValueError("delivery_address, delivery_lat, and delivery_lng are required when pickup_type is 'host_delivery'")
        return self

class BookingUpdate(BaseModel):
    status: str
    cancellation_reason: Optional[str] = None

class BookingResponse(BookingBase):
    id: int
    user_id: int
    status: str
    coupon_discount: float
    payment_id: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None

    # Phase 1: Partial Payment fields
    partial_amount: float = 0.0
    remaining_amount: float = 0.0
    payment_mode: str = "partial"
    balance_payment_status: str = "pending"
    balance_paid_at: Optional[datetime] = None

    # Phase 5: Ongoing Trip fields
    current_status: str = "confirmed"
    expected_return_at: Optional[datetime] = None
    actual_return_at: Optional[datetime] = None
    is_delayed: bool = False
    delay_minutes: int = 0

    class Config:
        from_attributes = True

# ----------------- PHASE 5 SCHEMAS -----------------
class TripStatusLogResponse(BaseModel):
    id: int
    booking_id: int
    status: str
    updated_by_role: str
    updated_by_id: int
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TripStatusUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = None
    is_delayed: Optional[bool] = None
    delay_minutes: Optional[int] = None

class PaymentInfoResponse(BaseModel):
    partial_amount: float
    remaining_amount: float
    balance_payment_status: str
    trip_duration_hours: float
    is_delayed: bool
    delay_minutes: int

    class Config:
        from_attributes = True



# ----------------- DRIVER BOOKING SCHEMAS -----------------
class DriverBookingBase(BaseModel):
    driver_id: int
    vehicle_id: Optional[int] = None
    from_dt: datetime
    to_dt: datetime
    shift_hours: int
    vehicle_type_needed: str
    pickup_address: str
    route_notes: Optional[str] = None
    amount: float

class DriverBookingCreate(DriverBookingBase):
    pass

class DriverBookingResponse(DriverBookingBase):
    id: int
    user_id: int
    status: str
    payment_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- PAYMENT SCHEMAS -----------------
class PaymentBase(BaseModel):
    booking_id: int
    amount: float
    method: str
    gateway_ref: str

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# Phase 1: Payment Summary
class PaymentSummaryResponse(BaseModel):
    partial_amount: float
    remaining_amount: float
    balance_payment_status: str
    total_amount: float
    balance_paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ----------------- REVIEW SCHEMAS -----------------
class ReviewBase(BaseModel):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    reviewer_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- OFFER SCHEMAS -----------------
class OfferBase(BaseModel):
    code: str
    title: str
    description: str
    discount_type: str
    discount_value: float
    min_booking_amount: float = 0.0
    max_discount: Optional[float] = None
    valid_from: datetime
    valid_to: datetime
    applicable_categories: str
    cities: str
    usage_limit: Optional[int] = None

class OfferCreate(OfferBase):
    pass

class OfferResponse(OfferBase):
    id: int
    used_count: int
    is_active: bool

    class Config:
        from_attributes = True


# ----------------- CHAT MESSAGE SCHEMAS -----------------
class ChatMessageBase(BaseModel):
    session_id: str
    user_id: Optional[int] = None
    role: str
    content: str
    message_type: str = "text"
    data: Optional[str] = None

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatQuery(BaseModel):
    message: str
    conversationHistory: List[Any] = []
    userId: Optional[int] = None
    currentPage: Optional[str] = None
    city: Optional[str] = "Thrissur"

class ChatQueryResponse(BaseModel):
    reply: str
    messageType: str
    data: Optional[Any] = None
    quickReplies: Optional[List[str]] = None

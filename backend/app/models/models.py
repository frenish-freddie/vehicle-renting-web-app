from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import enum

class RoleEnum(str, enum.Enum):
    guest = "guest"
    host = "host"
    driver = "driver"
    admin = "admin"

class CategoryEnum(str, enum.Enum):
    two_wheeler = "two_wheeler"
    car = "car"
    commercial = "commercial"
    machinery = "machinery"
    special = "special"

class BookingStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"

class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    refunded = "refunded"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    phone = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.guest)
    dl_verified = Column(Boolean, default=False)
    aadhaar_verified = Column(Boolean, default=False)
    wallet_balance = Column(Float, default=0.0)
    referral_code = Column(String, unique=True, nullable=True)
    preferred_language = Column(String, default="English")
    is_host_approved = Column(Boolean, default=True)  # Admin can suspend host accounts
    # Host KYC document fields
    host_aadhaar_url  = Column(String, nullable=True)                  # Aadhaar / Govt ID upload URL
    host_pan_url      = Column(String, nullable=True)                  # PAN / tax document upload URL
    host_kyc_status   = Column(String, default="unsubmitted")          # unsubmitted | pending | approved | rejected
    
    # User KYC document fields
    user_dl_url       = Column(String, nullable=True)                  # Driving License URL
    user_aadhaar_url  = Column(String, nullable=True)                  # Aadhaar URL
    user_kyc_status   = Column(String, default="unsubmitted")          # unsubmitted | pending | approved | rejected

    # Aadhaar text details
    aadhaar_name = Column(String, nullable=True)
    aadhaar_dob = Column(String, nullable=True)
    aadhaar_gender = Column(String, nullable=True)
    aadhaar_number = Column(String, nullable=True)
    aadhaar_address = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicles = relationship("Vehicle", back_populates="owner")
    bookings = relationship("Booking", back_populates="user")
    driver_profile = relationship("Driver", back_populates="user", uselist=False)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"))
    category = Column(Enum(CategoryEnum))
    sub_type = Column(String) # e.g., Hatchback, JCB Backhoe, Electric Scooter
    brand = Column(String)
    model = Column(String)
    year = Column(Integer)
    fuel_type = Column(String)
    transmission = Column(String, nullable=True)
    seats = Column(Integer, nullable=True)
    payload_capacity = Column(Float, nullable=True) # in tons
    registration_no = Column(String, unique=True)
    color = Column(String, nullable=True)
    images = Column(String) # JSON or comma separated URLs
    features = Column(String, nullable=True) # JSON
    specs = Column(String, nullable=True) # JSON for specific machinery specs
    
    is_available = Column(Boolean, default=True)
    is_driver_available = Column(Boolean, default=False)
    driver_daily_rate = Column(Float, default=0.0)
    
    pickup_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    delivery_available = Column(Boolean, default=False)
    delivery_charge = Column(Float, default=0.0)
    # Phase 3: granular delivery settings
    host_delivery_available  = Column(Boolean, default=False)
    delivery_fee_per_km      = Column(Float,   default=0.0)
    max_delivery_radius_km   = Column(Float,   default=0.0)
    
    price_hourly = Column(Float, nullable=True)
    price_daily = Column(Float)
    price_weekly = Column(Float, nullable=True)
    price_monthly = Column(Float, nullable=True)
    security_deposit = Column(Float, default=0.0)
    min_rental_hours = Column(Integer, default=24)
    excess_km_charge = Column(Float, default=0.0)
    fuel_policy = Column(String, default="full-to-full")
    documents_required = Column(String) # JSON
    rc_url = Column(String, nullable=True) # Uploaded Registration Certificate
    insurance_url = Column(String, nullable=True) # Uploaded Insurance document
    
    rating_avg = Column(Float, default=0.0)
    total_bookings = Column(Integer, default=0)
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="vehicles")
    bookings = relationship("Booking", back_populates="vehicle")
    location = relationship("Location", back_populates="vehicles")

class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    photo_url = Column(String, nullable=True)
    dl_classes = Column(String) # JSON string array
    experience_years = Column(Integer)
    languages = Column(String) # JSON string array
    bio = Column(Text, nullable=True)
    service_area = Column(String) # JSON
    vehicle_types_handled = Column(String) # JSON
    certifications = Column(String, nullable=True) # JSON
    
    is_police_verified = Column(Boolean, default=False)
    is_medically_fit = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)

    # ── Verification workflow ─────────────────────────────────────────────────
    license_url         = Column(String, nullable=True)            # URL/path of uploaded DL image
    verification_status = Column(String, default="unsubmitted")    # unsubmitted | pending | approved | rejected
    is_active           = Column(Boolean, default=False)           # True only when admin approves

    daily_rate = Column(Float)
    hourly_rate = Column(Float, nullable=True)
    rating_avg = Column(Float, default=0.0)
    total_trips = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


    user = relationship("User", back_populates="driver_profile")
    driver_bookings = relationship("DriverBooking", back_populates="driver")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    city = Column(String)
    name = Column(String)
    address = Column(String)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    type = Column(String) # station, airport, landmark, hub
    is_active = Column(Boolean, default=True)
    
    vehicles = relationship("Vehicle", back_populates="location")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    from_dt = Column(DateTime(timezone=True))
    to_dt = Column(DateTime(timezone=True))
    trip_type = Column(String, default="self") # self, with_driver, operator
    trip_duration_hours = Column(Float, default=0.0) # Phase 4
    
    # Phase 3: pickup / delivery
    pickup_type      = Column(String, default="self_pickup")  # 'self_pickup' | 'host_delivery' | 'driver_pickup'
    pickup_address   = Column(String)
    delivery_address = Column(String, nullable=True)
    delivery_lat     = Column(Float,  nullable=True)
    delivery_lng     = Column(Float,  nullable=True)
    
    # Phase 5: Ongoing Trip Status
    current_status = Column(String, default="confirmed")
    expected_return_at = Column(DateTime(timezone=True), nullable=True)
    actual_return_at = Column(DateTime(timezone=True), nullable=True)
    is_delayed = Column(Boolean, default=False)
    delay_minutes = Column(Integer, default=0)

    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.pending)
    add_ons = Column(String, nullable=True) # JSON
    coupon_code = Column(String, nullable=True)
    coupon_discount = Column(Float, default=0.0)
    
    base_amount = Column(Float)
    driver_fee = Column(Float, default=0.0)
    # Phase 2: per-hour driver pricing
    driver_hourly_rate = Column(Float, default=0.0)  # snapshot of hourly_rate at booking time
    driver_total_cost  = Column(Float, default=0.0)  # hourly_rate × trip_hours
    delivery_fee = Column(Float, default=0.0)
    gst_amount = Column(Float, default=0.0)
    deposit_amount = Column(Float, default=0.0)
    total_amount = Column(Float)
    commission_amount = Column(Float, default=0.0)  # 10% of base_amount — platform revenue
    payment_id = Column(String, nullable=True)

    # Phase 1: Partial Payment (30% at booking, 70% after trip)
    partial_amount          = Column(Float, default=0.0)           # 30% paid at booking
    remaining_amount        = Column(Float, default=0.0)           # 70% due after trip
    payment_mode            = Column(String, default="partial")    # always 'partial' for now
    balance_payment_status  = Column(String, default="pending")    # 'pending' | 'paid'
    balance_paid_at         = Column(DateTime(timezone=True), nullable=True)

    gst_invoice_requested = Column(Boolean, default=False)
    gst_number = Column(String, nullable=True)
    business_name = Column(String, nullable=True)
    cancellation_reason = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="bookings")
    vehicle = relationship("Vehicle", back_populates="bookings")
    driver = relationship("Driver")

class TripStatusLog(Base):
    __tablename__ = "trip_status_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    status = Column(String, nullable=False)
    updated_by_role = Column(String, nullable=False)
    updated_by_id = Column(Integer, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    booking = relationship("Booking", backref="status_logs")

class DriverBooking(Base):
    __tablename__ = "driver_bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True) # Null if user's own vehicle
    
    from_dt = Column(DateTime(timezone=True))
    to_dt = Column(DateTime(timezone=True))
    shift_hours = Column(Integer) # 8, 12, 24
    vehicle_type_needed = Column(String)
    
    pickup_address = Column(String)
    route_notes = Column(Text, nullable=True)
    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.pending)
    amount = Column(Float)
    payment_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driver = relationship("Driver", back_populates="driver_bookings")
    user = relationship("User")

class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    title = Column(String)
    description = Column(String)
    discount_type = Column(String) # percent, flat
    discount_value = Column(Float)
    min_booking_amount = Column(Float, default=0.0)
    max_discount = Column(Float, nullable=True)
    valid_from = Column(DateTime(timezone=True))
    valid_to = Column(DateTime(timezone=True))
    applicable_categories = Column(String) # JSON
    cities = Column(String) # JSON
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String) # user, bot
    content = Column(Text)
    message_type = Column(String, default="text") # text, vehicle_card, driver_card
    data = Column(String, nullable=True) # JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    amount = Column(Float)
    method = Column(String)
    gateway_ref = Column(String)
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    platform_commission = Column(Float, default=0.0)  # Mirrored from booking.commission_amount
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    rating = Column(Integer)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

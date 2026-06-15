import datetime
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.models import User, Vehicle
from app.auth.jwt import create_access_token

db = SessionLocal()
print("--- Testing Booking Creation ---")

# 1. Get an existing guest user
user = db.query(User).filter(User.role == "guest").first()
if not user:
    print("No guest user found! Cannot test.")
    exit(1)

print(f"Testing with user: {user.email}")
user.user_kyc_status = "approved"
db.commit()
print("User KYC forcefully approved.")

# Generate token
token = create_access_token({"sub": user.email, "id": user.id, "name": user.name, "role": user.role})

# Get a vehicle
vehicle = db.query(Vehicle).first()
if not vehicle:
    print("No vehicle found!")
    exit(1)

vehicle_id = vehicle.id

import requests
BASE_URL = "http://localhost:8000"

headers = {"Authorization": f"Bearer {token}"}
start_dt = datetime.datetime.now() + datetime.timedelta(days=1)
end_dt = start_dt + datetime.timedelta(days=2)

payload = {
    "vehicle_id": vehicle_id,
    "from_dt": start_dt.isoformat(),
    "to_dt": end_dt.isoformat(),
    "pickup_address": "Test Pickup",
    "delivery_address": "Test Drop",
    "pickup_type": "self_pickup",
    "trip_type": "self_drive",
    "base_amount": 1000,
    "total_amount": 1200
}

print(f"Creating booking for vehicle {vehicle_id}...")
book_res = requests.post(f"{BASE_URL}/api/bookings", headers=headers, json=payload)
print("Booking creation status:", book_res.status_code)
if book_res.status_code == 201:
    print("Booking ID:", book_res.json().get("id"))
else:
    print("Error:", book_res.json())

# Cleanup
if book_res.status_code == 201:
    booking_id = book_res.json().get("id")
    from app.models.models import Booking
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if b:
        db.delete(b)
        db.commit()
        print("Test booking deleted.")
        
db.close()

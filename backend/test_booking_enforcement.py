import requests
import datetime
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.models import User, Vehicle

BASE_URL = "http://localhost:8000"

print("--- Testing Booking Creation ---")

# 1. Login as test user
res = requests.post(f"{BASE_URL}/api/auth/login", data={
    "username": "guest123@test.com",
    "password": "password123"
})
if res.status_code != 200:
    res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Test Guest",
        "email": "guest123@test.com",
        "password": "password123",
        "role": "guest"
    })
    res = requests.post(f"{BASE_URL}/api/auth/login", data={
        "username": "guest123@test.com",
        "password": "password123"
    })
print("Login status:", res.status_code)
token = res.json().get("access_token")
user_email = "guest123@test.com"

# 2. Force KYC to approved directly in DB
db = SessionLocal()
user = db.query(User).filter(User.email == user_email).first()
if user:
    user.user_kyc_status = "approved"
    db.commit()
    print("User KYC forcefully approved.")

# Get a vehicle
vehicle = db.query(Vehicle).first()
if not vehicle:
    print("No vehicle found!")
    exit(1)

vehicle_id = vehicle.id
db.close()

# 3. Create Booking
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

# 4. Cleanup DB by deleting booking so it doesn't clutter
if book_res.status_code == 201:
    booking_id = book_res.json().get("id")
    db = SessionLocal()
    from app.models.models import Booking
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if b:
        db.delete(b)
        db.commit()
        print("Test booking deleted.")
    db.close()

import sys
import os

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.models import User, Vehicle, Driver, Booking

def print_separator(char="=", length=80):
    print(char * length)

def view_database():
    db = SessionLocal()
    try:
        # 1. Print Users
        print_separator("=")
        print("USER ACCOUNTS TABLE (flexiride.db -> users)")
        print_separator("-")
        print(f"{'ID':<4} | {'Name':<22} | {'Email':<26} | {'Role':<10} | {'Password Hash'}")
        print_separator("-")
        users = db.query(User).all()
        for u in users:
            print(f"{u.id:<4} | {u.name:<22} | {u.email:<26} | {u.role:<10} | {u.hashed_password[:45]}...")
        
        # 2. Print Drivers
        print("\n")
        print_separator("=")
        print("DRIVERS TABLE (flexiride.db -> drivers)")
        print_separator("-")
        print(f"{'ID':<4} | {'User ID':<8} | {'Driver Name':<22} | {'License (DL)':<18} | {'Exp (Yrs)':<10} | {'Rating'}")
        print_separator("-")
        drivers = db.query(Driver).all()
        for d in drivers:
            print(f"{d.id:<4} | {d.user_id:<8} | {d.name:<22} | {d.dl_classes:<18} | {d.experience_years:<10} | {d.rating_avg}")

        # 3. Print Vehicles
        print("\n")
        print_separator("=")
        print("VEHICLES FLEET TABLE (flexiride.db -> vehicles)")
        print_separator("-")
        print(f"{'ID':<4} | {'Vehicle Name':<30} | {'Category':<15} | {'Base Price':<10} | {'Location'}")
        print_separator("-")
        vehicles = db.query(Vehicle).all()
        for v in vehicles:
            v_name = f"{v.brand} {v.model}"
            v_loc = v.location.city if v.location else "Kerala"
            print(f"{v.id:<4} | {v_name:<30} | {v.category:<15} | Rs.{v.price_daily:<7} | {v_loc}")

        # 4. Print Bookings
        print("\n")
        print_separator("=")
        print("BOOKINGS TABLE (flexiride.db -> bookings)")
        print_separator("-")
        print(f"{'ID':<4} | {'User ID':<8} | {'Vehicle ID':<10} | {'Status':<10} | {'Total Price':<12} | {'Pickup Location'}")
        print_separator("-")
        bookings = db.query(Booking).all()
        if not bookings:
            print("No booking reservations found in database yet.")
        for b in bookings:
            print(f"{b.id:<4} | {b.user_id:<8} | {b.vehicle_id:<10} | {b.status:<10} | Rs.{b.total_amount:<10} | {b.pickup_address}")
        print_separator("=")

    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    view_database()

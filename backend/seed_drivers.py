import os
import sys

# Ensure backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.models import User, Driver, RoleEnum
from app.auth.security import get_password_hash

def run_seed():
    db: Session = SessionLocal()
    try:
        print("Starting Driver Seeding Process...")
        
        # We need 30 drivers total. 
        # 1-10 will be approved.
        # 11-30 will be pending.
        
        approved_count = 0
        pending_count = 0
        
        for i in range(1, 31):
            email = f"dummy_driver_{i}@example.com"
            
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                print(f"User {email} already exists. Skipping.")
                continue
                
            # Create User record
            new_user = User(
                name=f"Dummy Driver {i}",
                email=email,
                hashed_password=get_password_hash("driver123"),
                role=RoleEnum.driver
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            # Determine status
            is_approved = i <= 10
            status_str = "approved" if is_approved else "pending"
            
            # Create associated Driver record
            new_driver = Driver(
                user_id=new_user.id,
                name=new_user.name,
                dl_classes='["LMV", "MCWG"]',
                experience_years=i % 10 + 1, # Dummy experience
                languages='["English", "Hindi"]',
                service_area='{"city": "Bangalore"}',
                vehicle_types_handled='["car", "two_wheeler"]',
                daily_rate=500.0 + (i * 10),
                rating_avg=4.5,
                is_police_verified=is_approved,
                is_medically_fit=is_approved,
                is_approved=is_approved,
                
                # New Verification Workflow fields
                license_url="dummy_license_image.jpg",
                verification_status=status_str,
                is_active=is_approved
            )
            
            db.add(new_driver)
            db.commit()
            
            if is_approved:
                approved_count += 1
            else:
                pending_count += 1
                
            print(f"Created {status_str} Driver: {new_user.name} (User ID: {new_user.id})")
            
        print(f"\nSeeding Complete!")
        print(f"Total Approved Drivers Created: {approved_count}")
        print(f"Total Pending Drivers Created: {pending_count}")

    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()

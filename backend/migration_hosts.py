import os
import sys

# Ensure backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.models import User, Vehicle, RoleEnum
from app.auth.security import get_password_hash

def run_migration():
    db: Session = SessionLocal()
    try:
        # Get existing host
        existing_host = db.query(User).filter(User.role == RoleEnum.host).first()
        if not existing_host:
            print("Error: No existing host found.")
            return

        print(f"Found existing host: {existing_host.name} (ID: {existing_host.id})")

        # Create 9 new hosts if they don't exist
        new_hosts = []
        for i in range(2, 11):
            email = f"host{i}@example.com"
            host = db.query(User).filter(User.email == email).first()
            if not host:
                host = User(
                    name=f"Dummy Host {i}",
                    email=email,
                    hashed_password=get_password_hash("host123"), # Default password for dummy hosts
                    role=RoleEnum.host,
                    is_host_approved=True
                )
                db.add(host)
                db.commit()
                db.refresh(host)
                print(f"Created dummy host: {host.email} (ID: {host.id})")
            new_hosts.append(host)
        
        all_hosts = [existing_host] + new_hosts

        if len(all_hosts) != 10:
            print(f"Error: Expected 10 hosts, but found {len(all_hosts)}")
            return
        
        print("Ensured exactly 10 hosts exist.")

        # Get all vehicles
        vehicles = db.query(Vehicle).all()
        if len(vehicles) < 50:
            print(f"Warning: Expected at least 50 vehicles, but found {len(vehicles)}.")
            if len(vehicles) == 0:
                return
        
        print(f"Found {len(vehicles)} vehicles. Distributing 5 to each host...")
        
        # Distribute vehicles
        for i, host in enumerate(all_hosts):
            # Assign exactly 5 vehicles to this host
            start_idx = i * 5
            end_idx = start_idx + 5
            
            # If we don't have enough vehicles, just break
            if start_idx >= len(vehicles):
                break
                
            host_vehicles = vehicles[start_idx:end_idx]
            for v in host_vehicles:
                v.host_id = host.id
            
            print(f"Assigned {len(host_vehicles)} vehicles to {host.name} (ID: {host.id})")
        
        db.commit()
        print("Migration complete. Vehicles distributed successfully.")

    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()

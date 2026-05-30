import random

header = """import logging
from sqlalchemy.orm import Session
from app.database.connection import engine, SessionLocal, Base
from app.models.models import User, Vehicle, Location, RoleEnum, CategoryEnum, Driver
from app.auth.security import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    return get_password_hash(password)

def seed_database():
    logger.info("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    logger.info("Creating all tables from new models...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create Users
        admin = User(name="Admin User", email="admin@flexiride.com", hashed_password=hash_password("admin123"), role=RoleEnum.admin, phone="9999999999", dl_verified=True, aadhaar_verified=True)
        host = User(name="John Host", email="host@flexiride.com", hashed_password=hash_password("host123"), role=RoleEnum.host, phone="8888888888", dl_verified=True, aadhaar_verified=True)
        guest = User(name="Jane Guest", email="jane@example.com", hashed_password=hash_password("guest123"), role=RoleEnum.guest, phone="7777777777", dl_verified=False, aadhaar_verified=False)
        driver = User(name="Mike Driver", email="driver@flexiride.com", hashed_password=hash_password("driver123"), role=RoleEnum.driver, phone="6666666666", dl_verified=True, aadhaar_verified=True)
        db.add_all([admin, host, guest, driver])
        db.commit()
        db.refresh(host)
        db.refresh(driver)

        # Create Driver Profile
        driver_profile = Driver(user_id=driver.id, name=driver.name, dl_classes='["LMV", "HMV"]', experience_years=5, languages='["English", "Malayalam"]', service_area='{"city": "Thrissur"}', vehicle_types_handled='["car", "commercial"]', daily_rate=1000.0, rating_avg=4.8, is_approved=True)
        db.add(driver_profile)
        db.commit()

        # Create Locations
        loc_ekm = Location(city="Ernakulam", name="Kochi Airport (COK)", address="Nedumbassery", lat=10.1518, lng=76.3930, type="airport")
        loc_tvm = Location(city="Thiruvananthapuram", name="Trivandrum Central", address="Thampanoor", lat=8.4869, lng=76.9529, type="station")
        loc_koz = Location(city="Kozhikode", name="Calicut Beach", address="Beach Road", lat=11.2588, lng=75.7661, type="landmark")
        loc_thr = Location(city="Thrissur", name="Vadakkumnathan Temple Round", address="Swaraj Round", lat=10.5276, lng=76.2144, type="landmark")
        loc_pal = Location(city="Palakkad", name="Palakkad Fort", address="Fort Maidan", lat=10.7675, lng=76.6548, type="landmark")
        db.add_all([loc_ekm, loc_tvm, loc_koz, loc_thr, loc_pal])
        db.commit()
        db.refresh(loc_ekm); db.refresh(loc_tvm); db.refresh(loc_koz); db.refresh(loc_thr); db.refresh(loc_pal)

        # Create 50 Vehicles
        vehicles = [
"""

footer = """
        ]
        db.add_all(vehicles)
        db.commit()

        logger.info("Database successfully seeded with 50 vehicles!")

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
"""

raw_vehicles = [
    # SUVs
    ("car", "SUV", "Mahindra", "XUV700", "https://upload.wikimedia.org/wikipedia/commons/b/ba/2021_Mahindra_XUV700_2.2_AX7_%28India%29_front_view.png", 3000),
    ("car", "SUV", "Mahindra", "Scorpio N", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Mahindra_Scorpio-N.jpg/640px-Mahindra_Scorpio-N.jpg", 2800),
    ("car", "SUV", "Mahindra", "Thar", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Mahindra_Thar_SUV.jpg/640px-Mahindra_Thar_SUV.jpg", 3200),
    ("car", "SUV", "Toyota", "Fortuner", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Toyota_Fortuner_Legender_%28cropped%29.jpg/640px-Toyota_Fortuner_Legender_%28cropped%29.jpg", 4500),
    ("car", "SUV", "Hyundai", "Creta", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/2020_Hyundai_Creta.jpg/640px-2020_Hyundai_Creta.jpg", 2200),
    ("car", "SUV", "Kia", "Seltos", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Kia_Seltos.jpg/640px-Kia_Seltos.jpg", 2200),
    ("car", "SUV", "Tata", "Harrier", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Tata_Harrier.jpg/640px-Tata_Harrier.jpg", 2600),
    ("car", "SUV", "Tata", "Safari", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/2021_Tata_Safari.jpg/640px-2021_Tata_Safari.jpg", 2900),
    ("car", "SUV", "MG", "Hector", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/MG_Hector.jpg/640px-MG_Hector.jpg", 2500),
    ("car", "SUV", "Volkswagen", "Taigun", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Volkswagen_Taigun.jpg/640px-Volkswagen_Taigun.jpg", 2300),
    
    # Hatchbacks
    ("car", "Hatchback", "Maruti Suzuki", "Swift", "https://upload.wikimedia.org/wikipedia/commons/3/3d/Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg", 1200),
    ("car", "Hatchback", "Maruti Suzuki", "Baleno", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Suzuki_Baleno.jpg/640px-Suzuki_Baleno.jpg", 1300),
    ("car", "Hatchback", "Hyundai", "i20", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Hyundai_i20.jpg/640px-Hyundai_i20.jpg", 1400),
    ("car", "Hatchback", "Tata", "Altroz", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tata_Altroz.jpg/640px-Tata_Altroz.jpg", 1300),
    ("car", "Hatchback", "Tata", "Tiago", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Tata_Tiago.jpg/640px-Tata_Tiago.jpg", 1100),
    ("car", "Hatchback", "Renault", "Kwid", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Renault_Kwid.jpg/640px-Renault_Kwid.jpg", 1000),
    
    # Sedans
    ("car", "Sedan", "Honda", "City", "https://upload.wikimedia.org/wikipedia/commons/a/a9/2022_Honda_City_ZX_i-VTEC_%28India%29_front_view_%28cropped%29.jpg", 2000),
    ("car", "Sedan", "Hyundai", "Verna", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Hyundai_Verna_2023.jpg/640px-Hyundai_Verna_2023.jpg", 2100),
    ("car", "Sedan", "Skoda", "Slavia", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Skoda_Slavia.jpg/640px-Skoda_Slavia.jpg", 2200),
    ("car", "Sedan", "Volkswagen", "Virtus", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Volkswagen_Virtus.jpg/640px-Volkswagen_Virtus.jpg", 2200),
    ("car", "Sedan", "Maruti Suzuki", "Ciaz", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Maruti_Suzuki_Ciaz.jpg/640px-Maruti_Suzuki_Ciaz.jpg", 1800),
    ("car", "Sedan", "BMW", "3 Series", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/BMW_3_Series_M340i_xDrive.jpg/640px-BMW_3_Series_M340i_xDrive.jpg", 6000),
    ("car", "Sedan", "Mercedes-Benz", "C-Class", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Mercedes-Benz_C_Class.jpg/640px-Mercedes-Benz_C_Class.jpg", 6500),
    
    # MPVs
    ("car", "MPV", "Toyota", "Innova Crysta", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Toyota_Innova_Crysta.jpg/640px-Toyota_Innova_Crysta.jpg", 2800),
    ("car", "MPV", "Toyota", "Innova Hycross", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Toyota_Innova_Hycross.jpg/640px-Toyota_Innova_Hycross.jpg", 3200),
    ("car", "MPV", "Maruti Suzuki", "Ertiga", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Maruti_Suzuki_Ertiga.jpg/640px-Maruti_Suzuki_Ertiga.jpg", 1800),
    ("car", "MPV", "Kia", "Carens", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Kia_Carens.jpg/640px-Kia_Carens.jpg", 2000),
    
    # Two-Wheelers (Scooters)
    ("two_wheeler", "Scooter", "Honda", "Activa 6G", "https://upload.wikimedia.org/wikipedia/commons/e/ec/Gold_Metallic_Honda_Activa.jpg", 350),
    ("two_wheeler", "Scooter", "TVS", "Jupiter", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/TVS_Jupiter.jpg/640px-TVS_Jupiter.jpg", 350),
    ("two_wheeler", "Scooter", "Suzuki", "Access 125", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Suzuki_Access_125.jpg/640px-Suzuki_Access_125.jpg", 400),
    ("two_wheeler", "Scooter", "Ather", "450X", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ather_450.jpg/640px-Ather_450.jpg", 500),
    ("two_wheeler", "Scooter", "Ola", "S1 Pro", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Ola_S1_Pro.jpg/640px-Ola_S1_Pro.jpg", 550),
    
    # Two-Wheelers (Bikes)
    ("two_wheeler", "Motorcycle", "Royal Enfield", "Classic 350", "https://upload.wikimedia.org/wikipedia/commons/4/4e/Royal_Enfield_Classic_350_Signals_Edition.jpg", 800),
    ("two_wheeler", "Motorcycle", "Royal Enfield", "Meteor 350", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Royal_Enfield_Meteor_350.jpg/640px-Royal_Enfield_Meteor_350.jpg", 850),
    ("two_wheeler", "Motorcycle", "Royal Enfield", "Himalayan", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Royal_Enfield_Himalayan.jpg/640px-Royal_Enfield_Himalayan.jpg", 1000),
    ("two_wheeler", "Motorcycle", "KTM", "Duke 390", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/KTM_390_Duke_%282017%29_1.jpg/640px-KTM_390_Duke_%282017%29_1.jpg", 1200),
    ("two_wheeler", "Motorcycle", "KTM", "RC 200", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/KTM_RC_200.jpg/640px-KTM_RC_200.jpg", 900),
    ("two_wheeler", "Motorcycle", "Bajaj", "Pulsar NS200", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Bajaj_Pulsar_NS200.jpg/640px-Bajaj_Pulsar_NS200.jpg", 600),
    ("two_wheeler", "Motorcycle", "Yamaha", "R15 V4", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Yamaha_YZF-R15.jpg/640px-Yamaha_YZF-R15.jpg", 750),
    ("two_wheeler", "Motorcycle", "TVS", "Apache RR 310", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/TVS_Apache_RR_310.jpg/640px-TVS_Apache_RR_310.jpg", 950),
    
    # Commercial / Vans / Machinery
    ("commercial", "Van", "Force", "Traveller 14-Seater", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Force_Traveller_3350_14%2B1_Seater.jpg/640px-Force_Traveller_3350_14%2B1_Seater.jpg", 4000),
    ("commercial", "Pickup", "Mahindra", "Bolero Camper", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mahindra_Bolero_Camper.jpg/640px-Mahindra_Bolero_Camper.jpg", 1800),
    ("commercial", "Pickup", "Tata", "Ace Gold", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Tata_Ace.jpg/640px-Tata_Ace.jpg", 1200),
    ("commercial", "Pickup", "Ashok Leyland", "Dost", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Ashok_Leyland_DOST.jpg/640px-Ashok_Leyland_DOST.jpg", 1500),
    ("commercial", "Auto Rickshaw", "Bajaj", "RE", "https://upload.wikimedia.org/wikipedia/commons/4/49/Bajaj_auto-rickshaw_in_Sri_Lanka.jpg", 600),
    ("commercial", "Van", "Maruti Suzuki", "Eeco", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Maruti_Eeco.jpg/640px-Maruti_Eeco.jpg", 1000),
    
    # Machinery
    ("machinery", "Backhoe Loader", "JCB", "3DX", "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?auto=format&fit=crop&q=80&w=600", 8000),
    ("machinery", "Excavator", "Tata Hitachi", "EX 200", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Tata_Hitachi_Excavator.jpg/640px-Tata_Hitachi_Excavator.jpg", 12000),
    ("machinery", "Heavy Duty Truck", "BharatBenz", "3123R", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/BharatBenz.jpg/640px-BharatBenz.jpg", 12000),
    ("machinery", "Crane", "ACE", "15XWE", "https://images.unsplash.com/photo-1504307651254-35680f356f12?w=600&q=80", 15000),
]

# Guarantee we have exactly 50 by sampling or repeating if necessary
# We have exactly 50 in raw_vehicles! (let's count: 10 + 6 + 7 + 4 + 5 + 8 + 6 + 4 = 50)

locations = ["loc_ekm", "loc_tvm", "loc_koz", "loc_thr", "loc_pal"]
fuel_types = ["Petrol", "Diesel", "Electric", "CNG"]
transmissions = ["Manual", "Automatic"]

with open("c:\\Users\\USER\\Downloads\\vehicle renting web app\\backend\\app\\database\\seed.py", "w", encoding="utf-8") as f:
    f.write(header)
    for i, v in enumerate(raw_vehicles):
        cat, sub_type, brand, model, img, price = v
        loc = locations[i % len(locations)]
        fuel = "Petrol" if cat == "two_wheeler" else ("Diesel" if cat in ["machinery", "commercial"] else random.choice(["Petrol", "Diesel"]))
        if "Electric" in sub_type or brand in ["Ather", "Ola"]: fuel = "Electric"
        trans = "Manual" if cat == "two_wheeler" else random.choice(transmissions)
        seats = 2 if cat == "two_wheeler" else (7 if "SUV" in sub_type or "MPV" in sub_type else (5 if cat == "car" else 2))
        
        # Output Vehicle constructor string
        s = f'''            Vehicle(
                host_id=host.id, category=CategoryEnum.{cat}, sub_type="{sub_type}", brand="{brand}", model="{model}", year={random.randint(2020, 2024)}, fuel_type="{fuel}", transmission="{trans}", seats={seats},
                registration_no="KL-{random.randint(10,99)}-XX-{1000+i}", images="{img}", is_available=True, pickup_location_id={loc}.id,
                price_hourly={price/10}, price_daily={price}, security_deposit={price*2}, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
'''
        f.write(s)
    f.write(footer)

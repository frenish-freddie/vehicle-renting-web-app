import logging
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
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="Mahindra", model="XUV700", year=2023, fuel_type="Diesel", transmission="Automatic", seats=7,
                registration_no="KL-51-XX-1000", images="https://upload.wikimedia.org/wikipedia/commons/b/ba/2021_Mahindra_XUV700_2.2_AX7_%28India%29_front_view.png", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=300.0, price_daily=3000, security_deposit=6000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="Mahindra", model="Scorpio N", year=2024, fuel_type="Diesel", transmission="Automatic", seats=7,
                registration_no="KL-63-XX-1001", images="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Mahindra_Scorpio-N.jpg/640px-Mahindra_Scorpio-N.jpg", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=280.0, price_daily=2800, security_deposit=5600, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="Mahindra", model="Thar", year=2020, fuel_type="Petrol", transmission="Automatic", seats=7,
                registration_no="KL-62-XX-1002", images="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Mahindra_Thar_SUV.jpg/640px-Mahindra_Thar_SUV.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=320.0, price_daily=3200, security_deposit=6400, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="Toyota", model="Fortuner", year=2022, fuel_type="Diesel", transmission="Automatic", seats=7,
                registration_no="KL-38-XX-1003", images="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Toyota_Fortuner_Legender_%28cropped%29.jpg/640px-Toyota_Fortuner_Legender_%28cropped%29.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=450.0, price_daily=4500, security_deposit=9000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="Hyundai", model="Creta", year=2021, fuel_type="Diesel", transmission="Automatic", seats=7,
                registration_no="KL-15-XX-1004", images="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/2020_Hyundai_Creta.jpg/640px-2020_Hyundai_Creta.jpg", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=220.0, price_daily=2200, security_deposit=4400, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="Kia", model="Seltos", year=2021, fuel_type="Petrol", transmission="Manual", seats=7,
                registration_no="KL-90-XX-1005", images="https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Kia_Seltos.jpg/640px-Kia_Seltos.jpg", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=220.0, price_daily=2200, security_deposit=4400, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="Tata", model="Harrier", year=2023, fuel_type="Petrol", transmission="Manual", seats=7,
                registration_no="KL-38-XX-1006", images="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Tata_Harrier.jpg/640px-Tata_Harrier.jpg", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=260.0, price_daily=2600, security_deposit=5200, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="Tata", model="Safari", year=2023, fuel_type="Diesel", transmission="Automatic", seats=7,
                registration_no="KL-27-XX-1007", images="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/2021_Tata_Safari.jpg/640px-2021_Tata_Safari.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=290.0, price_daily=2900, security_deposit=5800, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="MG", model="Hector", year=2024, fuel_type="Petrol", transmission="Manual", seats=7,
                registration_no="KL-58-XX-1008", images="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/MG_Hector.jpg/640px-MG_Hector.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=250.0, price_daily=2500, security_deposit=5000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="SUV", brand="Volkswagen", model="Taigun", year=2024, fuel_type="Diesel", transmission="Automatic", seats=7,
                registration_no="KL-13-XX-1009", images="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Volkswagen_Taigun.jpg/640px-Volkswagen_Taigun.jpg", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=230.0, price_daily=2300, security_deposit=4600, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Hatchback", brand="Maruti Suzuki", model="Swift", year=2024, fuel_type="Petrol", transmission="Manual", seats=5,
                registration_no="KL-13-XX-1010", images="https://upload.wikimedia.org/wikipedia/commons/3/3d/Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=120.0, price_daily=1200, security_deposit=2400, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Hatchback", brand="Maruti Suzuki", model="Baleno", year=2021, fuel_type="Diesel", transmission="Automatic", seats=5,
                registration_no="KL-23-XX-1011", images="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Suzuki_Baleno.jpg/640px-Suzuki_Baleno.jpg", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=130.0, price_daily=1300, security_deposit=2600, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Hatchback", brand="Hyundai", model="i20", year=2021, fuel_type="Diesel", transmission="Manual", seats=5,
                registration_no="KL-54-XX-1012", images="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Hyundai_i20.jpg/640px-Hyundai_i20.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=140.0, price_daily=1400, security_deposit=2800, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Hatchback", brand="Tata", model="Altroz", year=2022, fuel_type="Diesel", transmission="Manual", seats=5,
                registration_no="KL-46-XX-1013", images="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tata_Altroz.jpg/640px-Tata_Altroz.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=130.0, price_daily=1300, security_deposit=2600, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Hatchback", brand="Tata", model="Tiago", year=2022, fuel_type="Diesel", transmission="Manual", seats=5,
                registration_no="KL-86-XX-1014", images="https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Tata_Tiago.jpg/640px-Tata_Tiago.jpg", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=110.0, price_daily=1100, security_deposit=2200, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Hatchback", brand="Renault", model="Kwid", year=2024, fuel_type="Petrol", transmission="Manual", seats=5,
                registration_no="KL-54-XX-1015", images="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Renault_Kwid.jpg/640px-Renault_Kwid.jpg", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=100.0, price_daily=1000, security_deposit=2000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Sedan", brand="Honda", model="City", year=2020, fuel_type="Diesel", transmission="Automatic", seats=5,
                registration_no="KL-76-XX-1016", images="https://upload.wikimedia.org/wikipedia/commons/a/a9/2022_Honda_City_ZX_i-VTEC_%28India%29_front_view_%28cropped%29.jpg", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=200.0, price_daily=2000, security_deposit=4000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Sedan", brand="Hyundai", model="Verna", year=2021, fuel_type="Petrol", transmission="Manual", seats=5,
                registration_no="KL-95-XX-1017", images="https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Hyundai_Verna_2023.jpg/640px-Hyundai_Verna_2023.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=210.0, price_daily=2100, security_deposit=4200, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Sedan", brand="Skoda", model="Slavia", year=2024, fuel_type="Diesel", transmission="Manual", seats=5,
                registration_no="KL-99-XX-1018", images="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Skoda_Slavia.jpg/640px-Skoda_Slavia.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=220.0, price_daily=2200, security_deposit=4400, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Sedan", brand="Volkswagen", model="Virtus", year=2023, fuel_type="Petrol", transmission="Manual", seats=5,
                registration_no="KL-27-XX-1019", images="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Volkswagen_Virtus.jpg/640px-Volkswagen_Virtus.jpg", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=220.0, price_daily=2200, security_deposit=4400, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Sedan", brand="Maruti Suzuki", model="Ciaz", year=2020, fuel_type="Petrol", transmission="Automatic", seats=5,
                registration_no="KL-74-XX-1020", images="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Maruti_Suzuki_Ciaz.jpg/640px-Maruti_Suzuki_Ciaz.jpg", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=180.0, price_daily=1800, security_deposit=3600, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Sedan", brand="BMW", model="3 Series", year=2022, fuel_type="Petrol", transmission="Automatic", seats=5,
                registration_no="KL-31-XX-1021", images="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/BMW_3_Series_M340i_xDrive.jpg/640px-BMW_3_Series_M340i_xDrive.jpg", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=600.0, price_daily=6000, security_deposit=12000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="Sedan", brand="Mercedes-Benz", model="C-Class", year=2021, fuel_type="Diesel", transmission="Manual", seats=5,
                registration_no="KL-12-XX-1022", images="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Mercedes-Benz_C_Class.jpg/640px-Mercedes-Benz_C_Class.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=650.0, price_daily=6500, security_deposit=13000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="MPV", brand="Toyota", model="Innova Crysta", year=2023, fuel_type="Petrol", transmission="Manual", seats=7,
                registration_no="KL-33-XX-1023", images="https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Toyota_Innova_Crysta.jpg/640px-Toyota_Innova_Crysta.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=280.0, price_daily=2800, security_deposit=5600, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="MPV", brand="Toyota", model="Innova Hycross", year=2020, fuel_type="Diesel", transmission="Manual", seats=7,
                registration_no="KL-73-XX-1024", images="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Toyota_Innova_Hycross.jpg/640px-Toyota_Innova_Hycross.jpg", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=320.0, price_daily=3200, security_deposit=6400, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="MPV", brand="Maruti Suzuki", model="Ertiga", year=2020, fuel_type="Petrol", transmission="Automatic", seats=7,
                registration_no="KL-38-XX-1025", images="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Maruti_Suzuki_Ertiga.jpg/640px-Maruti_Suzuki_Ertiga.jpg", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=180.0, price_daily=1800, security_deposit=3600, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.car, sub_type="MPV", brand="Kia", model="Carens", year=2021, fuel_type="Petrol", transmission="Automatic", seats=7,
                registration_no="KL-14-XX-1026", images="https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Kia_Carens.jpg/640px-Kia_Carens.jpg", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=200.0, price_daily=2000, security_deposit=4000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Scooter", brand="Honda", model="Activa 6G", year=2022, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-34-XX-1027", images="https://upload.wikimedia.org/wikipedia/commons/e/ec/Gold_Metallic_Honda_Activa.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=35.0, price_daily=350, security_deposit=700, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Scooter", brand="TVS", model="Jupiter", year=2023, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-81-XX-1028", images="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/TVS_Jupiter.jpg/640px-TVS_Jupiter.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=35.0, price_daily=350, security_deposit=700, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Scooter", brand="Suzuki", model="Access 125", year=2021, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-47-XX-1029", images="https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Suzuki_Access_125.jpg/640px-Suzuki_Access_125.jpg", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=40.0, price_daily=400, security_deposit=800, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Scooter", brand="Ather", model="450X", year=2022, fuel_type="Electric", transmission="Manual", seats=2,
                registration_no="KL-21-XX-1030", images="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ather_450.jpg/640px-Ather_450.jpg", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=50.0, price_daily=500, security_deposit=1000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Scooter", brand="Ola", model="S1 Pro", year=2020, fuel_type="Electric", transmission="Manual", seats=2,
                registration_no="KL-81-XX-1031", images="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Ola_S1_Pro.jpg/640px-Ola_S1_Pro.jpg", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=55.0, price_daily=550, security_deposit=1100, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Motorcycle", brand="Royal Enfield", model="Classic 350", year=2020, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-71-XX-1032", images="https://upload.wikimedia.org/wikipedia/commons/4/4e/Royal_Enfield_Classic_350_Signals_Edition.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=80.0, price_daily=800, security_deposit=1600, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Motorcycle", brand="Royal Enfield", model="Meteor 350", year=2021, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-93-XX-1033", images="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Royal_Enfield_Meteor_350.jpg/640px-Royal_Enfield_Meteor_350.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=85.0, price_daily=850, security_deposit=1700, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Motorcycle", brand="Royal Enfield", model="Himalayan", year=2020, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-55-XX-1034", images="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Royal_Enfield_Himalayan.jpg/640px-Royal_Enfield_Himalayan.jpg", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=100.0, price_daily=1000, security_deposit=2000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Motorcycle", brand="KTM", model="Duke 390", year=2023, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-75-XX-1035", images="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/KTM_390_Duke_%282017%29_1.jpg/640px-KTM_390_Duke_%282017%29_1.jpg", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=120.0, price_daily=1200, security_deposit=2400, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Motorcycle", brand="KTM", model="RC 200", year=2024, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-19-XX-1036", images="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/KTM_RC_200.jpg/640px-KTM_RC_200.jpg", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=90.0, price_daily=900, security_deposit=1800, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Motorcycle", brand="Bajaj", model="Pulsar NS200", year=2024, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-97-XX-1037", images="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Bajaj_Pulsar_NS200.jpg/640px-Bajaj_Pulsar_NS200.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=60.0, price_daily=600, security_deposit=1200, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Motorcycle", brand="Yamaha", model="R15 V4", year=2020, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-75-XX-1038", images="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Yamaha_YZF-R15.jpg/640px-Yamaha_YZF-R15.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=75.0, price_daily=750, security_deposit=1500, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.two_wheeler, sub_type="Motorcycle", brand="TVS", model="Apache RR 310", year=2022, fuel_type="Petrol", transmission="Manual", seats=2,
                registration_no="KL-60-XX-1039", images="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/TVS_Apache_RR_310.jpg/640px-TVS_Apache_RR_310.jpg", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=95.0, price_daily=950, security_deposit=1900, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.commercial, sub_type="Van", brand="Force", model="Traveller 14-Seater", year=2020, fuel_type="Diesel", transmission="Automatic", seats=2,
                registration_no="KL-85-XX-1040", images="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Force_Traveller_3350_14%2B1_Seater.jpg/640px-Force_Traveller_3350_14%2B1_Seater.jpg", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=400.0, price_daily=4000, security_deposit=8000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.commercial, sub_type="Pickup", brand="Mahindra", model="Bolero Camper", year=2020, fuel_type="Diesel", transmission="Manual", seats=2,
                registration_no="KL-58-XX-1041", images="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mahindra_Bolero_Camper.jpg/640px-Mahindra_Bolero_Camper.jpg", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=180.0, price_daily=1800, security_deposit=3600, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.commercial, sub_type="Pickup", brand="Tata", model="Ace Gold", year=2024, fuel_type="Diesel", transmission="Automatic", seats=2,
                registration_no="KL-94-XX-1042", images="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Tata_Ace.jpg/640px-Tata_Ace.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=120.0, price_daily=1200, security_deposit=2400, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.commercial, sub_type="Pickup", brand="Ashok Leyland", model="Dost", year=2024, fuel_type="Diesel", transmission="Manual", seats=2,
                registration_no="KL-18-XX-1043", images="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Ashok_Leyland_DOST.jpg/640px-Ashok_Leyland_DOST.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=150.0, price_daily=1500, security_deposit=3000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.commercial, sub_type="Auto Rickshaw", brand="Bajaj", model="RE", year=2022, fuel_type="Diesel", transmission="Automatic", seats=2,
                registration_no="KL-91-XX-1044", images="https://upload.wikimedia.org/wikipedia/commons/4/49/Bajaj_auto-rickshaw_in_Sri_Lanka.jpg", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=60.0, price_daily=600, security_deposit=1200, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.commercial, sub_type="Van", brand="Maruti Suzuki", model="Eeco", year=2021, fuel_type="Diesel", transmission="Automatic", seats=2,
                registration_no="KL-57-XX-1045", images="https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Maruti_Eeco.jpg/640px-Maruti_Eeco.jpg", is_available=True, pickup_location_id=loc_ekm.id,
                price_hourly=100.0, price_daily=1000, security_deposit=2000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.machinery, sub_type="Backhoe Loader", brand="JCB", model="3DX", year=2022, fuel_type="Diesel", transmission="Manual", seats=2,
                registration_no="KL-96-XX-1046", images="https://images.unsplash.com/photo-1541888086425-d81bb19240f5?auto=format&fit=crop&q=80&w=600", is_available=True, pickup_location_id=loc_tvm.id,
                price_hourly=800.0, price_daily=8000, security_deposit=16000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.machinery, sub_type="Excavator", brand="Tata Hitachi", model="EX 200", year=2023, fuel_type="Diesel", transmission="Manual", seats=2,
                registration_no="KL-89-XX-1047", images="https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Tata_Hitachi_Excavator.jpg/640px-Tata_Hitachi_Excavator.jpg", is_available=True, pickup_location_id=loc_koz.id,
                price_hourly=1200.0, price_daily=12000, security_deposit=24000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.machinery, sub_type="Heavy Duty Truck", brand="BharatBenz", model="3123R", year=2024, fuel_type="Diesel", transmission="Automatic", seats=2,
                registration_no="KL-36-XX-1048", images="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/BharatBenz.jpg/640px-BharatBenz.jpg", is_available=True, pickup_location_id=loc_thr.id,
                price_hourly=1200.0, price_daily=12000, security_deposit=24000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),
            Vehicle(
                host_id=host.id, category=CategoryEnum.machinery, sub_type="Crane", brand="ACE", model="15XWE", year=2024, fuel_type="Diesel", transmission="Automatic", seats=2,
                registration_no="KL-21-XX-1049", images="https://images.unsplash.com/photo-1504307651254-35680f356f12?w=600&q=80", is_available=True, pickup_location_id=loc_pal.id,
                price_hourly=1500.0, price_daily=15000, security_deposit=30000, min_rental_hours=12, documents_required='["DL", "Aadhaar"]'
            ),

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

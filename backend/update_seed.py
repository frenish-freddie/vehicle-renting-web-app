import re

with open('app/database/seed.py', 'r', encoding='utf-8') as f:
    data = f.read()

replacements = {
    'Royal Enfield Classic 350': 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Royal_Enfield_Classic_350_Signals_Edition.jpg',
    'Activa 6G Scooter': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Gold_Metallic_Honda_Activa.jpg',
    'Bajaj RE Auto Rickshaw': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Bajaj_auto-rickshaw_in_Sri_Lanka.jpg',
    'Maruti Swift Hatchback': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg',
    'Honda City Sedan': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/2022_Honda_City_ZX_i-VTEC_%28India%29_front_view_%28cropped%29.jpg',
    'Mahindra XUV700 Luxury SUV': 'https://upload.wikimedia.org/wikipedia/commons/b/ba/2021_Mahindra_XUV700_2.2_AX7_%28India%29_front_view.png',
    'Tata Ace Gold Mini Truck': 'https://upload.wikimedia.org/wikipedia/commons/8/83/Tataintroace.jpg',
    'Mahindra Bolero Pickup Van': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Mahindra_Bolero_ZLX.jpg',
    'BharatBenz Heavy Duty Cargo Loader': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/BharatBenz.jpg/640px-BharatBenz.jpg',
    'Yamaha YZF R15 V4': 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Yamaha_R15_V3.0.jpg',
    'Vespa VXL 150 Elegante': 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Vespa_GTS_125_-_Front_view.jpg',
    'Piaggio Ape DX Passenger': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Piaggio_Ape_Calessino_1.jpg',
    'Tesla Model 3 Performance': 'https://upload.wikimedia.org/wikipedia/commons/9/91/2019_Tesla_Model_3_Performance_AWD_Front.jpg',
    'Toyota Fortuner Legender': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Toyota_Fortuner_Legender_%28cropped%29.jpg/640px-Toyota_Fortuner_Legender_%28cropped%29.jpg',
    'Force Traveller Premium': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Force_Traveller_3350_14%2B1_Seater.jpg/640px-Force_Traveller_3350_14%2B1_Seater.jpg',
    'Isuzu D-Max V-Cross': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/2020_Isuzu_D-Max_V-Cross_4x4_Double_Cab.jpg/640px-2020_Isuzu_D-Max_V-Cross_4x4_Double_Cab.jpg'
}

for name, url in replacements.items():
    pattern = re.compile(rf'(vehicle_name="{name}".*?images=")(.*?)(")', re.DOTALL)
    data = pattern.sub(rf'\g<1>{url}\g<3>', data)

new_vehicles = '''            ,
            Vehicle(
                owner_id=owner.id,
                vehicle_name="Hyundai Creta SX(O)",
                vehicle_category="car",
                brand="Hyundai",
                model="Creta",
                registration_number="MH-01-CR-8899",
                fuel_type="Diesel",
                seating_capacity=5,
                load_capacity=0.45,
                base_price=1600.0,
                price_per_km=14.0,
                driver_available=True,
                driver_cost=1100.0,
                location="Koregaon Park, Pune",
                availability_status="available",
                images="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/2020_Hyundai_Creta_1.5_GLS_%28India%29.jpg/640px-2020_Hyundai_Creta_1.5_GLS_%28India%29.jpg"
            ),
            Vehicle(
                owner_id=owner.id,
                vehicle_name="KTM Duke 390",
                vehicle_category="two_wheeler",
                brand="KTM",
                model="Duke 390",
                registration_number="DL-4C-KM-3900",
                fuel_type="Petrol",
                seating_capacity=2,
                load_capacity=0.15,
                base_price=600.0,
                price_per_km=6.0,
                driver_available=False,
                driver_cost=0.0,
                location="Hauz Khas, Delhi",
                availability_status="available",
                images="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/KTM_390_Duke_%282017%29_1.jpg/640px-KTM_390_Duke_%282017%29_1.jpg"
            ),
            Vehicle(
                owner_id=owner.id,
                vehicle_name="Ashok Leyland Dost",
                vehicle_category="pickup",
                brand="Ashok Leyland",
                model="Dost",
                registration_number="TN-02-AL-4455",
                fuel_type="Diesel",
                seating_capacity=2,
                load_capacity=1.5,
                base_price=1100.0,
                price_per_km=15.0,
                driver_available=True,
                driver_cost=950.0,
                location="Guindy, Chennai",
                availability_status="available",
                images="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Ashok_Leyland_DOST.jpg/640px-Ashok_Leyland_DOST.jpg"
            ),
            Vehicle(
                owner_id=owner.id,
                vehicle_name="BMW 5 Series 530d M Sport",
                vehicle_category="car",
                brand="BMW",
                model="5 Series",
                registration_number="KA-05-BM-5500",
                fuel_type="Diesel",
                seating_capacity=5,
                load_capacity=0.5,
                base_price=4500.0,
                price_per_km=35.0,
                driver_available=True,
                driver_cost=2500.0,
                location="Lavelle Road, Bangalore",
                availability_status="available",
                images="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/BMW_520d_xDrive_M_Sport_%28G30%2C_Facelift%29_IMG_3850.jpg/640px-BMW_520d_xDrive_M_Sport_%28G30%2C_Facelift%29_IMG_3850.jpg"
            )'''

data = data.replace('        ]\n        \n        db.add_all(vehicles)', new_vehicles + '\n        ]\n        \n        db.add_all(vehicles)')

with open('app/database/seed.py', 'w', encoding='utf-8') as f:
    f.write(data)

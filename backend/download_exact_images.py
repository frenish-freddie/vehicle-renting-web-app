import sqlite3
import cv2
import numpy as np
import requests
import os
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

plate_cascade = cv2.CascadeClassifier('haarcascade_russian_plate_number.xml')

SAVE_DIR = r"c:\Users\USER\Downloads\vehicle renting web app\frontend\public\vehicles"
os.makedirs(SAVE_DIR, exist_ok=True)

raw_vehicles = [
    # SUVs
    ("car", "SUV", "Mahindra", "XUV700", "https://upload.wikimedia.org/wikipedia/commons/b/ba/2021_Mahindra_XUV700_2.2_AX7_%28India%29_front_view.png"),
    ("car", "SUV", "Mahindra", "Scorpio N", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Mahindra_Scorpio-N.jpg/640px-Mahindra_Scorpio-N.jpg"),
    ("car", "SUV", "Mahindra", "Thar", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Mahindra_Thar_SUV.jpg/640px-Mahindra_Thar_SUV.jpg"),
    ("car", "SUV", "Toyota", "Fortuner", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Toyota_Fortuner_Legender_%28cropped%29.jpg/640px-Toyota_Fortuner_Legender_%28cropped%29.jpg"),
    ("car", "SUV", "Hyundai", "Creta", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/2020_Hyundai_Creta.jpg/640px-2020_Hyundai_Creta.jpg"),
    ("car", "SUV", "Kia", "Seltos", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Kia_Seltos.jpg/640px-Kia_Seltos.jpg"),
    ("car", "SUV", "Tata", "Harrier", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Tata_Harrier.jpg/640px-Tata_Harrier.jpg"),
    ("car", "SUV", "Tata", "Safari", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/2021_Tata_Safari.jpg/640px-2021_Tata_Safari.jpg"),
    ("car", "SUV", "MG", "Hector", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/MG_Hector.jpg/640px-MG_Hector.jpg"),
    ("car", "SUV", "Volkswagen", "Taigun", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Volkswagen_Taigun.jpg/640px-Volkswagen_Taigun.jpg"),
    
    # Hatchbacks
    ("car", "Hatchback", "Maruti Suzuki", "Swift", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg/640px-Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg"),
    ("car", "Hatchback", "Maruti Suzuki", "Baleno", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Suzuki_Baleno.jpg/640px-Suzuki_Baleno.jpg"),
    ("car", "Hatchback", "Hyundai", "i20", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Hyundai_i20.jpg/640px-Hyundai_i20.jpg"),
    ("car", "Hatchback", "Tata", "Altroz", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tata_Altroz.jpg/640px-Tata_Altroz.jpg"),
    ("car", "Hatchback", "Tata", "Tiago", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Tata_Tiago.jpg/640px-Tata_Tiago.jpg"),
    ("car", "Hatchback", "Renault", "Kwid", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Renault_Kwid.jpg/640px-Renault_Kwid.jpg"),
    
    # Sedans
    ("car", "Sedan", "Honda", "City", "https://upload.wikimedia.org/wikipedia/commons/a/a9/2022_Honda_City_ZX_i-VTEC_%28India%29_front_view_%28cropped%29.jpg"),
    ("car", "Sedan", "Hyundai", "Verna", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Hyundai_Verna_2023.jpg/640px-Hyundai_Verna_2023.jpg"),
    ("car", "Sedan", "Skoda", "Slavia", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Skoda_Slavia.jpg/640px-Skoda_Slavia.jpg"),
    ("car", "Sedan", "Volkswagen", "Virtus", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Volkswagen_Virtus.jpg/640px-Volkswagen_Virtus.jpg"),
    ("car", "Sedan", "Maruti Suzuki", "Ciaz", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Maruti_Suzuki_Ciaz.jpg/640px-Maruti_Suzuki_Ciaz.jpg"),
    ("car", "Sedan", "BMW", "3 Series", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/BMW_3_Series_M340i_xDrive.jpg/640px-BMW_3_Series_M340i_xDrive.jpg"),
    ("car", "Sedan", "Mercedes-Benz", "C-Class", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Mercedes-Benz_C_Class.jpg/640px-Mercedes-Benz_C_Class.jpg"),
    
    # MPVs
    ("car", "MPV", "Toyota", "Innova Crysta", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Toyota_Innova_Crysta.jpg/640px-Toyota_Innova_Crysta.jpg"),
    ("car", "MPV", "Toyota", "Innova Hycross", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Toyota_Innova_Hycross.jpg/640px-Toyota_Innova_Hycross.jpg"),
    ("car", "MPV", "Maruti Suzuki", "Ertiga", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Maruti_Suzuki_Ertiga.jpg/640px-Maruti_Suzuki_Ertiga.jpg"),
    ("car", "MPV", "Kia", "Carens", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Kia_Carens.jpg/640px-Kia_Carens.jpg"),
    
    # Two-Wheelers (Scooters)
    ("two_wheeler", "Scooter", "Honda", "Activa 6G", "https://upload.wikimedia.org/wikipedia/commons/e/ec/Gold_Metallic_Honda_Activa.jpg"),
    ("two_wheeler", "Scooter", "TVS", "Jupiter", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/TVS_Jupiter.jpg/640px-TVS_Jupiter.jpg"),
    ("two_wheeler", "Scooter", "Suzuki", "Access 125", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Suzuki_Access_125.jpg/640px-Suzuki_Access_125.jpg"),
    ("two_wheeler", "Scooter", "Ather", "450X", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ather_450.jpg/640px-Ather_450.jpg"),
    ("two_wheeler", "Scooter", "Ola", "S1 Pro", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Ola_S1_Pro.jpg/640px-Ola_S1_Pro.jpg"),
    
    # Two-Wheelers (Bikes)
    ("two_wheeler", "Motorcycle", "Royal Enfield", "Classic 350", "https://upload.wikimedia.org/wikipedia/commons/4/4e/Royal_Enfield_Classic_350_Signals_Edition.jpg"),
    ("two_wheeler", "Motorcycle", "Royal Enfield", "Meteor 350", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Royal_Enfield_Meteor_350.jpg/640px-Royal_Enfield_Meteor_350.jpg"),
    ("two_wheeler", "Motorcycle", "Royal Enfield", "Himalayan", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Royal_Enfield_Himalayan.jpg/640px-Royal_Enfield_Himalayan.jpg"),
    ("two_wheeler", "Motorcycle", "KTM", "Duke 390", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/KTM_390_Duke_%282017%29_1.jpg/640px-KTM_390_Duke_%282017%29_1.jpg"),
    ("two_wheeler", "Motorcycle", "KTM", "RC 200", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/KTM_RC_200.jpg/640px-KTM_RC_200.jpg"),
    ("two_wheeler", "Motorcycle", "Bajaj", "Pulsar NS200", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Bajaj_Pulsar_NS200.jpg/640px-Bajaj_Pulsar_NS200.jpg"),
    ("two_wheeler", "Motorcycle", "Yamaha", "R15 V4", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Yamaha_YZF-R15.jpg/640px-Yamaha_YZF-R15.jpg"),
    ("two_wheeler", "Motorcycle", "TVS", "Apache RR 310", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/TVS_Apache_RR_310.jpg/640px-TVS_Apache_RR_310.jpg"),
    
    # Commercial / Vans / Machinery
    ("commercial", "Van", "Force", "Traveller 14-Seater", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Force_Traveller_3350_14%2B1_Seater.jpg/640px-Force_Traveller_3350_14%2B1_Seater.jpg"),
    ("commercial", "Pickup", "Mahindra", "Bolero Camper", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mahindra_Bolero_Camper.jpg/640px-Mahindra_Bolero_Camper.jpg"),
    ("commercial", "Pickup", "Tata", "Ace Gold", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Tata_Ace.jpg/640px-Tata_Ace.jpg"),
    ("commercial", "Pickup", "Ashok Leyland", "Dost", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Ashok_Leyland_DOST.jpg/640px-Ashok_Leyland_DOST.jpg"),
    ("commercial", "Auto Rickshaw", "Bajaj", "RE", "https://upload.wikimedia.org/wikipedia/commons/4/49/Bajaj_auto-rickshaw_in_Sri_Lanka.jpg"),
    ("commercial", "Van", "Maruti Suzuki", "Eeco", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Maruti_Eeco.jpg/640px-Maruti_Eeco.jpg"),
    
    # Machinery
    ("machinery", "Backhoe Loader", "JCB", "3DX", "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?auto=format&fit=crop&q=80&w=600"),
    ("machinery", "Excavator", "Tata Hitachi", "EX 200", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Tata_Hitachi_Excavator.jpg/640px-Tata_Hitachi_Excavator.jpg"),
    ("machinery", "Heavy Duty Truck", "BharatBenz", "3123R", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/BharatBenz.jpg/640px-BharatBenz.jpg"),
    ("machinery", "Crane", "ACE", "15XWE", "https://images.unsplash.com/photo-1504307651254-35680f356f12?w=600&q=80"),
]

# Map brand+model to URL
exact_urls = {}
for item in raw_vehicles:
    exact_urls[f"{item[2]} {item[3]}"] = item[4]

def process_and_blur_image(url, save_path):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        response = requests.get(url, headers=headers, stream=True, timeout=10)
        if response.status_code != 200:
            return False
            
        img_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if img is None:
            return False

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        plates = plate_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 10))
        
        for (x, y, w, h) in plates:
            plate_region = img[y:y+h, x:x+w]
            blurred_plate = cv2.GaussianBlur(plate_region, (75, 75), 30)
            img[y:y+h, x:x+w] = blurred_plate
            
        cv2.imwrite(save_path, img)
        return True
    except Exception as e:
        logger.error(f"Failed to process image {url}: {e}")
        return False

def main():
    conn = sqlite3.connect('flexiride.db')
    c = conn.cursor()
    c.execute('SELECT id, brand, model FROM vehicles')
    vehicles = c.fetchall()

    for vehicle in vehicles:
        v_id, brand, model = vehicle
        key = f"{brand} {model}"
        img_url = exact_urls.get(key)
        
        if not img_url:
            logger.warning(f"No exact URL found for {key}")
            continue

        logger.info(f"Processing ID: {v_id} | {key}")
        save_path = os.path.join(SAVE_DIR, f"{v_id}.jpg")
        
        success = process_and_blur_image(img_url, save_path)
        
        if success:
            local_url = f"/vehicles/{v_id}.jpg"
            c.execute('UPDATE vehicles SET images = ? WHERE id = ?', (local_url, v_id))
            conn.commit()
            logger.info(f"Successfully saved and updated {key}")
        else:
            logger.warning(f"Failed to process image for {key}")

    conn.close()
    logger.info("Database exact image update complete!")

if __name__ == "__main__":
    main()

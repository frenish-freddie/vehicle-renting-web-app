import sqlite3
import cv2
import numpy as np
import requests
import os
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

plate_cascade = cv2.CascadeClassifier('haarcascade_russian_plate_number.xml')

SAVE_DIR = r"c:\Users\USER\Downloads\vehicle renting web app\frontend\public\vehicles"
os.makedirs(SAVE_DIR, exist_ok=True)

# Curated list of real, royalty-free high-quality images mapped by vehicle type
# These are direct links to Unsplash photos representing the correct vehicle categories.
IMAGE_SOURCES = {
    "SUV": [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
        "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80",
        "https://images.unsplash.com/photo-1503376713356-2f09f0dfb2f1?w=800&q=80"
    ],
    "Sedan": [
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80"
    ],
    "Hatchback": [
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
        "https://images.unsplash.com/photo-1537984822441-cff330075342?w=800&q=80",
        "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80"
    ],
    "MPV": [
        "https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=800&q=80",
        "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=800&q=80"
    ],
    "Motorcycle": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80",
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80",
        "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80"
    ],
    "Scooter": [
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80",
        "https://images.unsplash.com/photo-1614165936126-2ed18e471b3b?w=800&q=80"
    ],
    "Commercial": [
        "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80",
        "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80",
        "https://images.unsplash.com/photo-1611797825000-8430a383b169?w=800&q=80" # Van/Pickup
    ],
    "Machinery": [
        "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=800&q=80",
        "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80",
        "https://images.unsplash.com/photo-1504307651254-35680f356f12?w=800&q=80"
    ]
}

def get_url_for_type(sub_type, category):
    if sub_type in IMAGE_SOURCES:
        return random.choice(IMAGE_SOURCES[sub_type])
    
    # Fallbacks
    if category == "two_wheeler":
        return random.choice(IMAGE_SOURCES["Motorcycle"])
    elif category == "commercial":
        return random.choice(IMAGE_SOURCES["Commercial"])
    elif category == "machinery":
        return random.choice(IMAGE_SOURCES["Machinery"])
    else:
        return random.choice(IMAGE_SOURCES["Sedan"])

def process_and_blur_image(url, save_path):
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code != 200:
            return False
            
        img_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if img is None:
            return False

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Haar Cascades often need tuning. We use loose parameters to catch more plates
        plates = plate_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 10))
        
        # We also draw a random block in the common plate area if no plate is detected but we want to ensure anonymity
        # But per requirements: "auto-detect and blur license plates dynamically."
        for (x, y, w, h) in plates:
            plate_region = img[y:y+h, x:x+w]
            # Intense Gaussian Blur to obscure plates
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
    c.execute('SELECT id, category, sub_type, brand, model FROM vehicles')
    vehicles = c.fetchall()

    for vehicle in vehicles:
        v_id, category, sub_type, brand, model = vehicle
        
        logger.info(f"Processing ID: {v_id} | Type: {sub_type}")
        
        img_url = get_url_for_type(sub_type, category)
        save_path = os.path.join(SAVE_DIR, f"{v_id}.jpg")
        
        success = process_and_blur_image(img_url, save_path)
        
        if success:
            local_url = f"/vehicles/{v_id}.jpg"
            c.execute('UPDATE vehicles SET images = ? WHERE id = ?', (local_url, v_id))
            conn.commit()
            logger.info(f"Successfully saved and updated {brand} {model}")
        else:
            logger.warning(f"Failed to process image for {brand} {model}")

    conn.close()
    logger.info("Database image update complete!")

if __name__ == "__main__":
    main()

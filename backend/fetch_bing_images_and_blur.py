import sqlite3
import cv2
import numpy as np
import os
import shutil
import logging
from bing_image_downloader import downloader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

plate_cascade = cv2.CascadeClassifier('haarcascade_russian_plate_number.xml')

SAVE_DIR = r"c:\Users\USER\Downloads\vehicle renting web app\frontend\public\vehicles"
TEMP_DIR = "temp_images"
os.makedirs(SAVE_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

def process_and_blur_image(input_path, output_path):
    try:
        img = cv2.imread(input_path)
        if img is None:
            return False

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        plates = plate_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 10))
        
        for (x, y, w, h) in plates:
            plate_region = img[y:y+h, x:x+w]
            blurred_plate = cv2.GaussianBlur(plate_region, (75, 75), 30)
            img[y:y+h, x:x+w] = blurred_plate
            
        cv2.imwrite(output_path, img)
        return True
    except Exception as e:
        logger.error(f"Failed to process image {input_path}: {e}")
        return False

def main():
    conn = sqlite3.connect('flexiride.db')
    c = conn.cursor()
    c.execute('SELECT id, category, brand, model FROM vehicles')
    vehicles = c.fetchall()

    for vehicle in vehicles:
        v_id, category, brand, model = vehicle
        query = f"{brand} {model} {category}"
        
        logger.info(f"Processing ID: {v_id} | Query: {query}")
        
        try:
            # Download 1 image using Bing
            downloader.download(query, limit=1, output_dir=TEMP_DIR, adult_filter_off=True, force_replace=True, timeout=10, verbose=False)
            
            # Find the downloaded file
            query_dir = os.path.join(TEMP_DIR, query)
            if os.path.exists(query_dir):
                files = os.listdir(query_dir)
                if files:
                    downloaded_file = os.path.join(query_dir, files[0])
                    save_path = os.path.join(SAVE_DIR, f"{v_id}.jpg")
                    
                    success = process_and_blur_image(downloaded_file, save_path)
                    
                    if success:
                        local_url = f"/vehicles/{v_id}.jpg"
                        c.execute('UPDATE vehicles SET images = ? WHERE id = ?', (local_url, v_id))
                        conn.commit()
                        logger.info(f"Successfully saved and updated {brand} {model}")
                    else:
                        logger.warning(f"Failed to process image for {brand} {model}")
                else:
                    logger.warning(f"No files downloaded for {query}")
            else:
                logger.warning(f"Directory not created for {query}")
                
        except Exception as e:
            logger.error(f"Error downloading for {query}: {e}")

    conn.close()
    logger.info("Database bing image update complete!")

if __name__ == "__main__":
    main()

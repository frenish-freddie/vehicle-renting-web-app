import sqlite3
import time
from duckduckgo_search import DDGS
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_vehicle_images():
    conn = sqlite3.connect('flexiride.db')
    c = conn.cursor()
    c.execute('SELECT id, brand, model FROM vehicles')
    vehicles = c.fetchall()

    with DDGS() as ddgs:
        for vehicle in vehicles:
            v_id, brand, model = vehicle
            query = f"{brand} {model} car high quality front view"
            if brand in ["JCB", "Tata Hitachi", "ACE", "BharatBenz", "Force", "Ashok Leyland"]:
                query = f"{brand} {model} vehicle high quality"
            elif brand in ["Honda", "TVS", "Suzuki", "Ather", "Ola", "Royal Enfield", "KTM", "Bajaj", "Yamaha"]:
                query = f"{brand} {model} motorcycle scooter high quality"

            logger.info(f"Searching for: {query}")
            try:
                # Get first image result
                results = list(ddgs.images(query, max_results=3))
                if results:
                    # Filter for jpeg/png if possible, or just take first
                    img_url = results[0]['image']
                    logger.info(f"Found image: {img_url}")
                    c.execute('UPDATE vehicles SET images = ? WHERE id = ?', (img_url, v_id))
                    conn.commit()
                else:
                    logger.warning(f"No image found for {brand} {model}")
            except Exception as e:
                logger.error(f"Error fetching image for {brand} {model}: {e}")
            
            time.sleep(1) # Rate limit

    conn.close()
    logger.info("Done updating images!")

if __name__ == "__main__":
    update_vehicle_images()

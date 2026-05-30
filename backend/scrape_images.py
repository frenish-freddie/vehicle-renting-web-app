import sqlite3
import requests
import re
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def slugify(text):
    return text.lower().replace(" ", "-").replace("(", "").replace(")", "")

def update_vehicle_images():
    conn = sqlite3.connect('flexiride.db')
    c = conn.cursor()
    c.execute('SELECT id, category, brand, model FROM vehicles')
    vehicles = c.fetchall()

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

    for vehicle in vehicles:
        v_id, category, brand, model = vehicle
        b_slug = slugify(brand)
        m_slug = slugify(model)
        
        url = None
        if category == 'car':
            url = f"https://www.carwale.com/{b_slug}-cars/{m_slug}/"
        elif category == 'two_wheeler':
            # Bikewale uses brand-bikes/model usually
            url = f"https://www.bikewale.com/{b_slug}-bikes/{m_slug}/"
        elif category == 'commercial':
            # Try carwale for commercial vans/pickups
            url = f"https://www.carwale.com/{b_slug}-cars/{m_slug}/"
        else:
            # Skip machinery for now or try general search
            continue

        try:
            r = requests.get(url, headers=headers)
            if r.status_code == 200:
                match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', r.text, re.IGNORECASE)
                if match:
                    img_url = match.group(1)
                    logger.info(f"[{brand} {model}] -> {img_url}")
                    c.execute('UPDATE vehicles SET images = ? WHERE id = ?', (img_url, v_id))
                    conn.commit()
                else:
                    logger.warning(f"[{brand} {model}] -> No og:image found on {url}")
            else:
                logger.warning(f"[{brand} {model}] -> HTTP {r.status_code} on {url}")
        except Exception as e:
            logger.error(f"[{brand} {model}] -> Error: {e}")
        
        time.sleep(0.5)

    conn.close()
    logger.info("Done updating images!")

if __name__ == "__main__":
    update_vehicle_images()

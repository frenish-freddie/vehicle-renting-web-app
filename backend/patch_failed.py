"""Patch the 6 vehicles that failed in final_images.py"""
import sqlite3, cv2, numpy as np, requests, os, logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

plate_cascade = cv2.CascadeClassifier('haarcascade_russian_plate_number.xml')
SAVE_DIR = r"c:\Users\USER\Downloads\vehicle renting web app\frontend\public\vehicles"
HEADERS = {'User-Agent': 'Mozilla/5.0', 'Referer': 'https://unsplash.com/'}

PATCHES = {
    # sport bikes
    "KTM Duke 390":   "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80",
    "KTM RC 200":     "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80",
    "Yamaha R15 V4":  "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80",
    # auto rickshaw  (use a scooter shot as fallback – best royalty-free available)
    "Bajaj RE":       "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80",
    # machinery
    "JCB 3DX":        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "ACE 15XWE":      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
}

def download_blur_save(url, save_path):
    r = requests.get(url, headers=HEADERS, timeout=15, stream=True)
    if r.status_code != 200:
        return False
    arr = np.asarray(bytearray(r.content), dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return False
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    plates = plate_cascade.detectMultiScale(gray, 1.05, 3, minSize=(20, 10))
    for (x, y, w, h) in plates:
        roi = img[y:y+h, x:x+w]
        img[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (75, 75), 30)
    cv2.imwrite(save_path, img)
    return True

def main():
    conn = sqlite3.connect('flexiride.db')
    c = conn.cursor()
    for key, url in PATCHES.items():
        brand, model = key.split(' ', 1)
        c.execute("SELECT id FROM vehicles WHERE brand=? AND model=?", (brand, model))
        row = c.fetchone()
        if not row:
            logger.warning(f"Not found in DB: {key}")
            continue
        v_id = row[0]
        save_path = os.path.join(SAVE_DIR, f"{v_id}.jpg")
        logger.info(f"Patching {key} (id={v_id})")
        ok = download_blur_save(url, save_path)
        if ok:
            c.execute("UPDATE vehicles SET images=? WHERE id=?", (f"/vehicles/{v_id}.jpg", v_id))
            conn.commit()
            logger.info(f"  ✓ {key}")
        else:
            logger.warning(f"  ✗ {key}")
    conn.close()
    logger.info("Patch complete!")

if __name__ == "__main__":
    main()

import sqlite3
import shutil
import os

source_dir = r"c:\Users\USER\Downloads\vehicle renting web app\frontend\vehicle images"
dest_dir = r"c:\Users\USER\Downloads\vehicle renting web app\frontend\public\vehicles"

# Ensure destination exists
os.makedirs(dest_dir, exist_ok=True)

# Connect to DB
conn = sqlite3.connect("flexiride.db")
cursor = conn.cursor()

# Get all vehicles
cursor.execute("SELECT id, brand, model, category FROM vehicles")
vehicles = cursor.fetchall()

for vehicle in vehicles:
    v_id, brand, model, category = vehicle
    
    # Identify the image file in the source directory
    file_name_jpg = f"{brand} {model}.jpg"
    file_name_JPG = f"{brand} {model}.JPG"
    
    src_file = None
    if os.path.exists(os.path.join(source_dir, file_name_jpg)):
        src_file = file_name_jpg
    elif os.path.exists(os.path.join(source_dir, file_name_JPG)):
        src_file = file_name_JPG
        
    if src_file:
        # Copy to destination
        shutil.copy2(os.path.join(source_dir, src_file), os.path.join(dest_dir, src_file))
        image_path = f"/vehicles/{src_file}"
        
        # Determine real-time honest rates (in INR)
        # We will use some heuristics based on brand/model/category
        
        price_per_day = 2000 # default fallback
        
        full_name = f"{brand} {model}".lower()
        
        if category == 'two_wheeler':
            if 'activa' in full_name or 'jupiter' in full_name or 'access' in full_name:
                price_per_day = 400
            elif 'ather' in full_name or 'ola' in full_name:
                price_per_day = 600
            elif 'classic' in full_name or 'meteor' in full_name or 'himalayan' in full_name:
                price_per_day = 1200
            elif 'duke' in full_name or 'rc' in full_name or 'rr 310' in full_name:
                price_per_day = 1500
            else:
                price_per_day = 800
        elif category == 'commercial':
            if 'traveller' in full_name:
                price_per_day = 4500
            elif 'bolero' in full_name or 'ace' in full_name or 'dost' in full_name:
                price_per_day = 2500
            elif 'bajaj re' in full_name:
                price_per_day = 600
            elif 'eeco' in full_name:
                price_per_day = 1200
            else:
                price_per_day = 3000
        elif category == 'machinery':
            if 'jcb' in full_name:
                price_per_day = 6000
            elif 'ex 200' in full_name:
                price_per_day = 10000
            elif 'crane' in full_name or 'ace 15' in full_name:
                price_per_day = 8000
            else:
                price_per_day = 7000
        elif category == 'car':
            if 'bmw' in full_name or 'mercedes' in full_name:
                price_per_day = 10000
            elif 'fortuner' in full_name:
                price_per_day = 6500
            elif 'innova' in full_name or 'xuv700' in full_name or 'safari' in full_name or 'hector' in full_name or 'harrier' in full_name or 'scorpio' in full_name:
                price_per_day = 4000
            elif 'creta' in full_name or 'seltos' in full_name or 'thar' in full_name or 'taigun' in full_name:
                price_per_day = 3000
            elif 'city' in full_name or 'verna' in full_name or 'slavia' in full_name or 'virtus' in full_name:
                price_per_day = 2500
            elif 'swift' in full_name or 'tiago' in full_name or 'kwid' in full_name or 'altroz' in full_name or 'baleno' in full_name or 'i20' in full_name:
                price_per_day = 1500
            elif 'ertiga' in full_name or 'carens' in full_name:
                price_per_day = 2500
            else:
                price_per_day = 2000
                
        price_per_hour = price_per_day // 10
        
        # Update database
        cursor.execute("""
            UPDATE vehicles 
            SET images = ?, price_daily = ?, price_hourly = ?
            WHERE id = ?
        """, (image_path, price_per_day, price_per_hour, v_id))
        
        print(f"Updated {brand} {model}: {image_path}, INR {price_per_day}/day")
    else:
        print(f"Image not found for {brand} {model}")

conn.commit()
conn.close()
print("All done.")

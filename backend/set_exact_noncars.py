import sqlite3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Exact safe URLs from our initial verified data list
non_car_urls = {
    # Two-Wheelers (Scooters)
    "Honda Activa 6G": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Gold_Metallic_Honda_Activa.jpg",
    "TVS Jupiter": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/TVS_Jupiter.jpg/640px-TVS_Jupiter.jpg",
    "Suzuki Access 125": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Suzuki_Access_125.jpg/640px-Suzuki_Access_125.jpg",
    "Ather 450X": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ather_450.jpg/640px-Ather_450.jpg",
    "Ola S1 Pro": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Ola_S1_Pro.jpg/640px-Ola_S1_Pro.jpg",
    
    # Two-Wheelers (Bikes)
    "Royal Enfield Classic 350": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Royal_Enfield_Classic_350_Signals_Edition.jpg",
    "Royal Enfield Meteor 350": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Royal_Enfield_Meteor_350.jpg/640px-Royal_Enfield_Meteor_350.jpg",
    "Royal Enfield Himalayan": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Royal_Enfield_Himalayan.jpg/640px-Royal_Enfield_Himalayan.jpg",
    "KTM Duke 390": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/KTM_390_Duke_%282017%29_1.jpg/640px-KTM_390_Duke_%282017%29_1.jpg",
    "KTM RC 200": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/KTM_RC_200.jpg/640px-KTM_RC_200.jpg",
    "Bajaj Pulsar NS200": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Bajaj_Pulsar_NS200.jpg/640px-Bajaj_Pulsar_NS200.jpg",
    "Yamaha R15 V4": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Yamaha_YZF-R15.jpg/640px-Yamaha_YZF-R15.jpg",
    "TVS Apache RR 310": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/TVS_Apache_RR_310.jpg/640px-TVS_Apache_RR_310.jpg",
    
    # Commercial / Vans / Machinery
    "Force Traveller 14-Seater": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Force_Traveller_3350_14%2B1_Seater.jpg/640px-Force_Traveller_3350_14%2B1_Seater.jpg",
    "Mahindra Bolero Camper": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mahindra_Bolero_Camper.jpg/640px-Mahindra_Bolero_Camper.jpg",
    "Tata Ace Gold": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Tata_Ace.jpg/640px-Tata_Ace.jpg",
    "Ashok Leyland Dost": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Ashok_Leyland_DOST.jpg/640px-Ashok_Leyland_DOST.jpg",
    "Bajaj RE": "https://upload.wikimedia.org/wikipedia/commons/4/49/Bajaj_auto-rickshaw_in_Sri_Lanka.jpg",
    "Maruti Suzuki Eeco": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Maruti_Eeco.jpg/640px-Maruti_Eeco.jpg",
    
    # Machinery (using safe unsplash ones directly from generate_50)
    "JCB 3DX": "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
    "Tata Hitachi EX 200": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Tata_Hitachi_Excavator.jpg/640px-Tata_Hitachi_Excavator.jpg",
    "BharatBenz 3123R": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/BharatBenz.jpg/640px-BharatBenz.jpg",
    "ACE 15XWE": "https://images.unsplash.com/photo-1504307651254-35680f356f12?w=600&q=80",
}

def main():
    conn = sqlite3.connect('flexiride.db')
    c = conn.cursor()
    c.execute('SELECT id, category, brand, model FROM vehicles WHERE category != "car"')
    vehicles = c.fetchall()

    for vehicle in vehicles:
        v_id, category, brand, model = vehicle
        key = f"{brand} {model}"
        
        if key in non_car_urls:
            url = non_car_urls[key]
            c.execute('UPDATE vehicles SET images = ? WHERE id = ?', (url, v_id))
            logger.info(f"Updated {key} with exact URL")
        else:
            logger.warning(f"Could not find exact URL for {key}")

    conn.commit()
    conn.close()
    logger.info("Exact non-car images restored safely.")

if __name__ == "__main__":
    main()

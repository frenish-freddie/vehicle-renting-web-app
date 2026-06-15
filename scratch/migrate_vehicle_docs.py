import sqlite3

def migrate():
    conn = sqlite3.connect("flexiride.db")
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE vehicles ADD COLUMN rc_url VARCHAR;")
        print("Added rc_url column")
    except sqlite3.OperationalError as e:
        print(f"Skipping rc_url: {e}")
        
    try:
        cursor.execute("ALTER TABLE vehicles ADD COLUMN insurance_url VARCHAR;")
        print("Added insurance_url column")
    except sqlite3.OperationalError as e:
        print(f"Skipping insurance_url: {e}")
        
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()

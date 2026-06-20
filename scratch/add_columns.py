import sqlite3

conn = sqlite3.connect('backend/flexiride.db')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE users ADD COLUMN aadhaar_name VARCHAR")
    cursor.execute("ALTER TABLE users ADD COLUMN aadhaar_dob VARCHAR")
    cursor.execute("ALTER TABLE users ADD COLUMN aadhaar_gender VARCHAR")
    cursor.execute("ALTER TABLE users ADD COLUMN aadhaar_number VARCHAR")
    cursor.execute("ALTER TABLE users ADD COLUMN aadhaar_address VARCHAR")
    print("Columns added successfully.")
except Exception as e:
    print(f"Error: {e}")

conn.commit()
conn.close()

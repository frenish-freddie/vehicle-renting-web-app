"""
migrate_ongoing_trips.py — One-shot SQLite migration for Phase 5: Ongoing Trip Status.

Run from the backend/ directory:
    python migrate_ongoing_trips.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "flexiride.db")

MIGRATIONS = [
    # ---- bookings table new columns ----
    "ALTER TABLE bookings ADD COLUMN current_status TEXT DEFAULT 'confirmed'",
    "ALTER TABLE bookings ADD COLUMN expected_return_at DATETIME DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN actual_return_at DATETIME DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN is_delayed BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN delay_minutes INTEGER DEFAULT 0",
    
    # ---- trip_status_logs table ----
    """
    CREATE TABLE IF NOT EXISTS trip_status_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        updated_by_role TEXT NOT NULL,
        updated_by_id INTEGER NOT NULL,
        note TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(booking_id) REFERENCES bookings(id)
    )
    """
]

def run():
    if not os.path.exists(DB_PATH):
        print(f"[ERROR] Database not found at: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    applied = 0
    for sql in MIGRATIONS:
        try:
            cursor.execute(sql)
            conn.commit()
            if sql.startswith("ALTER"):
                col_name = sql.split("ADD COLUMN")[1].strip().split()[0]
                print(f"[OK] Added column: {col_name}")
            else:
                print(f"[OK] Created table trip_status_logs")
            applied += 1
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                col_name = sql.split("ADD COLUMN")[1].strip().split()[0]
                print(f"[SKIP] Column already exists: {col_name}")
            elif "table trip_status_logs already exists" in str(e):
                print(f"[SKIP] Table already exists: trip_status_logs")
            else:
                print(f"[ERROR] {e}")
                conn.rollback()

    conn.close()
    print(f"\nMigration complete. {applied} operation(s) succeeded.")

if __name__ == "__main__":
    run()

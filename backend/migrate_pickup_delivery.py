"""
migrate_pickup_delivery.py — One-shot SQLite migration for Phase 3: Pickup & Delivery Options.

Run from the backend/ directory:
    python migrate_pickup_delivery.py

Safe to re-run: already-existing columns are silently skipped.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "flexiride.db")

MIGRATIONS = [
    # ---- bookings table ----
    # pickup_type: 'self_pickup' | 'host_delivery' | 'driver_pickup' (for with_driver)
    "ALTER TABLE bookings ADD COLUMN pickup_type TEXT DEFAULT 'self_pickup'",
    # delivery_lat/lng for geo-distance calculation
    "ALTER TABLE bookings ADD COLUMN delivery_lat FLOAT DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN delivery_lng FLOAT DEFAULT NULL",

    # ---- vehicles table ----
    # host_delivery_available mirrors the existing delivery_available — added for clarity
    "ALTER TABLE vehicles ADD COLUMN host_delivery_available BOOLEAN DEFAULT 0",
    # per-km delivery fee (extends existing delivery_charge which is a flat fee)
    "ALTER TABLE vehicles ADD COLUMN delivery_fee_per_km FLOAT DEFAULT 0.0",
    # maximum radius host is willing to deliver
    "ALTER TABLE vehicles ADD COLUMN max_delivery_radius_km FLOAT DEFAULT 0.0",
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
            col_name = sql.split("ADD COLUMN")[1].strip().split()[0]
            print(f"[OK] Added column: {col_name}")
            applied += 1
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                col_name = sql.split("ADD COLUMN")[1].strip().split()[0]
                print(f"[SKIP] Column already exists: {col_name}")
            else:
                print(f"[ERROR] {e}")
                conn.rollback()

    conn.close()
    print(f"\nMigration complete. {applied} column(s) added.")


if __name__ == "__main__":
    run()

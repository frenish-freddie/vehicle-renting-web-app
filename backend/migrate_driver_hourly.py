"""
migrate_driver_hourly.py — One-shot SQLite migration for Phase 2: Driver Hourly Rate.

Run from the backend/ directory:
    python migrate_driver_hourly.py

Safe to re-run: each ALTER TABLE is wrapped in a try/except so already-existing
columns are silently skipped.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "flexiride.db")

MIGRATIONS = [
    # drivers table — ensure hourly_rate column exists (ORM has it; old DB rows may not)
    "ALTER TABLE drivers ADD COLUMN hourly_rate FLOAT DEFAULT 0.0",

    # bookings table — snapshot of driver's hourly rate at booking time
    "ALTER TABLE bookings ADD COLUMN driver_hourly_rate FLOAT DEFAULT 0.0",

    # bookings table — total driver cost = hourly_rate × trip_hours
    "ALTER TABLE bookings ADD COLUMN driver_total_cost FLOAT DEFAULT 0.0",
]


def run():
    if not os.path.exists(DB_PATH):
        print(f"[ERROR] Database not found at: {DB_PATH}")
        print("Make sure you are running this script from the backend/ directory.")
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

"""
migrate_admin.py — One-shot SQLite migration for Admin Dashboard columns.

Run from the backend/ directory:
    python migrate_admin.py

Safe to re-run: each ALTER TABLE is wrapped in a try/except so already-existing
columns are silently skipped.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "flexiride.db")

MIGRATIONS = [
    # User: flag to allow admin to approve/suspend host accounts
    "ALTER TABLE users ADD COLUMN is_host_approved BOOLEAN DEFAULT 1",

    # Booking: 10% platform commission calculated from base_amount at creation
    "ALTER TABLE bookings ADD COLUMN commission_amount FLOAT DEFAULT 0.0",

    # Payment: mirrors booking.commission_amount for payment-level revenue tracking
    "ALTER TABLE payments ADD COLUMN platform_commission FLOAT DEFAULT 0.0",

    # Driver verification workflow (added in v2)
    "ALTER TABLE drivers ADD COLUMN license_url TEXT",
    "ALTER TABLE drivers ADD COLUMN verification_status TEXT DEFAULT 'unsubmitted'",
    "ALTER TABLE drivers ADD COLUMN is_active BOOLEAN DEFAULT 0",
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

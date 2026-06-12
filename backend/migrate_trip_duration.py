"""
migrate_trip_duration.py — One-shot SQLite migration for Phase 4: Trip Duration.

Run from the backend/ directory:
    python migrate_trip_duration.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "flexiride.db")

MIGRATIONS = [
    "ALTER TABLE bookings ADD COLUMN trip_duration_hours FLOAT DEFAULT 0.0"
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

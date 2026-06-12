"""
migrate_partial_payment.py — One-shot SQLite migration for Phase 1: 30% Partial Payment.

Run from the backend/ directory:
    python migrate_partial_payment.py

Safe to re-run: each ALTER TABLE is wrapped in a try/except so already-existing
columns are silently skipped.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "flexiride.db")

MIGRATIONS = [
    # 30% of total_amount paid at booking time
    "ALTER TABLE bookings ADD COLUMN partial_amount FLOAT DEFAULT 0.0",

    # 70% of total_amount due after trip completion
    "ALTER TABLE bookings ADD COLUMN remaining_amount FLOAT DEFAULT 0.0",

    # Payment mode — always 'partial' for now
    "ALTER TABLE bookings ADD COLUMN payment_mode TEXT DEFAULT 'partial'",

    # Balance payment status: 'pending' | 'paid'
    "ALTER TABLE bookings ADD COLUMN balance_payment_status TEXT DEFAULT 'pending'",

    # Timestamp when the balance was paid
    "ALTER TABLE bookings ADD COLUMN balance_paid_at DATETIME",
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

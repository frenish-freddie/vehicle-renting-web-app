import os
import glob
from app.database.connection import SessionLocal
from app.models.models import User, Driver

print("Clearing KYC files...")

# 1. Clear files
static_dir = os.path.join("static")
dirs_to_clean = ["user_kyc", "host_kyc", "drivers"]

count = 0
for d in dirs_to_clean:
    path = os.path.join(static_dir, d)
    if os.path.exists(path):
        for file in glob.glob(os.path.join(path, "*")):
            if file.endswith((".png", ".jpg", ".jpeg", ".webp", ".pdf")):
                print(f"Deleting {file}")
                os.remove(file)
                count += 1

print(f"Deleted {count} files.")

# 2. Clear Database
db = SessionLocal()
print("Updating DB...")

users = db.query(User).all()
for u in users:
    u.user_dl_url = None
    u.user_aadhaar_url = None
    u.user_kyc_status = "unsubmitted"
    u.host_aadhaar_url = None
    u.host_pan_url = None
    u.host_kyc_status = "unsubmitted"
    u.aadhaar_verified = False
    u.dl_verified = False

drivers = db.query(Driver).all()
for d in drivers:
    d.license_url = None
    d.verification_status = "unsubmitted"

db.commit()
db.close()
print("Done.")

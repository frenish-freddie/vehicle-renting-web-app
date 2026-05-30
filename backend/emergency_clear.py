import sqlite3
import os
import shutil

SAVE_DIR = r"c:\Users\USER\Downloads\vehicle renting web app\frontend\public\vehicles"
if os.path.exists(SAVE_DIR):
    shutil.rmtree(SAVE_DIR)
os.makedirs(SAVE_DIR)

conn = sqlite3.connect('flexiride.db')
c = conn.cursor()
c.execute("UPDATE vehicles SET images = '/placeholder.png'")
conn.commit()
conn.close()
print("Images cleared.")

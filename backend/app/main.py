from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.connection import engine, Base
from app.routers import auth, vehicles, bookings, payments, reviews, chatbot, dashboards, admin, drivers, trips, host_kyc, user_kyc
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

# Compile SQLite or PostgreSQL database tables dynamically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MCA Final Year Project - FlexiRide Full-Stack Vehicle Renting Platform backend API",
    version="1.0.0"
)

# Mount static files directory for serving uploads (like driver licenses)
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
# Ensure required subdirectories exist
(static_dir / "host_kyc").mkdir(parents=True, exist_ok=True)
(static_dir / "user_kyc").mkdir(parents=True, exist_ok=True)
(static_dir / "vehicle_docs").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3002", "http://127.0.0.1:3002"],  # Permits Next.js dev server connections
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API endpoints sub-routers
app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(reviews.router)
app.include_router(chatbot.router)
app.include_router(dashboards.router)
app.include_router(admin.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(host_kyc.router)
app.include_router(user_kyc.router)

@app.get("/")
def read_root():
    return {
        "status": "FlexiRide API Online",
        "version": "1.0.0",
        "documentation": "/docs"
    }

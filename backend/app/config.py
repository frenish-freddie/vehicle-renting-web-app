import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FlexiRide API"
    SECRET_KEY: str = "supersecretkeythatnobodycaneverguesstwiceinflexirideapplication"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database URLs
    # Will use SQLite flexiride.db in workspace if PostgreSQL URL not provided
    DATABASE_URL: str = "sqlite:///./flexiride.db"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

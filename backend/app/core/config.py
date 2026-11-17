import os
from pydantic_settings import BaseSettings
from typing import List

def _get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql://", 1)
        return url
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "sqlite:////tmp/timetable.db"
    return "sqlite:///./timetable.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Exam Timetable Scheduling System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database: Default to sqlite file in backend/timetable.db, or PostgreSQL when DATABASE_URL is set
    DATABASE_URL: str = _get_database_url()
    
    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-scheduling-jwt-key-2026-exam-system-change-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Institution Defaults
    COLLEGE_NAME: str = "JIS College of Engineering"
    COLLEGE_CODE: str = "JISCE"
    
    # Email / SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "exams@jisce.ac.in")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

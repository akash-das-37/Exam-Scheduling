import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

# If using /tmp/timetable.db and it doesn't exist yet, copy bundled pre-seeded database
if settings.DATABASE_URL == "sqlite:////tmp/timetable.db" and not os.path.exists("/tmp/timetable.db"):
    base_dirs = [
        os.getcwd(),
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "/var/task"
    ]
    for b_dir in base_dirs:
        candidate = os.path.join(b_dir, "timetable.db")
        if os.path.exists(candidate) and os.path.getsize(candidate) > 0:
            try:
                shutil.copyfile(candidate, "/tmp/timetable.db")
                break
            except Exception:
                pass

# Engine setup supporting PostgreSQL and SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

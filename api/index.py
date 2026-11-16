import sys
import os
import shutil

# Add project root and backend to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# For Vercel Serverless environment: handle SQLite database in /tmp
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    tmp_db = "/tmp/timetable.db"
    if not os.path.exists(tmp_db):
        for candidate_dir in [root_dir, "/var/task", backend_dir]:
            candidate = os.path.join(candidate_dir, "timetable.db")
            if os.path.exists(candidate) and os.path.getsize(candidate) > 0:
                try:
                    shutil.copyfile(candidate, tmp_db)
                    break
                except Exception as e:
                    print(f"Error copying seed database to /tmp: {e}")
    if not os.environ.get("DATABASE_URL"):
        os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db}"

from backend.app.main import app

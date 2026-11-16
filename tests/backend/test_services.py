from backend.app.core.database import SessionLocal
from backend.app.schemas.auth import LoginRequest
from backend.app.api.auth import login
from backend.app.api.analytics import get_dashboard_summary
from backend.app.api.academic import list_departments
from backend.app.api.people import list_students, list_faculty
from backend.app.api.exams import list_exams
from backend.app.scheduler.validator import validate_timetable
from backend.app.scheduler.recommendations import recommend_alternative_slots
from backend.app.reports.pdf_generator import generate_master_timetable_pdf, generate_student_schedule_pdf, generate_faculty_duties_pdf
from backend.app.reports.excel_handler import export_timetable_excel, export_students_excel

def test_all():
    db = SessionLocal()
    try:
        # 1. Test Auth login
        res = login(LoginRequest(email="admin@apex.edu", password="admin123"), db=db)
        assert res.access_token is not None
        assert res.user.role == "admin"
        print("OK: Auth Login & JWT Token Generation")

        # 2. Test Dashboard stats
        dash = get_dashboard_summary(db=db)
        assert dash.total_students >= 40
        assert dash.total_faculty >= 10
        assert dash.total_exams >= 10
        print(f"OK: Dashboard Metrics -> {dash.total_students} Students, {dash.total_faculty} Faculty, {dash.total_exams} Exams")

        # 3. Test Academic modules
        depts = list_departments(db=db)
        assert len(depts) >= 4
        print(f"OK: Departments -> {len(depts)} departments loaded")

        # 4. Test Students
        students = list_students(db=db)
        assert len(students) >= 40
        print(f"OK: Students -> {len(students)} students loaded")

        # 5. Test Faculty
        faculty = list_faculty(db=db)
        assert len(faculty) >= 10
        print(f"OK: Faculty -> {len(faculty)} faculty loaded")

        # 6. Test Exams
        exams = list_exams(db=db)
        assert len(exams) >= 10
        print(f"OK: Exams -> {len(exams)} exam events loaded")

        # 7. Test Independent Validator
        val = validate_timetable(db=db, timetable_version_id=1)
        assert val.is_valid == True
        assert val.student_conflicts_count == 0
        assert val.room_conflicts_count == 0
        print(f"OK: Independent Validator -> Valid={val.is_valid}, Zero Clashes")

        # 8. Test Recommendation Engine
        recs = recommend_alternative_slots(db=db, timetable_version_id=1, exam_id=exams[0].id)
        assert len(recs) > 0
        print(f"OK: Slot Recommendation Engine -> {len(recs)} slots analyzed, Best score: {recs[0].score}")

        # 9. Test PDF Reports
        master_pdf = generate_master_timetable_pdf(db=db, timetable_version_id=1)
        assert len(master_pdf) > 2000
        student_pdf = generate_student_schedule_pdf(db=db, timetable_version_id=1, student_id=students[0].id)
        assert len(student_pdf) > 2000
        fac_pdf = generate_faculty_duties_pdf(db=db, timetable_version_id=1, faculty_id=faculty[0].id)
        assert len(fac_pdf) > 2000
        print(f"OK: PDF Generation -> Master: {len(master_pdf)} bytes, Student: {len(student_pdf)} bytes, Faculty: {len(fac_pdf)} bytes")

        # 10. Test Excel Exports
        tt_xlsx = export_timetable_excel(db=db, timetable_version_id=1)
        assert len(tt_xlsx) > 1000
        st_xlsx = export_students_excel(db=db)
        assert len(st_xlsx) > 1000
        print(f"OK: Excel Generation -> Timetable: {len(tt_xlsx)} bytes, Students: {len(st_xlsx)} bytes")

        print("\n=== ALL DIRECT CORE ENGINE & API SERVICE TESTS PASSED 100%! ===")
    finally:
        db.close()

if __name__ == "__main__":
    test_all()

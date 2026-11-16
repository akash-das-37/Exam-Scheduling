import asyncio
import httpx
from backend.app.main import app

async def run_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        r = await client.get("/health")
        assert r.status_code == 200, r.text
        print("PASS: /health")

        # 2. Login as Admin
        r = await client.post("/api/auth/login", json={
            "email": "admin@apex.edu",
            "password": "admin123"
        })
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("PASS: /api/auth/login")

        # 3. Current User Profile
        r = await client.get("/api/auth/me", headers=headers)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"
        print("PASS: /api/auth/me (Admin verified)")

        # 4. Dashboard Stats
        r = await client.get("/api/analytics/dashboard", headers=headers)
        assert r.status_code == 200
        stats = r.json()
        assert stats["total_students"] > 0
        assert stats["total_faculty"] > 0
        assert stats["total_exams"] > 0
        print(f"PASS: /api/analytics/dashboard -> {stats['total_students']} Students, {stats['total_exams']} Exams, {stats['scheduled_exams']} Scheduled")

        # 5. List Departments
        r = await client.get("/api/departments", headers=headers)
        assert r.status_code == 200
        depts = r.json()
        assert len(depts) >= 4
        print(f"PASS: /api/departments -> {len(depts)} departments")

        # 6. List Students
        r = await client.get("/api/students", headers=headers)
        assert r.status_code == 200
        students = r.json()
        assert len(students) >= 40
        print(f"PASS: /api/students -> {len(students)} students loaded")

        # 7. List Exams
        r = await client.get("/api/exams", headers=headers)
        assert r.status_code == 200
        exams = r.json()
        assert len(exams) >= 10
        print(f"PASS: /api/exams -> {len(exams)} examination events")

        # 8. List Timetable Versions
        r = await client.get("/api/timetable/versions", headers=headers)
        assert r.status_code == 200
        versions = r.json()
        assert len(versions) >= 1
        v_id = versions[0]["id"]
        print(f"PASS: /api/timetable/versions -> {len(versions)} versions (Active: v{v_id})")

        # 9. Validate Timetable
        r = await client.post(f"/api/scheduler/validate/{v_id}", headers=headers)
        assert r.status_code == 200
        val = r.json()
        print(f"PASS: /api/scheduler/validate -> Status: {val['status']}, Valid: {val['is_valid']}, Conflicts: {len(val['conflicts'])}")

        # 10. Master Timetable PDF Generation
        r = await client.get(f"/api/reports/pdf/master/{v_id}", headers=headers)
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"
        assert len(r.content) > 1000
        print(f"PASS: /api/reports/pdf/master -> PDF generated ({len(r.content)} bytes)")

        # 11. Student Personal Schedule PDF
        r = await client.get(f"/api/reports/pdf/student/{v_id}/1", headers=headers)
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"
        print(f"PASS: /api/reports/pdf/student -> PDF generated ({len(r.content)} bytes)")

        # 12. Faculty Invigilation Roster PDF
        r = await client.get(f"/api/reports/pdf/faculty/{v_id}/1", headers=headers)
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"
        print(f"PASS: /api/reports/pdf/faculty -> PDF generated ({len(r.content)} bytes)")

        # 13. Timetable Excel Export
        r = await client.get(f"/api/reports/excel/timetable/{v_id}", headers=headers)
        assert r.status_code == 200
        assert len(r.content) > 1000
        print(f"PASS: /api/reports/excel/timetable -> Excel generated ({len(r.content)} bytes)")

        # 14. Alternative Slot Recommendations
        target_exam_id = exams[0]["id"]
        r = await client.post("/api/scheduler/recommend-slots", json={
            "timetable_version_id": v_id,
            "exam_id": target_exam_id
        }, headers=headers)
        assert r.status_code == 200
        recs = r.json()
        assert len(recs) > 0
        print(f"PASS: /api/scheduler/recommend-slots -> {len(recs)} candidate slots evaluated (Top score: {recs[0]['score']})")

        print("\nALL 14 BACKEND INTEGRATION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())

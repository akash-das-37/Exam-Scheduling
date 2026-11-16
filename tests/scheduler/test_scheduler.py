from backend.app.core.database import SessionLocal
from backend.app.scheduler.engine import generate_timetable, regenerate_selected_exams
from backend.app.scheduler.validator import validate_timetable
from backend.app.scheduler.recommendations import recommend_alternative_slots
from backend.app.models import ExamSchedule, ExamRegistration, Exam, TimetableVersion

def test_scheduling_engine():
    db = SessionLocal()
    try:
        # 1. Automatic generation with CP-SAT
        version, status, metrics = generate_timetable(
            db=db,
            academic_session_id=1,
            max_solve_time_seconds=20,
            name="Test Solver Timetable"
        )
        assert status in ["OPTIMAL", "FEASIBLE"], f"Expected feasible schedule, got {status}"
        assert metrics["total_exams"] == 11
        assert metrics["student_clash_edges"] > 0
        print(f"CP-SAT Solver Success: Status={status}, Objective={metrics['objective_value']}, Time={metrics['solve_time_seconds']}s")

        # 2. Independent validation of the generated timetable
        val = validate_timetable(db, version.id)
        assert val.is_valid, f"Generated timetable must be valid! Found: {val.conflicts}"
        assert val.student_conflicts_count == 0
        assert val.room_conflicts_count == 0
        assert val.faculty_conflicts_count == 0
        assert val.unscheduled_exams == 0
        print(f"Validator Confirms: 0 Student Clashes, 0 Room Clashes, 0 Faculty Clashes across {val.scheduled_exams} exams.")

        # 3. Test Selective Re-generation
        # Pick 2 exams to reschedule
        schedules = db.query(ExamSchedule).filter(ExamSchedule.timetable_version_id == version.id).all()
        target_exam_ids = [schedules[0].exam_id, schedules[1].exam_id]
        success, status_name, res = regenerate_selected_exams(
            db=db,
            timetable_version_id=version.id,
            exam_ids_to_reschedule=target_exam_ids,
            max_solve_time_seconds=15
        )
        assert success, f"Selective regeneration failed: {res}"
        val2 = validate_timetable(db, version.id)
        assert val2.is_valid, "Timetable after selective regeneration must remain valid!"
        print(f"Selective Re-generation: Rescheduled {len(target_exam_ids)} exams without conflict.")

        # 4. Test Intentional Hard Conflict Detection
        # Manually force two clashing exams into the exact same date and slot
        clash_pair_e1 = schedules[0]
        clash_pair_e2 = schedules[1]
        
        # Check if they share students
        r1 = {r.student_id for r in db.query(ExamRegistration).filter(ExamRegistration.exam_id == clash_pair_e1.exam_id).all()}
        r2 = {r.student_id for r in db.query(ExamRegistration).filter(ExamRegistration.exam_id == clash_pair_e2.exam_id).all()}
        
        # If they share students, force e2 to have same date and slot as e1
        if r1.intersection(r2):
            orig_date = clash_pair_e2.exam_date
            orig_slot = clash_pair_e2.time_slot_id
            
            clash_pair_e2.exam_date = clash_pair_e1.exam_date
            clash_pair_e2.time_slot_id = clash_pair_e1.time_slot_id
            db.commit()

            val_conflict = validate_timetable(db, version.id)
            assert not val_conflict.is_valid, "Validator must flag intentional student clash as invalid!"
            assert val_conflict.student_conflicts_count > 0
            print(f"Conflict Detection Engine: Successfully detected intentional student clash ({val_conflict.student_conflicts_count} clashing students caught).")

            # Restore original
            clash_pair_e2.exam_date = orig_date
            clash_pair_e2.time_slot_id = orig_slot
            db.commit()

        print("\n=== ALL SCHEDULING ENGINE CONSTRAINTS AND SOLVER TESTS PASSED! ===")
    finally:
        db.close()

if __name__ == "__main__":
    test_scheduling_engine()

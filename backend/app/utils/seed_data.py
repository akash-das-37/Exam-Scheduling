from datetime import date, datetime, timedelta
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.security import get_password_hash
from backend.app.models import (
    User, UserRole, Department, AcademicSession, Course, Semester,
    Student, Faculty, Subject, StudentSubject, BacklogRecord,
    ExamPeriod, TimeSlot, Exam, ExamRegistration,
    Room, SchedulingConstraint
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@apex.edu").first():
            print("Database already seeded. Skipping initial seeding.")
            return

        print("Seeding database with realistic college data...")

        # 1. Users
        admin_user = User(
            email="admin@apex.edu",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. Arthur Vance (Dean of Exams)",
            role=UserRole.ADMIN.value,
            phone="+1 555-0199",
            is_active=True
        )
        db.add(admin_user)
        db.flush()

        # 2. Departments
        depts_data = [
            ("Computer Science & Engineering", "CSE", "Department of Computer Science and Software Engineering"),
            ("Electronics & Communication", "ECE", "Department of Electronics, Embedded Systems & Telecomm"),
            ("Mechanical Engineering", "ME", "Department of Mechanical & Robotics Systems"),
            ("Information Technology", "IT", "Department of Information Systems & Cybersecurity")
        ]
        dept_objs = {}
        for name, code, desc in depts_data:
            dept = Department(name=name, code=code, description=desc, status="active")
            db.add(dept)
            dept_objs[code] = dept
        db.flush()

        # 3. Academic Session
        today = date.today()
        current_session = AcademicSession(
            name="2026-2027 (Odd Semester)",
            start_date=today.replace(month=8, day=1),
            end_date=today.replace(month=12, day=31),
            is_current=True,
            status="active"
        )
        db.add(current_session)
        db.flush()

        # 4. Courses & Semesters
        course_objs = {}
        courses_data = [
            ("B.Tech in Computer Science & Engineering", "BT-CSE", "CSE", 4, 8),
            ("B.Tech in Electronics & Communication", "BT-ECE", "ECE", 4, 8),
            ("B.Tech in Mechanical Engineering", "BT-ME", "ME", 4, 8),
            ("B.Tech in Information Technology", "BT-IT", "IT", 4, 8),
        ]
        for cname, ccode, dcode, dur, sems in courses_data:
            c = Course(
                name=cname,
                code=ccode,
                department_id=dept_objs[dcode].id,
                duration_years=dur,
                total_semesters=sems,
                status="active"
            )
            db.add(c)
            course_objs[ccode] = c
        db.flush()

        # Add semesters 1 to 8 for each course
        for ccode, c in course_objs.items():
            for sem_num in range(1, 9):
                s = Semester(
                    semester_number=sem_num,
                    course_id=c.id,
                    academic_session_id=current_session.id,
                    status="active"
                )
                db.add(s)
        db.flush()

        # 5. Faculty
        faculty_list = [
            ("Dr. Alan Turing", "faculty.cse1@apex.edu", "CSE", "Professor", "FAC-CSE-01", 6),
            ("Dr. Grace Hopper", "faculty.cse2@apex.edu", "CSE", "Associate Professor", "FAC-CSE-02", 5),
            ("Prof. Donald Knuth", "faculty.cse3@apex.edu", "CSE", "Assistant Professor", "FAC-CSE-03", 7),
            ("Dr. Claude Shannon", "faculty.ece1@apex.edu", "ECE", "Professor", "FAC-ECE-01", 6),
            ("Dr. Ada Lovelace", "faculty.ece2@apex.edu", "ECE", "Associate Professor", "FAC-ECE-02", 5),
            ("Prof. Nikola Tesla", "faculty.me1@apex.edu", "ME", "Professor", "FAC-ME-01", 6),
            ("Dr. James Watt", "faculty.me2@apex.edu", "ME", "Associate Professor", "FAC-ME-02", 6),
            ("Prof. Tim Berners-Lee", "faculty.it1@apex.edu", "IT", "Professor", "FAC-IT-01", 5),
            ("Dr. Barbara Liskov", "faculty.it2@apex.edu", "IT", "Associate Professor", "FAC-IT-02", 6),
            ("Prof. John von Neumann", "faculty.cse4@apex.edu", "CSE", "Assistant Professor", "FAC-CSE-04", 6)
        ]
        faculty_objs = []
        for fname, femail, fdept, fdesig, fcode, fworkload in faculty_list:
            u = User(
                email=femail,
                hashed_password=get_password_hash("faculty123"),
                full_name=fname,
                role=UserRole.FACULTY.value,
                phone="+1 555-010" + str(len(faculty_objs)),
                is_active=True
            )
            db.add(u)
            db.flush()
            fac = Faculty(
                user_id=u.id,
                faculty_code=fcode,
                full_name=fname,
                email=femail,
                phone=u.phone,
                department_id=dept_objs[fdept].id,
                designation=fdesig,
                max_invigilation_workload=fworkload,
                status="active"
            )
            db.add(fac)
            faculty_objs.append(fac)
        db.flush()

        # 6. Examination Rooms
        rooms_data = [
            ("Hall-101", "Main Academic Block", 1, "exam_hall", 120, "projector", True),
            ("Hall-102", "Main Academic Block", 1, "exam_hall", 100, "projector", True),
            ("Room-201", "Science Wing", 2, "classroom", 60, "none", True),
            ("Room-202", "Science Wing", 2, "classroom", 60, "none", True),
            ("Room-203", "Science Wing", 2, "classroom", 50, "none", True),
            ("Room-204", "Science Wing", 2, "classroom", 50, "none", False),
            ("Lab-301", "Computing Center", 3, "computer_lab", 45, "computers", True),
            ("Lab-302", "Computing Center", 3, "computer_lab", 45, "computers", True),
            ("Auditorium", "Convention Center", 1, "auditorium", 250, "audio_visual", True)
        ]
        room_objs = []
        for rnum, bldg, flr, rtype, cap, eq, acc in rooms_data:
            rm = Room(
                room_number=rnum,
                building=bldg,
                floor=flr,
                room_type=rtype,
                seating_capacity=cap,
                available_equipment=eq,
                accessibility=acc,
                status="available"
            )
            db.add(rm)
            room_objs.append(rm)
        db.flush()

        # 7. Time Slots
        slots_data = [
            ("Morning Session (09:30 - 12:30)", "09:30", "12:30", "morning"),
            ("Afternoon Session (14:00 - 17:00)", "14:00", "17:00", "afternoon"),
            ("Evening Session (17:30 - 20:30)", "17:30", "20:30", "evening")
        ]
        slot_objs = []
        for sname, stime, etime, stype in slots_data:
            ts = TimeSlot(
                name=sname,
                start_time=stime,
                end_time=etime,
                session_type=stype,
                is_active=True
            )
            db.add(ts)
            slot_objs.append(ts)
        db.flush()

        # 8. Exam Period
        exam_start = today + timedelta(days=14)
        exam_end = exam_start + timedelta(days=16)
        exam_period = ExamPeriod(
            academic_session_id=current_session.id,
            name="Fall 2026 End-Semester Examinations",
            start_date=exam_start,
            end_date=exam_end,
            available_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            holidays=[(exam_start + timedelta(days=6)).isoformat()],  # One holiday
            status="active"
        )
        db.add(exam_period)
        db.flush()

        # 9. Subjects
        subjects_data = [
            # CSE Semester 4
            ("CS401", "Data Structures & Algorithms", "CSE", "BT-CSE", 4, "theory", 4, 180, "none"),
            ("CS402", "Computer Organization & Architecture", "CSE", "BT-CSE", 4, "theory", 4, 180, "none"),
            ("CS403", "Database Management Systems", "CSE", "BT-CSE", 4, "theory", 4, 180, "none"),
            ("CS404", "Discrete Mathematical Structures", "CSE", "BT-CSE", 4, "theory", 3, 180, "none"),
            ("CS405", "Operating Systems Principles", "CSE", "BT-CSE", 4, "theory", 4, 180, "none"),
            # CSE Semester 4 Electives
            ("CS406A", "Web Application Architecture (Elective)", "CSE", "BT-CSE", 4, "elective", 3, 180, "computers"),
            ("CS406B", "Mobile App Development (Elective)", "CSE", "BT-CSE", 4, "elective", 3, 180, "computers"),
            # Backlog Subject for Semester 2 (taken by some Sem 4 students)
            ("MA201", "Engineering Mathematics II (Backlog)", "CSE", "BT-CSE", 2, "theory", 4, 180, "none"),
            # ECE Semester 4
            ("EC401", "Signals & Linear Systems", "ECE", "BT-ECE", 4, "theory", 4, 180, "none"),
            ("EC402", "Analog Integrated Circuits", "ECE", "BT-ECE", 4, "theory", 4, 180, "none"),
            ("EC403", "Electromagnetic Fields & Waves", "ECE", "BT-ECE", 4, "theory", 3, 180, "none"),
            # ME Semester 4
            ("ME401", "Thermodynamics & Heat Transfer", "ME", "BT-ME", 4, "theory", 4, 180, "none"),
            ("ME402", "Kinematics of Machinery", "ME", "BT-ME", 4, "theory", 4, 180, "none"),
            # IT Semester 4
            ("IT401", "Computer Networks & Security", "IT", "BT-IT", 4, "theory", 4, 180, "none"),
            ("IT402", "Object-Oriented Design & Design Patterns", "IT", "BT-IT", 4, "theory", 4, 180, "none")
        ]
        subj_objs = {}
        for scode, sname, sdept, scourse, ssem, stype, scred, sdur, seq in subjects_data:
            sb = Subject(
                subject_code=scode,
                subject_name=sname,
                department_id=dept_objs[sdept].id,
                course_id=course_objs[scourse].id,
                semester_number=ssem,
                subject_type=stype,
                credits=scred,
                exam_duration_minutes=sdur,
                required_equipment=seq,
                status="active"
            )
            db.add(sb)
            subj_objs[scode] = sb
        db.flush()

        # 10. Students & Registrations
        # Let's create 40 CSE students, 20 ECE students, 15 ME students, 15 IT students
        students = []
        
        # CSE Students (40 students)
        for i in range(1, 41):
            s_roll = f"24CSE{i:03d}"
            s_email = f"student.cse{i}@apex.edu"
            u = User(
                email=s_email,
                hashed_password=get_password_hash("student123"),
                full_name=f"CSE Student {i:02d}",
                role=UserRole.STUDENT.value,
                phone=f"+1 555-10{i:02d}",
                is_active=True
            )
            db.add(u)
            db.flush()
            st = Student(
                user_id=u.id,
                roll_number=s_roll,
                full_name=u.full_name,
                email=s_email,
                phone=u.phone,
                department_id=dept_objs["CSE"].id,
                course_id=course_objs["BT-CSE"].id,
                current_semester_number=4,
                academic_session_id=current_session.id,
                enrollment_year=2024,
                status="active"
            )
            db.add(st)
            students.append(st)
        db.flush()

        # Register CSE students for standard Sem 4 subjects
        cse_core = ["CS401", "CS402", "CS403", "CS404", "CS405"]
        for idx, st in enumerate(students):
            # All get core
            for scode in cse_core:
                ss = StudentSubject(
                    student_id=st.id,
                    subject_id=subj_objs[scode].id,
                    academic_session_id=current_session.id,
                    is_backlog=False,
                    status="registered"
                )
                db.add(ss)
            # Split electives: first 20 get Web Arch, next 20 get Mobile App
            elec_code = "CS406A" if idx < 20 else "CS406B"
            ss_elec = StudentSubject(
                student_id=st.id,
                subject_id=subj_objs[elec_code].id,
                academic_session_id=current_session.id,
                is_backlog=False,
                status="registered"
            )
            db.add(ss_elec)

            # Some students (e.g. indices 5, 12, 18, 25, 33) have Backlog in Engineering Math II (MA201)
            if idx in [5, 12, 18, 25, 33]:
                b_rec = BacklogRecord(
                    student_id=st.id,
                    subject_id=subj_objs["MA201"].id,
                    failed_session_id=current_session.id,
                    status="registered",
                    attempts_count=1,
                    remarks="Failed in Sem 2. Must appear for backlog exam."
                )
                db.add(b_rec)
                ss_backlog = StudentSubject(
                    student_id=st.id,
                    subject_id=subj_objs["MA201"].id,
                    academic_session_id=current_session.id,
                    is_backlog=True,
                    status="registered"
                )
                db.add(ss_backlog)
        db.flush()

        # Add 15 ECE students
        ece_students = []
        for i in range(1, 16):
            s_roll = f"24ECE{i:03d}"
            s_email = f"student.ece{i}@apex.edu"
            u = User(
                email=s_email,
                hashed_password=get_password_hash("student123"),
                full_name=f"ECE Student {i:02d}",
                role=UserRole.STUDENT.value,
                phone=f"+1 555-20{i:02d}",
                is_active=True
            )
            db.add(u)
            db.flush()
            st = Student(
                user_id=u.id,
                roll_number=s_roll,
                full_name=u.full_name,
                email=s_email,
                phone=u.phone,
                department_id=dept_objs["ECE"].id,
                course_id=course_objs["BT-ECE"].id,
                current_semester_number=4,
                academic_session_id=current_session.id,
                enrollment_year=2024,
                status="active"
            )
            db.add(st)
            ece_students.append(st)
        db.flush()

        for st in ece_students:
            for scode in ["EC401", "EC402", "EC403"]:
                ss = StudentSubject(
                    student_id=st.id,
                    subject_id=subj_objs[scode].id,
                    academic_session_id=current_session.id,
                    is_backlog=False,
                    status="registered"
                )
                db.add(ss)
        db.flush()

        # 11. Create Examination Events (Exams)
        # For each subject that has registered students, create an Exam
        exam_objs = {}
        for scode, sb in subj_objs.items():
            # count students registered
            reg_count = db.query(StudentSubject).filter(StudentSubject.subject_id == sb.id).count()
            if reg_count > 0:
                is_backlog = (scode == "MA201")
                ex = Exam(
                    subject_id=sb.id,
                    exam_name=f"{sb.subject_name} {'[Backlog Exam]' if is_backlog else '[Regular Exam]'}",
                    exam_type="backlog" if is_backlog else "regular",
                    department_id=sb.department_id,
                    course_id=sb.course_id,
                    semester_number=sb.semester_number,
                    academic_session_id=current_session.id,
                    date_range_start=exam_period.start_date,
                    date_range_end=exam_period.end_date,
                    duration_minutes=sb.exam_duration_minutes,
                    required_equipment=sb.required_equipment,
                    expected_student_count=reg_count,
                    status="pending"
                )
                db.add(ex)
                exam_objs[scode] = ex
        db.flush()

        # 12. Create Exam Registrations
        # Connect students to Exam events based on their subject registrations
        for scode, ex in exam_objs.items():
            sb = subj_objs[scode]
            reg_students = db.query(StudentSubject).filter(StudentSubject.subject_id == sb.id).all()
            for r_idx, reg in enumerate(reg_students):
                er = ExamRegistration(
                    exam_id=ex.id,
                    student_id=reg.student_id,
                    is_backlog=reg.is_backlog,
                    seat_number=f"S-{r_idx+1:03d}",
                    status="confirmed"
                )
                db.add(er)
        db.flush()

        # 13. Default Scheduling Constraints
        constraints_data = [
            ("min_student_gap_days", "Minimum Gap Between Student Exams", "soft", 30, "1", "Penalizes student examinations scheduled on consecutive days"),
            ("max_consecutive_days", "Max Consecutive Examination Days", "soft", 25, "2", "Discourages more than 2 consecutive exam days for any student"),
            ("balance_daily_load", "Balanced Daily Examination Load", "soft", 20, "true", "Distributes exams evenly across all available dates"),
            ("invigilator_fairness", "Faculty Invigilation Equity", "soft", 15, "true", "Balances invigilation duty count across faculty members"),
            ("avoid_room_swapping", "Minimize Room Switching", "soft", 10, "true", "Prefers consistent room allocations"),
            ("strict_capacity", "Strict Room Capacity Limit", "hard", 100, "true", "Hard Constraint: Room capacity must never be exceeded"),
            ("no_student_conflict", "Zero Student Overlap", "hard", 100, "true", "Hard Constraint: No student may have two exams in the same slot")
        ]
        for key, name, cat, wt, val, desc in constraints_data:
            c = SchedulingConstraint(
                key=key,
                name=name,
                category=cat,
                weight=wt,
                value=val,
                description=desc
            )
            db.add(c)

        db.commit()
        print("Database successfully seeded with realistic academic records, exams, rooms, faculty, and students!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

import io
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from sqlalchemy.orm import Session
from backend.app.models import (
    TimetableVersion, ExamSchedule, Exam, RoomAllocation, Room,
    InvigilatorAssignment, Faculty, Student, Department, Course, Subject, User, UserRole
)
from backend.app.core.security import get_password_hash

def export_timetable_excel(db: Session, timetable_version_id: int) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Examination Timetable"

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    headers = [
        "Date", "Day", "Time Slot", "Start Time", "End Time",
        "Subject Code", "Subject Name", "Department", "Semester",
        "Exam Type", "Registered Students", "Allocated Rooms", "Invigilators"
    ]
    ws.append(headers)

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = align_center

    schedules = db.query(ExamSchedule).filter(
        ExamSchedule.timetable_version_id == timetable_version_id
    ).order_by(ExamSchedule.exam_date, ExamSchedule.time_slot_id).all()

    for s in schedules:
        exam = s.exam
        slot = s.time_slot
        dept = exam.department if exam else None

        # Rooms
        allocs = s.room_allocations
        rooms_str = ", ".join([f"{a.room.room_number} ({a.allocated_seats}s)" for a in allocs if a.room])

        # Invigilators
        invigs = s.invigilator_assignments
        invigs_str = ", ".join([iv.faculty.full_name for iv in invigs if iv.faculty])

        row_data = [
            s.exam_date.isoformat(),
            s.exam_date.strftime("%A"),
            slot.name if slot else "",
            slot.start_time if slot else "",
            slot.end_time if slot else "",
            exam.subject.subject_code if exam and exam.subject else "",
            exam.subject.subject_name if exam and exam.subject else "",
            dept.code if dept else "",
            f"Sem {exam.semester_number}" if exam else "",
            exam.exam_type.capitalize() if exam else "",
            exam.expected_student_count if exam else 0,
            rooms_str,
            invigs_str
        ]
        ws.append(row_data)

    # Style rows
    for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=len(headers)):
        for cell in row:
            cell.border = thin_border
            cell.alignment = align_left

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = col[0].column_letter
        ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    buffer = io.BytesIO()
    wb.save(buffer)
    xlsx_bytes = buffer.getvalue()
    buffer.close()
    return xlsx_bytes

def export_students_excel(db: Session) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Students"

    headers = [
        "Roll Number", "Full Name", "Email", "Phone",
        "Department Code", "Course Code", "Current Semester",
        "Enrollment Year", "Status"
    ]
    ws.append(headers)

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="0F766E", end_color="0F766E", fill_type="solid")
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.font = header_font
        cell.fill = header_fill

    students = db.query(Student).all()
    for st in students:
        ws.append([
            st.roll_number,
            st.full_name,
            st.email,
            st.phone or "",
            st.department.code if st.department else "",
            st.course.code if st.course else "",
            st.current_semester_number,
            st.enrollment_year,
            st.status
        ])

    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = col[0].column_letter
        ws.column_dimensions[col_letter].width = max(max_len + 3, 14)

    buffer = io.BytesIO()
    wb.save(buffer)
    val = buffer.getvalue()
    buffer.close()
    return val

def import_students_excel(db: Session, file_bytes: bytes) -> dict:
    wb = load_workbook(io.BytesIO(file_bytes), data_only=True)
    ws = wb.active

    imported = 0
    errors = []

    # Get departments and courses maps
    depts = {d.code.upper(): d.id for d in db.query(Department).all()}
    courses = {c.code.upper(): c.id for c in db.query(Course).all()}

    # Header row is 1, data starts row 2
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if not row or not any(row):
            continue
        try:
            roll, name, email, phone, d_code, c_code, sem_num, enr_year, status = row[:9]
            if not roll or not name or not email:
                errors.append(f"Row {row_idx}: Roll Number, Full Name, and Email are required.")
                continue

            roll = str(roll).strip()
            email = str(email).strip().lower()
            d_code = str(d_code).strip().upper() if d_code else ""
            c_code = str(c_code).strip().upper() if c_code else ""

            if d_code not in depts:
                errors.append(f"Row {row_idx}: Unknown Department Code '{d_code}'.")
                continue
            if c_code not in courses:
                errors.append(f"Row {row_idx}: Unknown Course Code '{c_code}'.")
                continue

            # Check if student exists
            existing_st = db.query(Student).filter(
                (Student.roll_number == roll) | (Student.email == email)
            ).first()

            if existing_st:
                existing_st.full_name = str(name).strip()
                existing_st.phone = str(phone).strip() if phone else existing_st.phone
                existing_st.department_id = depts[d_code]
                existing_st.course_id = courses[c_code]
                existing_st.current_semester_number = int(sem_num) if sem_num else existing_st.current_semester_number
            else:
                # Create user account
                u = db.query(User).filter(User.email == email).first()
                if not u:
                    u = User(
                        email=email,
                        hashed_password=get_password_hash("student123"),
                        full_name=str(name).strip(),
                        role=UserRole.STUDENT.value,
                        phone=str(phone).strip() if phone else None,
                        is_active=True
                    )
                    db.add(u)
                    db.flush()

                st = Student(
                    user_id=u.id,
                    roll_number=roll,
                    full_name=str(name).strip(),
                    email=email,
                    phone=str(phone).strip() if phone else None,
                    department_id=depts[d_code],
                    course_id=courses[c_code],
                    current_semester_number=int(sem_num) if sem_num else 1,
                    enrollment_year=int(enr_year) if enr_year else 2026,
                    status=str(status).strip() if status else "active"
                )
                db.add(st)
            imported += 1
        except Exception as e:
            errors.append(f"Row {row_idx}: Error parsing row ({str(e)}).")

    db.commit()
    return {"success": True, "imported_count": imported, "errors": errors}

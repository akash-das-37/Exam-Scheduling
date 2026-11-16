import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from sqlalchemy.orm import Session
from backend.app.models import (
    TimetableVersion, ExamSchedule, Exam, RoomAllocation, Room,
    InvigilatorAssignment, Faculty, Student, Department, TimeSlot
)
from backend.app.core.config import settings

def generate_master_timetable_pdf(db: Session, timetable_version_id: int) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )

    version = db.query(TimetableVersion).filter(TimetableVersion.id == timetable_version_id).first()
    schedules = db.query(ExamSchedule).filter(
        ExamSchedule.timetable_version_id == timetable_version_id
    ).order_by(ExamSchedule.exam_date, ExamSchedule.time_slot_id).all()

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        alignment=1,
        textColor=colors.HexColor('#1E293B')
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#64748B')
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    header_cell_style = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )

    elements = []

    # Title Banner
    elements.append(Paragraph(f"<b>{settings.COLLEGE_NAME}</b>", title_style))
    elements.append(Paragraph(f"Official Examination Timetable — {version.name if version else 'Schedule'}", subtitle_style))
    elements.append(Paragraph(f"Status: {version.status.upper() if version else 'DRAFT'} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
    elements.append(Spacer(1, 15))

    # Table Header
    table_data = [[
        Paragraph("Date & Day", header_cell_style),
        Paragraph("Session & Time", header_cell_style),
        Paragraph("Course & Dept", header_cell_style),
        Paragraph("Subject Code & Name", header_cell_style),
        Paragraph("Type", header_cell_style),
        Paragraph("Allocated Rooms", header_cell_style),
        Paragraph("Invigilators", header_cell_style)
    ]]

    for s in schedules:
        exam = db.query(Exam).filter(Exam.id == s.exam_id).first()
        slot = db.query(TimeSlot).filter(TimeSlot.id == s.time_slot_id).first()
        dept = db.query(Department).filter(Department.id == exam.department_id).first() if exam else None
        
        # Rooms
        allocs = db.query(RoomAllocation).filter(RoomAllocation.exam_schedule_id == s.id).all()
        room_names = []
        for a in allocs:
            rm = db.query(Room).filter(Room.id == a.room_id).first()
            if rm:
                room_names.append(f"{rm.room_number} ({a.allocated_seats}s)")
        rooms_str = ", ".join(room_names) if room_names else "TBA"

        # Invigilators
        invigs = db.query(InvigilatorAssignment).filter(InvigilatorAssignment.exam_schedule_id == s.id).all()
        fac_names = []
        for iv in invigs:
            f = db.query(Faculty).filter(Faculty.id == iv.faculty_id).first()
            if f:
                fac_names.append(f.full_name)
        fac_str = ", ".join(fac_names) if fac_names else "TBA"

        date_str = f"{s.exam_date.strftime('%d %b %Y')}<br/>({s.exam_date.strftime('%A')})"
        time_str = f"{slot.name}<br/>{slot.start_time} - {slot.end_time}" if slot else "TBA"
        dept_str = f"{dept.code if dept else ''} Sem {exam.semester_number if exam else ''}"
        subj_str = f"<b>{exam.subject.subject_code if exam and exam.subject else ''}</b><br/>{exam.subject.subject_name if exam and exam.subject else ''}"
        type_str = (exam.exam_type or "Regular").capitalize() if exam else ""

        table_data.append([
            Paragraph(date_str, cell_style),
            Paragraph(time_str, cell_style),
            Paragraph(dept_str, cell_style),
            Paragraph(subj_str, cell_style),
            Paragraph(type_str, cell_style),
            Paragraph(rooms_str, cell_style),
            Paragraph(fac_str, cell_style)
        ])

    table = Table(table_data, colWidths=[90, 110, 80, 200, 60, 120, 120], repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))

    elements.append(table)
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_student_schedule_pdf(db: Session, timetable_version_id: int, student_id: int) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    student = db.query(Student).filter(Student.id == student_id).first()
    version = db.query(TimetableVersion).filter(TimetableVersion.id == timetable_version_id).first()

    # Find exams student is registered for
    from backend.app.models import ExamRegistration
    registrations = db.query(ExamRegistration).filter(ExamRegistration.student_id == student_id).all()
    exam_ids = [r.exam_id for r in registrations]

    schedules = db.query(ExamSchedule).filter(
        ExamSchedule.timetable_version_id == timetable_version_id,
        ExamSchedule.exam_id.in_(exam_ids)
    ).order_by(ExamSchedule.exam_date, ExamSchedule.time_slot_id).all()

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        alignment=1,
        textColor=colors.HexColor('#1E293B')
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#64748B')
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )
    header_cell = ParagraphStyle(
        'HCell',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )

    elements = []
    elements.append(Paragraph(f"<b>{settings.COLLEGE_NAME}</b>", title_style))
    elements.append(Paragraph("<b>STUDENT EXAMINATION ADMIT CARD & TIMETABLE</b>", subtitle_style))
    elements.append(Spacer(1, 10))

    # Student metadata box
    dept_name = student.department.name if student and student.department else "N/A"
    course_name = student.course.name if student and student.course else "N/A"
    
    meta_data = [
        [Paragraph(f"<b>Student Name:</b> {student.full_name if student else ''}", cell_style),
         Paragraph(f"<b>Roll Number:</b> {student.roll_number if student else ''}", cell_style)],
        [Paragraph(f"<b>Department:</b> {dept_name}", cell_style),
         Paragraph(f"<b>Semester:</b> Sem {student.current_semester_number if student else ''}", cell_style)],
        [Paragraph(f"<b>Program:</b> {course_name}", cell_style),
         Paragraph(f"<b>Session:</b> {version.name if version else ''}", cell_style)]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))

    table_data = [[
        Paragraph("Date", header_cell),
        Paragraph("Time", header_cell),
        Paragraph("Subject Code", header_cell),
        Paragraph("Subject Name", header_cell),
        Paragraph("Category", header_cell),
        Paragraph("Room & Building", header_cell)
    ]]

    for s in schedules:
        exam = db.query(Exam).filter(Exam.id == s.exam_id).first()
        slot = db.query(TimeSlot).filter(TimeSlot.id == s.time_slot_id).first()
        allocs = db.query(RoomAllocation).filter(RoomAllocation.exam_schedule_id == s.id).all()
        room_desc = []
        for a in allocs:
            rm = db.query(Room).filter(Room.id == a.room_id).first()
            if rm:
                room_desc.append(f"{rm.room_number} ({rm.building})")
        r_str = ", ".join(room_desc) if room_desc else "Announced at Hall"

        is_backlog = (exam.exam_type == "backlog")
        cat_str = "<b>BACKLOG</b>" if is_backlog else "Regular"

        table_data.append([
            Paragraph(s.exam_date.strftime("%d %b %Y"), cell_style),
            Paragraph(f"{slot.start_time} - {slot.end_time}" if slot else "", cell_style),
            Paragraph(exam.subject.subject_code if exam and exam.subject else "", cell_style),
            Paragraph(exam.subject.subject_name if exam and exam.subject else "", cell_style),
            Paragraph(cat_str, cell_style),
            Paragraph(r_str, cell_style)
        ])

    table = Table(table_data, colWidths=[80, 80, 80, 160, 60, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    elements.append(table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("<b>Notice:</b> Students must bring this admit card and College Identity Card to all examination halls.", subtitle_style))

    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_faculty_duties_pdf(db: Session, timetable_version_id: int, faculty_id: int) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    version = db.query(TimetableVersion).filter(TimetableVersion.id == timetable_version_id).first()

    # Find assigned duties
    assignments = db.query(InvigilatorAssignment).join(
        ExamSchedule, InvigilatorAssignment.exam_schedule_id == ExamSchedule.id
    ).filter(
        InvigilatorAssignment.faculty_id == faculty_id,
        ExamSchedule.timetable_version_id == timetable_version_id
    ).order_by(ExamSchedule.exam_date, ExamSchedule.time_slot_id).all()

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        alignment=1,
        textColor=colors.HexColor('#1E293B')
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#64748B')
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )
    header_cell = ParagraphStyle(
        'HCell',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )

    elements = []
    elements.append(Paragraph(f"<b>{settings.COLLEGE_NAME}</b>", title_style))
    elements.append(Paragraph("<b>FACULTY INVIGILATION DUTY ROSTER</b>", subtitle_style))
    elements.append(Spacer(1, 10))

    dept_name = faculty.department.name if faculty and faculty.department else "N/A"
    meta_data = [
        [Paragraph(f"<b>Faculty Name:</b> {faculty.full_name if faculty else ''}", cell_style),
         Paragraph(f"<b>Faculty Code:</b> {faculty.faculty_code if faculty else ''}", cell_style)],
        [Paragraph(f"<b>Department:</b> {dept_name}", cell_style),
         Paragraph(f"<b>Designation:</b> {faculty.designation if faculty else ''}", cell_style)],
        [Paragraph(f"<b>Total Duties Assigned:</b> {len(assignments)}", cell_style),
         Paragraph(f"<b>Max Assigned Limit:</b> {faculty.max_invigilation_workload if faculty else 6}", cell_style)]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))

    table_data = [[
        Paragraph("Date & Day", header_cell),
        Paragraph("Time Slot", header_cell),
        Paragraph("Room", header_cell),
        Paragraph("Building & Floor", header_cell),
        Paragraph("Role", header_cell),
        Paragraph("Examination Underway", header_cell)
    ]]

    for iv in assignments:
        sched = iv.exam_schedule
        slot = sched.time_slot
        room = iv.room
        exam = sched.exam

        table_data.append([
            Paragraph(f"{sched.exam_date.strftime('%d %b %Y')}<br/>({sched.exam_date.strftime('%A')})", cell_style),
            Paragraph(f"{slot.name}<br/>{slot.start_time} - {slot.end_time}", cell_style),
            Paragraph(room.room_number if room else "N/A", cell_style),
            Paragraph(f"{room.building if room else ''}, Flr {room.floor if room else ''}", cell_style),
            Paragraph(iv.role.replace("_", " ").title(), cell_style),
            Paragraph(f"<b>{exam.subject.subject_code if exam and exam.subject else ''}</b>: {exam.subject.subject_name if exam and exam.subject else ''}", cell_style)
        ])

    table = Table(table_data, colWidths=[90, 100, 70, 100, 80, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F766E')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    elements.append(table)
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

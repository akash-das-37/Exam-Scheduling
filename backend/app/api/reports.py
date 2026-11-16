from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.reports.pdf_generator import (
    generate_master_timetable_pdf,
    generate_student_schedule_pdf,
    generate_faculty_duties_pdf
)
from backend.app.reports.excel_handler import export_timetable_excel
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get("/pdf/master/{version_id}")
def download_master_pdf(version_id: int, db: Session = Depends(get_db)):
    pdf_bytes = generate_master_timetable_pdf(db, version_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=master_timetable_v{version_id}.pdf"}
    )

@router.get("/pdf/student/{version_id}/{student_id}")
def download_student_pdf(version_id: int, student_id: int, db: Session = Depends(get_db)):
    pdf_bytes = generate_student_schedule_pdf(db, version_id, student_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=student_exam_timetable_{student_id}.pdf"}
    )

@router.get("/pdf/faculty/{version_id}/{faculty_id}")
def download_faculty_pdf(version_id: int, faculty_id: int, db: Session = Depends(get_db)):
    pdf_bytes = generate_faculty_duties_pdf(db, version_id, faculty_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=faculty_duty_roster_{faculty_id}.pdf"}
    )

@router.get("/excel/timetable/{version_id}")
def download_timetable_excel(version_id: int, db: Session = Depends(get_db)):
    xlsx_bytes = export_timetable_excel(db, version_id)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=timetable_v{version_id}.xlsx"}
    )

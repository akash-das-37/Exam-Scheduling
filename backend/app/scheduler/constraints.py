from typing import List, Dict, Set, Tuple
from datetime import date, timedelta
from sqlalchemy.orm import Session
from backend.app.models import (
    Exam, ExamRegistration, ExamPeriod, TimeSlot, Room
)

class SchedulingContext:
    def __init__(self, db: Session, academic_session_id: int, exam_period_id: int = None):
        self.db = db
        self.academic_session_id = academic_session_id
        self.exam_period_id = exam_period_id

        # 1. Load active exams
        self.exams: List[Exam] = db.query(Exam).filter(
            Exam.academic_session_id == academic_session_id
        ).all()
        self.exam_ids = [e.id for e in self.exams]
        self.exam_map = {e.id: e for e in self.exams}

        # 2. Load student registrations per exam
        self.exam_students: Dict[int, Set[int]] = {}
        for eid in self.exam_ids:
            regs = db.query(ExamRegistration).filter(ExamRegistration.exam_id == eid).all()
            self.exam_students[eid] = {r.student_id for r in regs}

        # 3. Compute student conflict graph (pairwise clashes)
        # Pair (e1, e2) where e1 < e2 and share at least one student
        self.student_clashes: List[Tuple[int, int]] = []
        for i in range(len(self.exam_ids)):
            e1 = self.exam_ids[i]
            s1 = self.exam_students[e1]
            for j in range(i + 1, len(self.exam_ids)):
                e2 = self.exam_ids[j]
                s2 = self.exam_students[e2]
                if s1.intersection(s2):
                    self.student_clashes.append((e1, e2))

        # 4. Load exam period & determine calendar dates
        self.period: ExamPeriod = None
        if exam_period_id:
            self.period = db.query(ExamPeriod).filter(ExamPeriod.id == exam_period_id).first()
        if not self.period:
            self.period = db.query(ExamPeriod).filter(
                ExamPeriod.academic_session_id == academic_session_id,
                ExamPeriod.status == "active"
            ).first()

        self.holidays: Set[str] = set()
        self.available_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        if self.period:
            self.start_date = self.period.start_date
            self.end_date = self.period.end_date
            if self.period.holidays:
                self.holidays = set(self.period.holidays)
            if self.period.available_days:
                self.available_days = self.period.available_days
        else:
            self.start_date = date.today() + timedelta(days=7)
            self.end_date = self.start_date + timedelta(days=14)

        # Generate list of valid exam dates
        self.valid_dates: List[date] = []
        cur_date = self.start_date
        while cur_date <= self.end_date:
            day_name = cur_date.strftime("%A")
            if day_name in self.available_days and cur_date.isoformat() not in self.holidays:
                self.valid_dates.append(cur_date)
            cur_date += timedelta(days=1)

        # 5. Load active time slots
        self.time_slots: List[TimeSlot] = db.query(TimeSlot).filter(TimeSlot.is_active == True).all()
        self.slot_ids = [ts.id for ts in self.time_slots]
        self.slot_map = {ts.id: ts for ts in self.time_slots}

        # 6. Combined discrete periods: (date_idx, slot_idx)
        self.discrete_periods: List[Tuple[int, date, int]] = []  # (period_idx, date, slot_id)
        pidx = 0
        for d in self.valid_dates:
            for s in self.time_slots:
                self.discrete_periods.append((pidx, d, s.id))
                pidx += 1

        # 7. Rooms & Total Capacity
        self.rooms: List[Room] = db.query(Room).filter(Room.status == "available").all()
        self.total_room_capacity = sum(r.seating_capacity for r in self.rooms)

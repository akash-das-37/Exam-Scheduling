# Intelligent Exam Timetable Scheduling System
> Production-Quality Full-Stack Examination Management and Optimization Platform

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688.svg)](https://fastapi.tiangolo.com)
[![Google OR-Tools](https://img.shields.io/badge/OR--Tools-CP--SAT-4285F4.svg)](https://developers.google.com/optimization)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com)

---

## 1. Project Overview

The **Intelligent Exam Timetable Scheduling System** is an enterprise-grade full-stack web application designed for colleges and universities to manage, optimize, manually fine-tune, and securely publish clash-free examination timetables across departments, degree programs, semesters, and individual students.

### Strict Deterministic Optimization Principle
**No external generative AI APIs (No OpenAI, No Gemini, No Claude).** All intelligent scheduling functionality is implemented locally using **Google OR-Tools CP-SAT (Constraint Programming - Satisfiability)**, mathematical validation, and rule-based inference.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Routing & State**: React Router v7, TanStack Query v5
- **Charts**: Recharts
- **HTTP Client**: Axios with automatic JWT token injection and 401 interceptors

### Backend
- **Framework**: FastAPI (Python 3.14)
- **Database ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic v2
- **Optimization Engine**: Google OR-Tools CP-SAT (Constraint Programming)
- **PDF Generation**: ReportLab
- **Excel Handling**: OpenPyXL
- **Security**: JWT tokens (python-jose), Bcrypt password hashing
- **Database**: PostgreSQL (full Supabase support) with seamless SQLite fallback

---

## 3. Key Capabilities & Features

### A. Automatic Timetable Generation (OR-Tools CP-SAT)
- **Hard Constraints (Never Violated)**:
  1. Zero Student Overlaps: No student can have 2 examinations in the same time slot.
  2. Regular + Backlog Clashes: Seamlessly prevented since registrations link both regular and historical failed subjects.
  3. Room Capacity: Room capacity is never exceeded ($N \le \sum C(r)$).
  4. Room Double-Booking: A room cannot host two exams at the same time.
  5. Equipment Requirements: Labs with computer terminals are only assigned to exams requiring computers.
  6. Date Boundaries & Holidays: Exams only scheduled on active working days, strictly excluding holidays.
  7. Universal Scheduling: Every required exam must be scheduled before publishing.
- **Soft Constraints & Objective Weights**:
  - Minimum student examination gap (discourages consecutive examination days).
  - Balanced daily examination load across the calendar.
  - Equitable faculty invigilation workload distribution.

### B. Hybrid Timetable Editor
- **Interactive Calendar Grid & Table Views**: Filter by department, exam type, or search term.
- **Selective Re-generation**: Select specific exams and re-run CP-SAT to reschedule only those exams without altering the rest of the college timetable.
- **Alternative Slot Recommendations**: Evaluates all candidate slots and ranks them with explainability scores based on zero clashes, available room capacity, and study gaps.
- **Drag-and-Drop / Manual Adjustment**: Allows administrators to fine-tune dates and slots with immediate automatic constraint re-validation.

### C. Resource Allocation Engine
- **Bin-Packing Room Allocator**: Automatically allocates single or multiple rooms (e.g. splitting a 180-student exam into Hall A 60 + Hall B 60 + Hall C 60) respecting equipment matching.
- **Fair Invigilator Assignment**: Allocates professors to exam halls up to their maximum duty workload while checking declared faculty availability.

### D. Multi-Stage Publishing Workflow
- `Draft` $\to$ `Generated` $\to$ `Under Review` $\to$ `Validated` $\to$ `Published` $\to$ `Archived`
- **Integrity Rule**: Invalid timetables with hard conflicts are strictly blocked from being published.

### E. Professional Reporting & Exports
- **ReportLab PDF Generation**:
  - College Master Examination Timetable PDF
  - Student Personal Admit Card & Timetable PDF
  - Faculty Invigilation Duty Sheet PDF
- **OpenPyXL Excel Imports & Exports**:
  - Two-way student roster import/export with row-level error reporting.
  - Master examination timetable workbook export.

---

## 4. Default Seed Credentials (JIS College of Engineering)

The application is pre-seeded with realistic multi-department college data for **JIS College of Engineering (JISCE)** (Computer Science, Electronics, Mechanical, Information Technology, 55+ students with regular and backlog subjects, 10 faculty members, 9 rooms, time slots):

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@jisce.ac.in` *(or `admin@apex.edu`)* | `admin123` | Dean of Examinations (Full System Control) |
| **Faculty** | `faculty.cse1@jisce.ac.in` *(or `faculty.cse1@apex.edu`)* | `faculty123` | Dr. Alan Turing (Professor of CSE) |
| **Faculty** | `faculty.cse2@jisce.ac.in` *(or `faculty.cse2@apex.edu`)* | `faculty123` | Dr. Grace Hopper (Associate Professor) |
| **Student** | `student.cse1@jisce.ac.in` *(or `student.cse1@apex.edu`)* | `student123` | CSE Student 01 (Regular Sem 4) |
| **Student** | `student.cse6@jisce.ac.in` *(or `student.cse6@apex.edu`)* | `student123` | CSE Student 06 (Sem 4 Regular + Sem 2 Math Backlog) |

*(Quick sign-in demo buttons are also provided directly on the login screen for 1-click testing).*

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Python 3.10+ (tested and verified on Python 3.14)
- Node.js 18+ (tested on Node v24)
- npm or pnpm

### Backend Setup
1. Open a terminal in the project root:
   ```bash
   # Dependencies installed:
   # fastapi, uvicorn, sqlalchemy, pydantic, ortools, reportlab, openpyxl, python-jose, bcrypt
   
   # Seed the database with realistic college data:
   python -m backend.app.utils.seed_data
   
   # Start the FastAPI server on port 8000:
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The interactive Swagger API documentation is available at: `http://127.0.0.1:8000/docs`

### Frontend Setup
1. Open a terminal in `frontend/`:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open your browser at: `http://localhost:5173`

---

## 6. Running Automated Tests

Run direct service and CP-SAT constraint tests:
```bash
# Backend unit & service tests:
python -m tests.backend.test_services

# Google OR-Tools CP-SAT optimization & conflict detection tests:
python -m tests.scheduler.test_scheduler

# Frontend production compilation test:
cd frontend && npm run build
```

---

## 7. Project Folder Structure

```
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, academic, students, exams, scheduler, reports, etc.)
│   │   ├── core/            # Config, security, database session
│   │   ├── models/          # 24 SQLAlchemy models (User, Student, Exam, Room, etc.)
│   │   ├── notifications/   # Email & notification dispatch service
│   │   ├── reports/         # ReportLab PDF & OpenPyXL Excel handlers
│   │   ├── scheduler/       # OR-Tools CP-SAT engine, constraints, optimizer, validator, recommendations
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── utils/           # Database seed script
│   │   └── main.py          # FastAPI application entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, StatsCard, Modal, Badge
│   │   ├── context/         # AuthContext with role-based routing
│   │   ├── layouts/         # AdminLayout, FacultyLayout, StudentLayout, AuthLayout
│   │   ├── pages/           # Admin Dashboard, Scheduler, Conflicts, Roster, Student Portal, Faculty Portal
│   │   ├── routes/          # Protected React Router routes
│   │   ├── services/        # Axios API client with token interceptor
│   │   └── types/           # TypeScript interfaces
├── database/
│   ├── schema.sql           # PostgreSQL DDL schema
│   └── seed.sql             # SQL seed data
├── docs/
│   ├── SRS.md               # Software Requirements Specification
│   ├── ER_DIAGRAM.md        # Entity-Relationship diagram & descriptions
│   ├── API_DOCUMENTATION.md # REST API endpoint reference
│   └── SCHEDULING_ALGORITHM.md # CP-SAT mathematical formulation
└── tests/
    ├── backend/             # Service integration tests
    └── scheduler/           # CP-SAT constraint tests
```

# Software Requirements Specification (SRS)
## Intelligent Exam Timetable Scheduling System

### 1. Introduction
The **Intelligent Exam Timetable Scheduling System** is an enterprise-grade full-stack web application designed for higher education institutions (colleges and universities) to automate, optimize, manually fine-tune, and securely publish clash-free examination timetables across departments, semesters, courses, and students.

### 2. Primary Stakeholders & User Roles
1. **Administrator (Admin)**: Full control over academic structures, students, faculty, rooms, constraints, automatic scheduling, manual fine-tuning, conflict resolution, version control, and publication.
2. **Faculty**: View personal invigilation duties, assigned dates and rooms, submit availability/unavailability, and export duty sheets.
3. **Student**: View personalized examination schedules (regular + backlogs), assigned room locations, exam timings, and export printable exam schedules.

### 3. Functional Requirements
- **FR-1 Academic Setup**: Manage departments, sessions, courses, semesters, subjects (theory, practical, elective), student registrations, and backlog tracking.
- **FR-2 Examination Management**: Define exam events, durations, periods, time slots, and link them to registered students.
- **FR-3 Optimization Engine**: Generate mathematically optimal, clash-free exam timetables using Google OR-Tools CP-SAT without external AI APIs.
- **FR-4 Resource Allocation**: Allocate exam rooms ensuring capacities and equipment match, and assign faculty invigilators equitably within duty limits.
- **FR-5 Conflict Detection**: Perform instantaneous conflict validation (student overlaps, room double-booking, capacity deficits, faculty clashes).
- **FR-6 Hybrid Scheduling**: Provide calendar/table interfaces to manually adjust schedules, run localized re-generation, and validate changes.
- **FR-7 Versioning & Publishing**: Maintain strict audit logs and version snapshots (Draft, Generated, Under Review, Validated, Published).
- **FR-8 Reporting & Exports**: Produce publication-grade PDF documents via ReportLab and enable two-way Excel data import/export via OpenPyXL.
- **FR-9 Notifications**: Alert students and faculty of timetable publication and schedule alterations via in-app alerts and simulated/SMTP email.

### 4. Non-Functional Requirements
- **Performance**: CP-SAT solver completes standard college instances (< 200 exams, 500+ students) within configured time bounds (< 60s).
- **Integrity**: Zero tolerance for hard constraint violations in published timetables.
- **Security**: Argon2/Bcrypt password hashing, JWT bearer tokens, strictly enforced RBAC at database and API layers.
- **Usability**: Modern SaaS user experience, responsive on mobile, tablet, and desktop viewports with dark and light themes.

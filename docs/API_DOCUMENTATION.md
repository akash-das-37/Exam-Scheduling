# REST API Documentation
## Intelligent Exam Timetable Scheduling System

Base URL: `http://localhost:8000/api`

### 1. Authentication & Users
- `POST /api/auth/login`: Authenticate with email and password, returns JWT token and user profile.
- `GET /api/auth/me`: Get current authenticated user profile, permissions, and roles.
- `POST /api/auth/forgot-password`: Request password reset token.
- `POST /api/auth/reset-password`: Reset password using token.
- `POST /api/auth/logout`: Invalidate session.

### 2. Academic Management
- `GET /api/departments`: List all departments (with course and student counts).
- `POST /api/departments`: Create new department.
- `PUT /api/departments/{id}`: Update department.
- `DELETE /api/departments/{id}`: Soft delete/deactivate department.
- `GET /api/academic-sessions`: List academic sessions (active, past, upcoming).
- `POST /api/academic-sessions`: Create academic session.
- `GET /api/courses`: List courses filtered by department.
- `POST /api/courses`: Create course.
- `GET /api/semesters`: List semesters for a course/session.
- `POST /api/semesters`: Create or configure semester term.

### 3. Student & Faculty Management
- `GET /api/students`: List students with pagination, search, and filtering by department, course, semester.
- `POST /api/students`: Create new student.
- `GET /api/students/{id}`: Retrieve student profile, registered subjects, and backlogs.
- `PUT /api/students/{id}`: Update student details.
- `DELETE /api/students/{id}`: Deactivate student.
- `POST /api/students/import`: Bulk import students via Excel (`.xlsx`).
- `GET /api/students/export`: Export student roster as Excel (`.xlsx`).
- `GET /api/faculty`: List faculty members with workload stats.
- `POST /api/faculty`: Add new faculty.
- `PUT /api/faculty/{id}`: Update faculty details and max duties.
- `GET /api/faculty/{id}/duties`: List invigilation duties assigned to faculty.
- `POST /api/faculty/availability`: Declare availability or unavailability for dates/slots.

### 4. Subjects & Student Registrations
- `GET /api/subjects`: List subjects by department, course, semester.
- `POST /api/subjects`: Create subject (theory, lab, practical, elective).
- `PUT /api/subjects/{id}`: Update subject.
- `GET /api/registrations`: List student subject registrations.
- `POST /api/registrations`: Enroll student into subject (regular or elective).
- `POST /api/registrations/bulk`: Bulk enroll students or import via Excel.

### 5. Examination & Backlog Management
- `GET /api/exams`: List examination events with type, status, and enrolled count.
- `POST /api/exams`: Create examination event.
- `PUT /api/exams/{id}`: Update examination details.
- `DELETE /api/exams/{id}`: Delete examination event.
- `GET /api/backlog`: List active backlog records.
- `POST /api/backlog`: Record failed subject for student.
- `POST /api/backlog/register`: Register backlog student for an upcoming examination.
- `GET /api/exam-periods`: List and manage exam calendar periods and holidays.
- `GET /api/time-slots`: List and configure standard examination time slots.

### 6. Rooms & Invigilation
- `GET /api/rooms`: List exam venues, capacities, and equipment.
- `POST /api/rooms`: Create new room.
- `PUT /api/rooms/{id}`: Update room.
- `GET /api/rooms/utilization`: Compute room utilization metrics across timetable.
- `GET /api/invigilation/duties`: List all invigilation assignments.
- `POST /api/invigilation/assign`: Assign or update invigilators for an exam schedule.

### 7. Timetable Optimization & Hybrid Scheduling
- `POST /api/scheduler/generate`: Trigger OR-Tools CP-SAT automatic timetable generation.
- `POST /api/scheduler/validate`: Run independent constraint validation on a timetable version.
- `GET /api/scheduler/conflicts/{version_id}`: Fetch all detected conflicts (student, room, faculty).
- `POST /api/scheduler/regenerate-selected`: Re-optimize a subset of conflicting or selected exams.
- `POST /api/scheduler/recommend-slots`: Get rule-based ranked alternative slots for an exam.
- `GET /api/timetable/versions`: List all saved timetable versions.
- `GET /api/timetable/version/{id}`: Retrieve full timetable schedule data.
- `PUT /api/timetable/schedule/{id}`: Update exam schedule (manual drag/drop or slot change).
- `POST /api/timetable/publish/{id}`: Validate and publish timetable version.
- `GET /api/timetable/student/{student_id}`: Get student's personalized timetable.
- `GET /api/timetable/faculty/{faculty_id}`: Get faculty's personalized duty roster.

### 8. Reports & Analytics
- `GET /api/reports/pdf/master/{version_id}`: Generate college-wide master timetable PDF.
- `GET /api/reports/pdf/department/{version_id}/{dept_id}`: Generate department PDF.
- `GET /api/reports/pdf/student/{version_id}/{student_id}`: Generate student personal schedule PDF.
- `GET /api/reports/pdf/faculty/{version_id}/{faculty_id}`: Generate faculty invigilation PDF.
- `GET /api/reports/pdf/rooms/{version_id}`: Generate room allocation matrix PDF.
- `GET /api/reports/excel/timetable/{version_id}`: Export full timetable to Excel.
- `GET /api/analytics/dashboard`: Summary statistics, load distribution, and utilization graphs.

### 9. Notifications & Settings
- `GET /api/notifications`: List notifications for current user.
- `POST /api/notifications/dispatch`: Send timetable publication / change notifications.
- `GET /api/settings`: Get system-wide parameters and algorithm weights.
- `PUT /api/settings`: Update optimization parameters and college info.

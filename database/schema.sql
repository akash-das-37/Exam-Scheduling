-- Intelligent Exam Timetable Scheduling System
-- PostgreSQL Relational Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    duration_years INTEGER DEFAULT 4,
    total_semesters INTEGER DEFAULT 8,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    semester_number INTEGER NOT NULL,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_session_id INTEGER NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    roll_number VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    department_id INTEGER NOT NULL REFERENCES departments(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    current_semester_number INTEGER DEFAULT 1,
    academic_session_id INTEGER REFERENCES academic_sessions(id),
    enrollment_year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    faculty_code VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    department_id INTEGER NOT NULL REFERENCES departments(id),
    designation VARCHAR(100) DEFAULT 'Assistant Professor',
    max_invigilation_workload INTEGER DEFAULT 6,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    semester_number INTEGER NOT NULL,
    subject_type VARCHAR(50) DEFAULT 'theory',
    credits INTEGER DEFAULT 3,
    exam_duration_minutes INTEGER DEFAULT 180,
    required_equipment VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS student_subjects (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_session_id INTEGER REFERENCES academic_sessions(id),
    is_backlog BOOLEAN DEFAULT FALSE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'registered'
);

CREATE TABLE IF NOT EXISTS backlog_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    failed_session_id INTEGER REFERENCES academic_sessions(id),
    status VARCHAR(50) DEFAULT 'pending',
    attempts_count INTEGER DEFAULT 1,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_periods (
    id SERIAL PRIMARY KEY,
    academic_session_id INTEGER NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    available_days JSONB DEFAULT '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]',
    holidays JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS time_slots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    session_type VARCHAR(50) DEFAULT 'morning',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) DEFAULT 'regular',
    department_id INTEGER NOT NULL REFERENCES departments(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    semester_number INTEGER NOT NULL,
    academic_session_id INTEGER NOT NULL REFERENCES academic_sessions(id),
    date_range_start DATE,
    date_range_end DATE,
    duration_minutes INTEGER DEFAULT 180,
    required_equipment VARCHAR(255),
    expected_student_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_registrations (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    is_backlog BOOLEAN DEFAULT FALSE,
    seat_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'confirmed',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(50) UNIQUE NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor INTEGER DEFAULT 1,
    room_type VARCHAR(50) DEFAULT 'classroom',
    seating_capacity INTEGER NOT NULL,
    available_equipment VARCHAR(255),
    accessibility BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS timetable_versions (
    id SERIAL PRIMARY KEY,
    academic_session_id INTEGER NOT NULL REFERENCES academic_sessions(id),
    exam_period_id INTEGER REFERENCES exam_periods(id),
    version_number INTEGER DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    modification_reason TEXT,
    solver_status VARCHAR(50),
    solver_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_schedules (
    id SERIAL PRIMARY KEY,
    timetable_version_id INTEGER NOT NULL REFERENCES timetable_versions(id) ON DELETE CASCADE,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    time_slot_id INTEGER NOT NULL REFERENCES time_slots(id),
    is_locked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_allocations (
    id SERIAL PRIMARY KEY,
    exam_schedule_id INTEGER NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    allocated_seats INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty_availability (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot_id INTEGER REFERENCES time_slots(id),
    is_available BOOLEAN DEFAULT TRUE,
    reason TEXT
);

CREATE TABLE IF NOT EXISTS invigilator_assignments (
    id SERIAL PRIMARY KEY,
    exam_schedule_id INTEGER NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'invigilator',
    status VARCHAR(50) DEFAULT 'assigned'
);

CREATE TABLE IF NOT EXISTS scheduling_constraints (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'soft',
    weight INTEGER DEFAULT 10,
    value VARCHAR(100) DEFAULT '1',
    description TEXT
);

CREATE TABLE IF NOT EXISTS timetable_changes (
    id SERIAL PRIMARY KEY,
    timetable_version_id INTEGER NOT NULL REFERENCES timetable_versions(id) ON DELETE CASCADE,
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    changed_by INTEGER REFERENCES users(id),
    old_date DATE,
    new_date DATE,
    old_slot_id INTEGER REFERENCES time_slots(id),
    new_slot_id INTEGER REFERENCES time_slots(id),
    reason TEXT,
    conflicts_detected JSONB DEFAULT '[]',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info',
    status VARCHAR(50) DEFAULT 'unread',
    delivery_channel VARCHAR(50) DEFAULT 'in_app',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_details TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

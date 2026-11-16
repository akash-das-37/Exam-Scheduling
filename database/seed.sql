-- Intelligent Exam Timetable Scheduling System
-- Sample Seed Data (PostgreSQL Format)

-- Default Admin User (Password: admin123)
INSERT INTO users (email, hashed_password, full_name, role, phone, is_active)
VALUES 
('admin@apex.edu', '$2b$12$E4UvUaX2XF7uFqUaF0v.8O4Gf93VlK4eCsm/L6sZp9B6m0o5Zsq4m', 'Dr. Arthur Vance (Dean of Exams)', 'admin', '+1 555-0199', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Default Departments
INSERT INTO departments (name, code, description, status)
VALUES
('Computer Science & Engineering', 'CSE', 'Department of Computer Science and Software Engineering', 'active'),
('Electronics & Communication', 'ECE', 'Department of Electronics, Embedded Systems & Telecomm', 'active'),
('Mechanical Engineering', 'ME', 'Department of Mechanical & Robotics Systems', 'active'),
('Information Technology', 'IT', 'Department of Information Systems & Cybersecurity', 'active')
ON CONFLICT (code) DO NOTHING;

-- Default Time Slots
INSERT INTO time_slots (name, start_time, end_time, session_type, is_active)
VALUES
('Morning Session (09:30 - 12:30)', '09:30', '12:30', 'morning', TRUE),
('Afternoon Session (14:00 - 17:00)', '14:00', '17:00', 'afternoon', TRUE),
('Evening Session (17:30 - 20:30)', '17:30', '20:30', 'evening', TRUE);

-- Default Scheduling Constraints
INSERT INTO scheduling_constraints (key, name, category, weight, value, description)
VALUES
('min_student_gap_days', 'Minimum Gap Between Student Exams', 'soft', 30, '1', 'Penalizes student examinations scheduled on consecutive days'),
('max_consecutive_days', 'Max Consecutive Examination Days', 'soft', 25, '2', 'Discourages more than 2 consecutive exam days for any student'),
('balance_daily_load', 'Balanced Daily Examination Load', 'soft', 20, 'true', 'Distributes exams evenly across all available dates'),
('invigilator_fairness', 'Faculty Invigilation Equity', 'soft', 15, 'true', 'Balances invigilation duty count across faculty members'),
('strict_capacity', 'Strict Room Capacity Limit', 'hard', 100, 'true', 'Hard Constraint: Room capacity must never be exceeded'),
('no_student_conflict', 'Zero Student Overlap', 'hard', 100, 'true', 'Hard Constraint: No student may have two exams in the same slot')
ON CONFLICT (key) DO NOTHING;

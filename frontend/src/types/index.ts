export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'faculty' | 'student';
  phone?: string;
  is_active: boolean;
  student_id?: number;
  faculty_id?: number;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  status: string;
  courses_count?: number;
  students_count?: number;
  faculty_count?: number;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  department_id: number;
  department_name?: string;
  duration_years: number;
  total_semesters: number;
  status: string;
}

export interface AcademicSession {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
}

export interface Student {
  id: number;
  user_id?: number;
  roll_number: string;
  full_name: string;
  email: string;
  phone?: string;
  department_id: number;
  department_name?: string;
  course_id: number;
  course_name?: string;
  current_semester_number: number;
  academic_session_id?: number;
  enrollment_year: number;
  status: string;
  registered_subjects_count?: number;
  backlog_count?: number;
}

export interface Faculty {
  id: number;
  user_id?: number;
  faculty_code: string;
  full_name: string;
  email: string;
  phone?: string;
  department_id: number;
  department_name?: string;
  designation: string;
  max_invigilation_workload: number;
  status: string;
  assigned_duties_count?: number;
}

export interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  department_id: number;
  department_name?: string;
  course_id: number;
  course_name?: string;
  semester_number: number;
  subject_type: string;
  credits: number;
  exam_duration_minutes: number;
  required_equipment?: string;
  status: string;
  registered_students_count?: number;
}

export interface Exam {
  id: number;
  subject_id: number;
  subject_code?: string;
  exam_name: string;
  exam_type: string;
  department_id: number;
  department_name?: string;
  course_id: number;
  course_name?: string;
  semester_number: number;
  academic_session_id: number;
  date_range_start?: string;
  date_range_end?: string;
  duration_minutes: number;
  required_equipment?: string;
  expected_student_count: number;
  status: string;
}

export interface TimeSlot {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  session_type: string;
  is_active: boolean;
}

export interface Room {
  id: number;
  room_number: string;
  building: string;
  floor: number;
  room_type: string;
  seating_capacity: number;
  available_equipment?: string;
  accessibility: boolean;
  status: string;
}

export interface RoomAllocation {
  id: number;
  exam_schedule_id: number;
  room_id: number;
  allocated_seats: number;
  room_number?: string;
  building?: string;
  room_type?: string;
}

export interface InvigilatorAssignment {
  id: number;
  exam_schedule_id: number;
  room_id: number;
  faculty_id: number;
  role: string;
  status: string;
  faculty_name?: string;
  faculty_code?: string;
  room_number?: string;
  building?: string;
  exam_name?: string;
  exam_date?: string;
  time_slot_name?: string;
}

export interface ExamSchedule {
  id: number;
  timetable_version_id: number;
  exam_id: number;
  exam_date: string;
  time_slot_id: number;
  is_locked: boolean;
  notes?: string;
  exam_name?: string;
  subject_code?: string;
  subject_name?: string;
  exam_type?: string;
  department_name?: string;
  semester_number?: number;
  expected_students?: number;
  time_slot_name?: string;
  start_time?: string;
  end_time?: string;
  room_allocations?: RoomAllocation[];
  invigilator_assignments?: InvigilatorAssignment[];
}

export interface TimetableVersion {
  id: number;
  academic_session_id: number;
  exam_period_id?: number;
  version_number: number;
  name: string;
  status: string;
  published_at?: string;
  modification_reason?: string;
  solver_status?: string;
  solver_metrics?: any;
  is_active: boolean;
  created_at: string;
  session_name?: string;
  period_name?: string;
  scheduled_exams_count?: number;
}

export interface Conflict {
  conflict_type: string;
  severity: 'critical' | 'warning';
  exam_id: number;
  exam_name: string;
  affected_entities: string[];
  message: string;
  recommendation: string;
}

export interface ValidationResult {
  is_valid: boolean;
  status: string;
  total_exams: number;
  scheduled_exams: number;
  unscheduled_exams: number;
  student_conflicts_count: number;
  room_conflicts_count: number;
  faculty_conflicts_count: number;
  capacity_violations_count: number;
  conflicts: Conflict[];
}

export interface RecommendedSlot {
  exam_date: string;
  time_slot_id: number;
  time_slot_name: string;
  score: number;
  reasons: string[];
  student_clash_count: number;
  available_rooms: string[];
  total_spare_capacity: number;
  is_feasible: boolean;
}

export interface DashboardStats {
  total_students: number;
  total_faculty: number;
  total_departments: number;
  total_subjects: number;
  total_exams: number;
  total_rooms: number;
  total_room_capacity: number;
  scheduled_exams: number;
  unscheduled_exams: number;
  backlog_registrations_count: number;
  detected_conflicts_count: number;
  active_timetable_version?: string;
  active_timetable_status?: string;
}

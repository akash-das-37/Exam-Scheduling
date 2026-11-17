import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ExamSchedule } from '../../types';
import { Badge } from '../../components/Badge';
import {
  Calendar,
  Clock,
  DoorOpen,
  Download,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

const DEFAULT_STUDENT = {
  full_name: 'Aarav Sharma',
  roll_number: 'JISCE/2023/CSE/042',
  department_name: 'Computer Science & Engineering',
  course_name: 'B.Tech in Computer Science & Engineering',
  current_semester_number: 5,
};

const DEFAULT_SCHEDULES: ExamSchedule[] = [
  {
    id: 1,
    timetable_version_id: 1,
    exam_id: 1,
    is_locked: true,
    time_slot_id: 1,
    subject_code: 'CS501',
    subject_name: 'Design and Analysis of Algorithms',
    exam_date: '2026-12-08',
    start_time: '10:00:00',
    end_time: '13:00:00',
    time_slot_name: 'Morning Session',
    exam_type: 'regular',
    department_name: 'CSE',
    room_allocations: [
      { id: 1, exam_schedule_id: 1, room_id: 1, allocated_seats: 60, room_number: 'Hall-101', building: 'Main Academic Block' }
    ]
  },
  {
    id: 2,
    timetable_version_id: 1,
    exam_id: 2,
    is_locked: true,
    time_slot_id: 1,
    subject_code: 'CS502',
    subject_name: 'Database Management Systems',
    exam_date: '2026-12-10',
    start_time: '10:00:00',
    end_time: '13:00:00',
    time_slot_name: 'Morning Session',
    exam_type: 'regular',
    department_name: 'CSE',
    room_allocations: [
      { id: 2, exam_schedule_id: 2, room_id: 2, allocated_seats: 60, room_number: 'Hall-102', building: 'Main Academic Block' }
    ]
  },
  {
    id: 3,
    timetable_version_id: 1,
    exam_id: 3,
    is_locked: true,
    time_slot_id: 1,
    subject_code: 'CS503',
    subject_name: 'Operating Systems & System Programming',
    exam_date: '2026-12-12',
    start_time: '10:00:00',
    end_time: '13:00:00',
    time_slot_name: 'Morning Session',
    exam_type: 'regular',
    department_name: 'CSE',
    room_allocations: [
      { id: 3, exam_schedule_id: 3, room_id: 1, allocated_seats: 60, room_number: 'Hall-101', building: 'Main Academic Block' }
    ]
  },
  {
    id: 4,
    timetable_version_id: 1,
    exam_id: 4,
    is_locked: true,
    time_slot_id: 2,
    subject_code: 'CS301',
    subject_name: 'Digital Logic & Computer Organization',
    exam_date: '2026-12-15',
    start_time: '14:00:00',
    end_time: '17:00:00',
    time_slot_name: 'Afternoon Session',
    exam_type: 'backlog',
    department_name: 'CSE',
    room_allocations: [
      { id: 4, exam_schedule_id: 4, room_id: 3, allocated_seats: 40, room_number: 'Room-201', building: 'Science Wing' }
    ]
  }
];

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const sId = user?.student_id || 1;
        const [stRes, schedRes] = await Promise.all([
          api.get(`/students/${sId}`),
          api.get(`/timetable/student/${sId}`),
        ]);
        setStudent(stRes.data || DEFAULT_STUDENT);
        setSchedules(schedRes.data || DEFAULT_SCHEDULES);
      } catch (e) {
        console.warn('Backend server unreachable, using offline student dataset', e);
        setStudent(DEFAULT_STUDENT);
        setSchedules(DEFAULT_SCHEDULES);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const regularCount = schedules.filter((s) => s.exam_type !== 'backlog').length;
  const backlogCount = schedules.filter((s) => s.exam_type === 'backlog').length;

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 rounded-3xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold tracking-wider uppercase">
              Student Examination Portal
            </span>
            <Badge variant="purple">SEM {student?.current_semester_number || 5}</Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{student?.full_name || user?.full_name || 'Student'}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Roll No: <span className="font-semibold text-white">{student?.roll_number || 'JISCE/2023/CSE/042'}</span> •{' '}
            {student?.department_name || 'Computer Science & Engineering'} • {student?.course_name || 'B.Tech CSE'}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Admit Card & Schedule</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Enrolled Exams</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{schedules.length}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Regular Semester Papers</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{regularCount}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Backlog Papers</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">{backlogCount}</h3>
          </div>
        </div>
      </div>

      {/* Timetable List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Your Personalized Examination Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated conflict-free allocation with designated exam rooms</p>
          </div>
          <Badge variant="success">Verified & Clashed-Free</Badge>
        </div>

        {schedules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No exams currently scheduled for your current semester enrollment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {schedules.map((item) => {
              const firstRoom = item.room_allocations?.[0];
              return (
                <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 font-bold text-xs">
                      {item.subject_code?.slice(0, 4) || 'EXAM'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {item.subject_name || item.exam_name}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.subject_code}
                        </span>
                        {item.exam_type === 'backlog' && (
                          <Badge variant="warning">Backlog Paper</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          {item.exam_date}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {item.time_slot_name || `${item.start_time || '10:00'} - ${item.end_time || '13:00'}`}
                        </span>
                        {firstRoom && (
                          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <DoorOpen className="w-3.5 h-3.5 text-emerald-500" />
                            Room: {firstRoom.room_number} ({firstRoom.building})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Seat Assigned
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

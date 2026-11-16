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
        setStudent(stRes.data);
        setSchedules(schedRes.data);
      } catch (e) {
        console.error(e);
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
            <Badge variant="purple">SEM {student?.current_semester_number || 4}</Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{student?.full_name || user?.full_name}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Roll No: <span className="font-semibold text-white">{student?.roll_number}</span> •{' '}
            {student?.department_name} • {student?.course_name}
          </p>
        </div>

        <a
          href={`/api/reports/pdf/student/1/${student?.id || 1}`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download Official Admit Card (PDF)</span>
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Registered Examinations</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{schedules.length}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">End-Semester Academic Session</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Regular Semester Exams</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{regularCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Standard semester subjects</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Backlog Examinations</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{backlogCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Clash-free scheduled alongside regular</span>
        </div>
      </div>

      {/* Schedule Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Personal Examination Schedule</h3>
            <p className="text-xs text-slate-500">Dates, examination time slots, and assigned examination halls</p>
          </div>
          <span className="text-xs text-slate-400">{schedules.length} papers scheduled</span>
        </div>

        {schedules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No examinations scheduled or timetable has not been published yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {schedules.map((s) => {
              const isBacklog = s.exam_type === 'backlog';
              const dateObj = new Date(s.exam_date);
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                weekday: 'short',
              });

              return (
                <div key={s.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center font-bold shrink-0 border border-blue-100 dark:border-blue-900">
                      <span className="text-[10px] uppercase">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg leading-none">{dateObj.getDate()}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.subject_code}</span>
                        <Badge variant={isBacklog ? 'warning' : 'default'} className="text-[10px]">
                          {s.exam_type?.toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {s.subject_name || s.exam_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {formattedDate} • {s.department_name} (Sem {s.semester_number})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">SESSION</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{s.start_time} - {s.end_time}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">VENUE</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {s.room_allocations && s.room_allocations.length > 0
                            ? s.room_allocations[0].room_number
                            : 'TBA'}
                        </span>
                      </div>
                    </div>
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

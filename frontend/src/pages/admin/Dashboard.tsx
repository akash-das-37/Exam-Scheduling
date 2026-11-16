import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { DashboardStats } from '../../types';
import { StatsCard } from '../../components/StatsCard';
import { Badge } from '../../components/Badge';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DoorOpen,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateDist, setDateDist] = useState<any[]>([]);
  const [deptDist, setDeptDist] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [facultyWorkload, setFacultyWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, dateRes, deptRes, typesRes, workloadRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/charts/date-distribution'),
        api.get('/analytics/charts/department-distribution'),
        api.get('/analytics/charts/exam-types'),
        api.get('/analytics/charts/faculty-workload'),
      ]);
      setStats(statsRes.data);
      setDateDist(dateRes.data);
      setDeptDist(deptRes.data);
      setExamTypes(typesRes.data);
      setFacultyWorkload(workloadRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading institutional analytics...</p>
        </div>
      </div>
    );
  }

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold tracking-wider uppercase">
              Academic Term 2026-2027
            </span>
            {stats.active_timetable_status && (
              <Badge variant={stats.active_timetable_status === 'published' ? 'success' : 'purple'}>
                {stats.active_timetable_status.toUpperCase()}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Examination Operations Hub</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Active Timetable: <span className="font-semibold text-white">{stats.active_timetable_version || 'None Generated'}</span> — All constraint formulations, room allocations and invigilation duties are synchronized.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/scheduler')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate / Edit Timetable</span>
          </button>
          <button
            onClick={() => navigate('/admin/conflicts')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>View Conflicts ({stats.detected_conflicts_count})</span>
          </button>
        </div>
      </div>

      {/* Conflict Warning Alert if Conflicts exist */}
      {stats.detected_conflicts_count > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {stats.detected_conflicts_count} Scheduling Conflicts Detected
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                The current timetable draft has conflicts that must be resolved before publication.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/conflicts')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shrink-0 transition-colors"
          >
            Resolve Conflicts
          </button>
        </div>
      )}

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.total_students}
          subtitle="Enrolled across all courses"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Scheduled Exams"
          value={`${stats.scheduled_exams} / ${stats.total_exams}`}
          subtitle={`${stats.unscheduled_exams} unscheduled`}
          icon={Calendar}
          color="emerald"
        />
        <StatsCard
          title="Backlog Registrations"
          value={stats.backlog_registrations_count}
          subtitle="Clash-free integrated"
          icon={RotateCcw}
          color="purple"
        />
        <StatsCard
          title="Exam Venues"
          value={stats.total_rooms}
          subtitle={`${stats.total_room_capacity} total seats`}
          icon={DoorOpen}
          color="slate"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Departments</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.total_departments}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Active Subjects</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.total_subjects}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Faculty Members</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.total_faculty}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Constraint Violations</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.detected_conflicts_count}</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Distribution Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Daily Examination Load</h3>
              <p className="text-xs text-slate-500">Distribution of exams scheduled across calendar dates</p>
            </div>
            <Badge variant="outline">Even Spread Optimized</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dateDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regular vs Backlog Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Examination Category Mix</h3>
            <p className="text-xs text-slate-500">Regular vs. Backlog events</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={examTypes}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {examTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department-wise exam count */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Department Examination Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Number of active examinations scheduled per academic department</p>
          <div className="space-y-3">
            {deptDist.map((d) => (
              <div key={d.department_code} className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                    {d.department_code}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{d.department_name}</p>
                    <p className="text-slate-400 text-[11px]">{d.department_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{d.exam_count} exams</span>
                  <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${Math.min((d.exam_count / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Administrative Actions</h3>
          <p className="text-xs text-slate-500 mb-4">Direct workflow shortcuts</p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/scheduler')}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Run CP-SAT Optimizer</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/admin/students')}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Student Roster & Import</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/admin/rooms')}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <DoorOpen className="w-4 h-4 text-slate-600" />
                <span>Rooms & Seating Capacity</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/admin/reports')}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Download Official PDFs</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

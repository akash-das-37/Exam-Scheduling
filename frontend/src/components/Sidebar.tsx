import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  GraduationCap,
  Users,
  UserCheck,
  BookOpen,
  FileSpreadsheet,
  RotateCcw,
  Clock,
  DoorOpen,
  ShieldCheck,
  FileText,
  Settings,
  CalendarCheck,
  Award
} from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const adminNav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Timetable Scheduler', path: '/admin/scheduler', icon: Calendar },
    { name: 'Conflict Detection', path: '/admin/conflicts', icon: AlertTriangle },
    { name: 'Academic Structure', path: '/admin/academic', icon: GraduationCap },
    { name: 'Student Management', path: '/admin/students', icon: Users },
    { name: 'Faculty Management', path: '/admin/faculty', icon: UserCheck },
    { name: 'Subject Catalog', path: '/admin/subjects', icon: BookOpen },
    { name: 'Examination Events', path: '/admin/exams', icon: FileSpreadsheet },
    { name: 'Backlog Records', path: '/admin/backlog', icon: RotateCcw },
    { name: 'Calendar & Slots', path: '/admin/calendar', icon: Clock },
    { name: 'Exam Rooms', path: '/admin/rooms', icon: DoorOpen },
    { name: 'Invigilation Duties', path: '/admin/invigilation', icon: ShieldCheck },
    { name: 'PDF & Excel Reports', path: '/admin/reports', icon: FileText },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  const facultyNav = [
    { name: 'Faculty Dashboard', path: '/faculty', icon: LayoutDashboard },
    { name: 'My Invigilation Duties', path: '/faculty/duties', icon: ShieldCheck },
    { name: 'Availability Declared', path: '/faculty/availability', icon: CalendarCheck },
    { name: 'Duty Schedule PDF', path: '/faculty/reports', icon: FileText },
  ];

  const studentNav = [
    { name: 'Student Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'My Exam Timetable', path: '/student/timetable', icon: Calendar },
    { name: 'Backlog Exams', path: '/student/backlog', icon: RotateCcw },
    { name: 'Admit Card Download', path: '/student/admit-card', icon: Award },
  ];

  let items = adminNav;
  if (user?.role === 'faculty') items = facultyNav;
  if (user?.role === 'student') items = studentNav;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
          {user?.role?.toUpperCase()} PORTAL
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/faculty' || item.path === '/student'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">Intelligent Engine</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Google OR-Tools CP-SAT</p>
          <div className="mt-1 flex items-center gap-1.5 text-emerald-400 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Optimization Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

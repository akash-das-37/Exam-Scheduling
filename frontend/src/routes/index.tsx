import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import { AdminLayout } from '../layouts/AdminLayout';
import { FacultyLayout } from '../layouts/FacultyLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { LandingPage } from '../pages/LandingPage';

// Admin Pages
import { Dashboard } from '../pages/admin/Dashboard';
import { TimetableScheduler } from '../pages/admin/TimetableScheduler';
import { ConflictManagement } from '../pages/admin/ConflictManagement';
import { AcademicManagement } from '../pages/admin/AcademicManagement';
import { StudentsManagement } from '../pages/admin/StudentsManagement';
import { FacultyManagement } from '../pages/admin/FacultyManagement';
import { SubjectManagement } from '../pages/admin/SubjectManagement';
import { ExamManagement } from '../pages/admin/ExamManagement';
import { BacklogManagement } from '../pages/admin/BacklogManagement';
import { CalendarSlots } from '../pages/admin/CalendarSlots';
import { RoomManagement } from '../pages/admin/RoomManagement';
import { InvigilationManagement } from '../pages/admin/InvigilationManagement';
import { Reports } from '../pages/admin/Reports';
import { Settings } from '../pages/admin/Settings';

// Portals
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { FacultyDashboard } from '../pages/faculty/FacultyDashboard';

export const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getDefaultRedirect = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'faculty') return '/faculty';
    return '/student';
  };

  return (
    <Routes>
      {/* Front Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="scheduler" element={<TimetableScheduler />} />
        <Route path="conflicts" element={<ConflictManagement />} />
        <Route path="academic" element={<AcademicManagement />} />
        <Route path="students" element={<StudentsManagement />} />
        <Route path="faculty" element={<FacultyManagement />} />
        <Route path="subjects" element={<SubjectManagement />} />
        <Route path="exams" element={<ExamManagement />} />
        <Route path="backlog" element={<BacklogManagement />} />
        <Route path="calendar" element={<CalendarSlots />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="invigilation" element={<InvigilationManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Faculty routes */}
      <Route path="/faculty" element={<FacultyLayout />}>
        <Route index element={<FacultyDashboard />} />
        <Route path="duties" element={<FacultyDashboard />} />
        <Route path="availability" element={<FacultyDashboard />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentDashboard />} />
        <Route path="timetable" element={<StudentDashboard />} />
        <Route path="backlog" element={<StudentDashboard />} />
        <Route path="admit-card" element={<StudentDashboard />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
};

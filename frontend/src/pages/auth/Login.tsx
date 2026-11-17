import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff,
  AlertCircle, CheckCircle2, ArrowLeft, ChevronDown
} from 'lucide-react';

type RoleKey = 'student' | 'faculty' | 'data_entry' | 'admin';

interface RoleConfig {
  label: string;
  baseRole: 'student' | 'faculty' | 'admin';
  defaultEmail: string;
  defaultPass: string;
  info: string | null;
}

const ROLE_CONFIGS: Record<RoleKey, RoleConfig> = {
  student: {
    label: 'Student',
    baseRole: 'student',
    defaultEmail: 'student.cse1@jisce.ac.in',
    defaultPass: 'student123',
    info: 'If you are a new student then your ID No. is your password.'
  },
  faculty: {
    label: 'Faculty',
    baseRole: 'faculty',
    defaultEmail: 'faculty.cse1@jisce.ac.in',
    defaultPass: 'faculty123',
    info: 'email id and password is shared by admin'
  },
  data_entry: {
    label: 'Data Entry',
    baseRole: 'admin',
    defaultEmail: 'admin@jisce.ac.in',
    defaultPass: 'admin123',
    info: 'email id and password is shared by admin'
  },
  admin: {
    label: 'Admin',
    baseRole: 'admin',
    defaultEmail: 'admin@jisce.ac.in',
    defaultPass: 'admin123',
    info: null
  }
};

export const Login: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('student');
  const [email, setEmail] = useState('student.cse1@jisce.ac.in');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (role: RoleKey) => {
    setSelectedRole(role);
    setError(null);

    const config = ROLE_CONFIGS[role];
    if (config) {
      setEmail(config.defaultEmail);
      setPassword(config.defaultPass);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const roleConfig = ROLE_CONFIGS[selectedRole];

      let authEmail = email.trim();
      if (!authEmail.includes('@')) {
        if (roleConfig.baseRole === 'student') authEmail = `${authEmail.toLowerCase()}@jisce.ac.in`;
        else if (roleConfig.baseRole === 'faculty') authEmail = `faculty.${authEmail.toLowerCase()}@jisce.ac.in`;
        else authEmail = `admin@jisce.ac.in`;
      }

      const user = await login(authEmail, password);
      setSuccess(`Welcome back, ${user.full_name || user.email}! Redirecting...`);
      setTimeout(() => {
        if (roleConfig.baseRole === 'admin' || user.role === 'admin') navigate('/admin');
        else if (roleConfig.baseRole === 'faculty' || user.role === 'faculty') navigate('/faculty');
        else navigate('/student');
      }, 350);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = ROLE_CONFIGS[selectedRole];

  return (
    <div className="min-h-screen w-full bg-[#0d2668] bg-gradient-to-br from-[#0a1f54] via-[#0e2c7a] to-[#143d9e] flex flex-col justify-between items-center p-4 sm:p-6 sm:py-8 relative overflow-x-hidden font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Bar with Back Button */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4 z-10">
        <Link to="/" className="flex items-center gap-2 group text-white">
          <GraduationCap className="w-6 h-6 text-cyan-300 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg tracking-tight">ExamScheduler</span>
        </Link>

        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/15"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-300" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Centered Clean Login Card */}
      <div className="w-full max-w-lg my-auto relative z-10">
        <div className="w-full bg-white rounded-3xl sm:rounded-[2.25rem] p-7 sm:p-10 shadow-2xl shadow-blue-950/50 text-slate-900 relative">
          
          {/* Card Header */}
          <div className="text-center space-y-1 mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0c1e4c] tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Sign in to continue to ExamScheduler
            </p>
            <div className="w-14 h-0.5 bg-sky-400 mx-auto mt-2 rounded-full" />
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* USER SIGN IN - Option Selector Dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor="role-select"
                className="block text-center text-xs font-bold text-slate-700 tracking-wider uppercase"
              >
                USER SIGN IN
              </label>
              <div className="relative">
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value as RoleKey)}
                  className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm appearance-none cursor-pointer transition-colors"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="data_entry">Data Entry</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Input 1: Email / ID No. */}
            <div className="space-y-1">
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all">
                <div className="w-7 h-7 rounded-lg bg-slate-200/70 flex items-center justify-center text-slate-500 shrink-0 mr-3">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email / ID No."
                  className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none font-medium"
                  required
                />
              </div>
            </div>

            {/* Input 2: Password */}
            <div className="space-y-1">
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all">
                <div className="w-7 h-7 rounded-lg bg-slate-200/70 flex items-center justify-center text-slate-500 shrink-0 mr-3">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1d63ed] hover:bg-blue-600 active:scale-[0.99] text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-70 group cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Information Callout Banner (Shown for Student, Faculty, and Data Entry; Hidden for Admin) */}
            {currentConfig?.info ? (
              <div className="bg-blue-50/90 border border-blue-100 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-blue-900 font-medium mt-4">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-[11px]">
                  i
                </div>
                <p className="leading-snug">
                  {currentConfig.info}
                </p>
              </div>
            ) : null}
          </form>
        </div>
      </div>

      {/* Subtle Footer Bar */}
      <footer className="w-full py-3 px-6 text-center text-xs text-slate-300/80 border-t border-white/10 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-[11px]">
          <GraduationCap className="w-3.5 h-3.5 text-cyan-300" />
          <span className="font-semibold text-white">ExamScheduler</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">JIS College of Engineering</span>
        </div>
        <p className="italic text-[10px] text-slate-300">
          Smarter Scheduling. A Better Academic Experience.
        </p>
      </footer>
    </div>
  );
};

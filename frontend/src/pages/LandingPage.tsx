import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, Home, User, Calendar,
  Zap, ShieldCheck, Users, Bell, X, CheckCircle2, ArrowRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

  const handleOpenAuth = (tab: 'signin' | 'signup' = 'signin') => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
      return;
    }
    navigate(`/login?mode=${tab}`);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1532] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#09142f]/90 backdrop-blur-md px-6 sm:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <GraduationCap className="w-6 h-6 text-white group-hover:scale-105 transition-transform" />
            <span className="text-lg font-bold text-white tracking-tight">ExamScheduler</span>
          </div>

          {/* Nav Links: Home, About, Features, Login, Register */}
          <nav className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1.5 text-white font-medium relative py-1 hover:text-cyan-300 transition-colors"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span>Home</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            </button>

            <button
              type="button"
              onClick={() => setShowLearnMoreModal(true)}
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              About
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              Features
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => {
                  if (user.role === 'admin') navigate('/admin');
                  else if (user.role === 'faculty') navigate('/faculty');
                  else navigate('/student');
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-1.5 rounded-full shadow-md transition-all flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Dashboard ({user.role})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenAuth('signin')}
                className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors font-medium py-1 px-2.5 rounded-lg hover:bg-white/5"
              >
                <User className="w-4 h-4 text-slate-300" />
                <span>Login</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-24 sm:pb-32 px-6 sm:px-12 flex-1 flex items-center bg-gradient-to-b from-[#091533] via-[#0b1c46] to-[#0e2762]">
        {/* Soft Ambient Light Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[350px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-20">
          <div className="max-w-4xl space-y-6 text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-xs sm:text-sm font-medium text-cyan-300 shadow-sm backdrop-blur-md">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Smart • Efficient • Conflict-Free</span>
            </div>

            {/* Main Headline (Significantly Increased Size per request) */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[4.75rem] font-black text-white tracking-tight leading-[1.08] drop-shadow-lg">
              Intelligent Exam <br />
              Timetable Scheduling <br />
              <span className="text-cyan-400 drop-shadow-md">System</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-200 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
              Automate and optimize your college examination schedule with ease. Prevent clashes, manage resources, and ensure a smooth examination process.
            </p>

            {/* CTA Button: Get Started */}
            <div className="pt-3 flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleOpenAuth('signin')}
                className="bg-[#2563eb] hover:bg-blue-500 active:scale-[0.98] text-white font-semibold px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-600/40 flex items-center gap-2.5 text-sm sm:text-base transition-all group"
              >
                <Calendar className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
                <span>Get Started</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Curved SVG Wave Transition to White Cards Section */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg
            viewBox="0 0 1440 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative block w-full h-12 sm:h-16 lg:h-20"
            preserveAspectRatio="none"
          >
            <path
              d="M0,45 C380,85 720,15 1060,50 C1220,65 1350,38 1440,25 L1440,90 L0,90 Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </section>

      {/* 3. FOUR FEATURE CARDS (Matching layout and colors) */}
      <section id="features" className="bg-[#f8fafc] text-slate-900 pt-2 pb-10 sm:pb-14 px-6 sm:px-12 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Automated Scheduling */}
            <div
              onClick={() => handleOpenAuth('signin')}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6 fill-blue-600/20" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Automated Scheduling</h3>
                <p className="text-xs text-slate-500 leading-snug">
                  Generate optimized timetables with advanced algorithms.
                </p>
              </div>
            </div>

            {/* Card 2: Conflict Detection */}
            <div
              onClick={() => handleOpenAuth('signin')}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 fill-emerald-600/20" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Conflict Detection</h3>
                <p className="text-xs text-slate-500 leading-snug">
                  Avoid clashes in exams, rooms and faculty.
                </p>
              </div>
            </div>

            {/* Card 3: Smart Resource Management */}
            <div
              onClick={() => handleOpenAuth('signin')}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6 fill-purple-600/20" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Smart Resource Management</h3>
                <p className="text-xs text-slate-500 leading-snug">
                  Efficiently allocate rooms and invigilators.
                </p>
              </div>
            </div>

            {/* Card 4: Instant Notifications */}
            <div
              onClick={() => handleOpenAuth('signin')}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Bell className="w-6 h-6 fill-amber-600/20" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Instant Notifications</h3>
                <p className="text-xs text-slate-500 leading-snug">
                  Keep everyone informed with real-time alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER BAR (Matching bottom of image) */}
      <footer className="bg-[#060f22] border-t border-blue-950/60 py-3.5 px-6 sm:px-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-white" />
            <span className="font-semibold text-white tracking-tight">ExamScheduler</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">JIS College of Engineering</span>
          </div>

          <p className="italic text-slate-400 tracking-wide text-[11px] sm:text-xs">
            Smarter Scheduling. A Better Academic Experience.
          </p>
        </div>
      </footer>

      {/* LEARN MORE INTERACTIVE MODAL */}
      {showLearnMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1739] border border-blue-500/30 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowLearnMoreModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 text-cyan-300 text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5" />
              <span>JIS College of Engineering (JISCE) Exam Cell</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Autonomous Exam Timetable Engine
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Powered by advanced deterministic constraint solvers tailored for JISCE. Eliminates scheduling conflicts, balances faculty workload, and synthesizes conflict-free timetables in seconds.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Zero Overlaps:</strong> Guarantees no student has two exams in the same slot.</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Smart Seating:</strong> Automatic zigzag room seat allocation to maintain exam integrity.</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Faculty Invigilation:</strong> Balanced duty distribution with automated swap safeguards.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  setShowLearnMoreModal(false);
                  handleOpenAuth('signin');
                }}
                className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <span>Enter Campus Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowLearnMoreModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-medium text-xs sm:text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

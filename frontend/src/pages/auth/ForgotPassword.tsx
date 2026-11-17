import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import api from '../../services/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      if (data.simulated_reset_token) {
        setTokenInfo(data.simulated_reset_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dispatch reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0b1739]/90 backdrop-blur-xl rounded-3xl border border-blue-400/20 shadow-2xl p-6 sm:p-8 text-slate-100 max-w-md mx-auto transition-all">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Reset Password</h2>
        <p className="text-xs text-cyan-300 font-medium mt-1">
          Enter your JIS College of Engineering email address to recover credentials.
        </p>
      </div>

      {submitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">
            Reset Instructions Dispatched
          </p>
          <p className="text-xs text-slate-300">
            If an account exists with <span className="font-semibold text-cyan-300">{email}</span>, a secure recovery token has been generated.
          </p>
          {tokenInfo && (
            <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-900/50 text-left">
              <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
                Simulated Recovery Token
              </span>
              <p className="text-[11px] font-mono text-slate-300 break-all select-all">
                {tokenInfo}
              </p>
            </div>
          )}
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline pt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@jisce.ac.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-500/30 bg-[#0d1f47]/60 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Send Recovery Link</span>
            )}
          </button>

          <div className="text-center pt-2">
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </a>
          </div>
        </form>
      )}
    </div>
  );
};

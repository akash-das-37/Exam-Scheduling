import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 backdrop-blur-xl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reset Password</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your institutional email address to recover your account credentials.
        </p>
      </div>

      {submitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Reset Instructions Dispatched
          </p>
          <p className="text-xs text-slate-500">
            If an account exists with <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>, a secure recovery link has been generated.
          </p>
          {tokenInfo && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Simulated Recovery Token
              </span>
              <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                {tokenInfo}
              </p>
            </div>
          )}
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@apex.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            {loading ? 'Dispatching...' : 'Send Reset Link'}
          </button>
          <div className="text-center pt-2">
            <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </a>
          </div>
        </form>
      )}
    </div>
  );
};

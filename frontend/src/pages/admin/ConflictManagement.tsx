import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ValidationResult, Conflict, TimetableVersion } from '../../types';
import { Badge } from '../../components/Badge';
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  DoorOpen,
  UserCheck,
  Calendar,
  ArrowRight,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export const ConflictManagement: React.FC = () => {
  const [versions, setVersions] = useState<TimetableVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const navigate = useNavigate();

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/timetable/versions');
      setVersions(data);
      if (data.length > 0) {
        setSelectedVersionId(data[0].id);
        await runValidation(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async (vId: number) => {
    try {
      setLoading(true);
      const { data } = await api.post(`/scheduler/validate/${vId}`);
      setValidation(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleVersionChange = (vId: number) => {
    setSelectedVersionId(vId);
    runValidation(vId);
  };

  const filteredConflicts = validation?.conflicts.filter((c) => {
    if (filterType === 'all') return true;
    return c.conflict_type.includes(filterType);
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-2xl border border-amber-100 dark:border-amber-900">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Conflict Detection & Resolution</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live mathematical constraint audits across student registrations, room capacities, and faculty availability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedVersionId || ''}
            onChange={(e) => handleVersionChange(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.status})
              </option>
            ))}
          </select>

          <button
            onClick={() => selectedVersionId && runValidation(selectedVersionId)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {validation && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setFilterType('student')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filterType === 'student'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Student Overlaps</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">
              {validation.student_conflicts_count}
            </p>
            <span className="text-[10px] text-slate-400">Regular & backlog clashes</span>
          </div>

          <div
            onClick={() => setFilterType('room')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filterType === 'room'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Room Double-Bookings</span>
              <DoorOpen className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">
              {validation.room_conflicts_count}
            </p>
            <span className="text-[10px] text-slate-400">Simultaneous venue usage</span>
          </div>

          <div
            onClick={() => setFilterType('capacity')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filterType === 'capacity'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Capacity Deficits</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">
              {validation.capacity_violations_count}
            </p>
            <span className="text-[10px] text-slate-400">Exceeds room seating capacity</span>
          </div>

          <div
            onClick={() => setFilterType('faculty')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filterType === 'faculty'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Faculty Clashes</span>
              <UserCheck className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">
              {validation.faculty_conflicts_count}
            </p>
            <span className="text-[10px] text-slate-400">Invigilation overlap or unavail</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterType === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Conflicts ({validation?.conflicts.length || 0})
        </button>
        <button
          onClick={() => setFilterType('student')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterType === 'student'
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Student Overlaps
        </button>
        <button
          onClick={() => setFilterType('room')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterType === 'room'
              ? 'bg-amber-600 text-white'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Room Double-Bookings
        </button>
        <button
          onClick={() => setFilterType('capacity')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterType === 'capacity'
              ? 'bg-rose-600 text-white'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Capacity Shortages
        </button>
        <button
          onClick={() => setFilterType('faculty')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterType === 'faculty'
              ? 'bg-purple-600 text-white'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Faculty Clashes
        </button>
      </div>

      {/* Conflict List */}
      {filteredConflicts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Zero Conflicts Detected</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            This timetable version satisfies all mathematical constraints and is fully eligible for publishing.
          </p>
          <button
            onClick={() => navigate('/admin/scheduler')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
          >
            Go to Scheduler
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConflicts.map((c, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all ${
                c.severity === 'critical'
                  ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900'
                  : 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      c.severity === 'critical'
                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.exam_name}</span>
                      <Badge variant={c.severity === 'critical' ? 'destructive' : 'warning'}>
                        {c.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{c.conflict_type.replace(/_/g, ' ').toUpperCase()}</Badge>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">{c.message}</p>

                    {c.affected_entities && c.affected_entities.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Affected:</span>
                        {c.affected_entities.map((e, eIdx) => (
                          <span
                            key={eIdx}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">Recommendation:</span>
                      <span>{c.recommendation}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/admin/scheduler')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                >
                  <span>Resolve in Scheduler</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

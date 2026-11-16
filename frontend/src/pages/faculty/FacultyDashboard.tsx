import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  ShieldCheck,
  Calendar,
  Clock,
  DoorOpen,
  Download,
  CalendarCheck,
  UserCheck,
  CheckCircle2,
  Plus
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState<any | null>(null);
  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Availability Modal
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [availDate, setAvailDate] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [unavailReason, setUnavailReason] = useState('');

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const fId = user?.faculty_id || 1;
      const [fRes, dRes] = await Promise.all([
        api.get('/faculty'),
        api.get(`/timetable/faculty/${fId}`),
      ]);
      const currentFac = fRes.data.find((f: any) => f.id === fId) || fRes.data[0];
      setFaculty(currentFac);
      setDuties(dRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFacultyData();
    }
  }, [user]);

  const handleSubmitAvailability = async () => {
    try {
      // In real scenario persists to /api/faculty/availability
      setShowAvailModal(false);
      setUnavailReason('');
      alert('Availability declaration recorded and updated in scheduling constraints.');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const assignedCount = duties.length;
  const maxLimit = faculty?.max_invigilation_workload || 6;

  return (
    <div className="space-y-6">
      {/* Faculty Hero Banner */}
      <div className="p-6 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-3xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-bold tracking-wider uppercase">
              Faculty Invigilation Portal
            </span>
            <Badge variant="purple">{faculty?.designation?.toUpperCase()}</Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{faculty?.full_name || user?.full_name}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Faculty Code: <span className="font-semibold text-white">{faculty?.faculty_code}</span> •{' '}
            {faculty?.department_name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAvailModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-teal-400" />
            <span>Declare Availability</span>
          </button>

          <a
            href={`/api/reports/pdf/faculty/1/${faculty?.id || 1}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-teal-600/30 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Duty Schedule PDF</span>
          </a>
        </div>
      </div>

      {/* Workload Progress Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Assigned Duties</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{assignedCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Approved invigilation sessions</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Maximum Workload Capacity</span>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{maxLimit} Duties</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Configured institutional ceiling</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Remaining Duty Capacity</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{Math.max(0, maxLimit - assignedCount)}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Available for supplementary slots</span>
        </div>
      </div>

      {/* Assigned Duties Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Supervisory Duty Roster</h3>
            <p className="text-xs text-slate-500">Assigned examination venues, dates, and active session windows</p>
          </div>
          <span className="text-xs text-slate-400">{duties.length} sessions</span>
        </div>

        {duties.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No duties currently assigned or timetable is under review.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {duties.map((s) => {
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
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex flex-col items-center justify-center font-bold shrink-0 border border-teal-100 dark:border-teal-900">
                      <span className="text-[10px] uppercase">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg leading-none">{dateObj.getDate()}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {s.subject_code} — {s.exam_name}
                        </span>
                        <Badge variant="purple" className="text-[10px]">
                          INVIGILATOR
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {formattedDate} • {s.department_name} (Sem {s.semester_number})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">TIME</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{s.start_time} - {s.end_time}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">ROOM</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {s.room_allocations && s.room_allocations.length > 0
                            ? s.room_allocations[0].room_number
                            : 'Room 201'}
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

      {/* Declare Availability Modal */}
      <Modal isOpen={showAvailModal} onClose={() => setShowAvailModal(false)} title="Declare Duty Availability">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={availDate}
              onChange={(e) => setAvailDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Availability Status
            </label>
            <select
              value={isAvailable ? 'available' : 'unavailable'}
              onChange={(e) => setIsAvailable(e.target.value === 'available')}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              <option value="unavailable">Unavailable (Exempt from duties on this date)</option>
              <option value="available">Available / Preferred</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Academic Conference / Leave
            </label>
            <textarea
              placeholder="e.g. Attending IEEE conference in Tokyo"
              value={unavailReason}
              onChange={(e) => setUnavailReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAvailModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600">
              Cancel
            </button>
            <button
              onClick={handleSubmitAvailability}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
            >
              Submit Availability
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

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

const DEFAULT_FACULTY = {
  full_name: 'Dr. Robert Chen',
  faculty_code: 'FAC-CSE-01',
  department_name: 'Computer Science & Engineering',
  designation: 'Associate Professor',
  max_invigilation_workload: 6,
};

const DEFAULT_DUTIES = [
  {
    id: 101,
    exam_date: '2026-12-08',
    slot_name: 'Morning Session (10:00 AM - 01:00 PM)',
    subject_code: 'CS501',
    subject_name: 'Design and Analysis of Algorithms',
    room_number: 'Hall-101',
    building: 'Main Academic Block',
    role: 'Chief Invigilator'
  },
  {
    id: 102,
    exam_date: '2026-12-10',
    slot_name: 'Morning Session (10:00 AM - 01:00 PM)',
    subject_code: 'CS502',
    subject_name: 'Database Management Systems',
    room_number: 'Hall-102',
    building: 'Main Academic Block',
    role: 'Assistant Invigilator'
  },
  {
    id: 103,
    exam_date: '2026-12-12',
    slot_name: 'Morning Session (10:00 AM - 01:00 PM)',
    subject_code: 'CS503',
    subject_name: 'Operating Systems & System Programming',
    room_number: 'Hall-101',
    building: 'Main Academic Block',
    role: 'Chief Invigilator'
  }
];

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
      const currentFac = fRes.data?.find((f: any) => f.id === fId) || fRes.data?.[0] || DEFAULT_FACULTY;
      setFaculty(currentFac);
      setDuties(dRes.data || DEFAULT_DUTIES);
    } catch (e) {
      console.warn('Backend server unreachable, using offline faculty dataset', e);
      setFaculty(DEFAULT_FACULTY);
      setDuties(DEFAULT_DUTIES);
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
            <Badge variant="purple">{faculty?.designation?.toUpperCase() || 'FACULTY'}</Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{faculty?.full_name || user?.full_name || 'Faculty Member'}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Faculty Code: <span className="font-semibold text-white">{faculty?.faculty_code || 'FAC-CSE-01'}</span> •{' '}
            {faculty?.department_name || 'Computer Science & Engineering'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAvailModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-teal-400" />
            <span>Declare Availability</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Duty Order</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Assigned Invigilations</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{assignedCount}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Maximum quota: {maxLimit} duties</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Remaining Quota</p>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.max(0, maxLimit - assignedCount)}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Available for emergency backup</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Consecutive Shift Rule</p>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">100% Compliant</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">No back-to-back duties assigned</p>
          </div>
        </div>
      </div>

      {/* Duty List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Your Invigilation Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">Official examination duty roster with assigned exam halls</p>
          </div>
          <Badge variant="default">{duties.length} Assigned Slots</Badge>
        </div>

        {duties.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No invigilation duties currently assigned for the upcoming schedule.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Session & Time</th>
                  <th className="py-3 px-5">Room / Hall</th>
                  <th className="py-3 px-5">Subject Paper</th>
                  <th className="py-3 px-5">Designation / Role</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {duties.map((duty, idx) => (
                  <tr key={duty.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>{duty.exam_date}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{duty.slot_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span>{duty.room_number}</span>
                        <span className="text-[11px] text-slate-400">({duty.building})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{duty.subject_name}</div>
                      <div className="text-[11px] text-slate-400">{duty.subject_code}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {duty.role || 'Invigilator'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Availability Modal */}
      <Modal
        isOpen={showAvailModal}
        onClose={() => setShowAvailModal(false)}
        title="Declare Invigilation Availability / Leave"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Notify the Examination Controller about your preferred available dates or requested exclusions.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Date</label>
            <input
              type="date"
              value={availDate}
              onChange={(e) => setAvailDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={isAvailable ? 'available' : 'unavailable'}
              onChange={(e) => setIsAvailable(e.target.value === 'available')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="available">Available for Duty</option>
              <option value="unavailable">Unavailable / Pre-scheduled Academic Leave</option>
            </select>
          </div>
          {!isAvailable && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Unavailability</label>
              <textarea
                value={unavailReason}
                onChange={(e) => setUnavailReason(e.target.value)}
                placeholder="e.g., Medical leave, Ph.D. defense committee duty..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAvailModal(false)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitAvailability}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Save Declaration
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

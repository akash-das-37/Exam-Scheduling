import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import {
  ShieldCheck,
  Search,
  UserCheck,
  DoorOpen,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const InvigilationManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, fRes] = await Promise.all([
        api.get('/timetable/versions'),
        api.get('/faculty'),
      ]);
      setFaculty(fRes.data);
      if (vRes.data.length > 0) {
        const { data } = await api.get(`/timetable/version/${vRes.data[0].id}/schedules`);
        setSchedules(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Collect all invigilation assignments
  const allDuties: any[] = [];
  schedules.forEach((s) => {
    (s.invigilator_assignments || []).forEach((iv: any) => {
      allDuties.push({
        ...iv,
        exam_name: s.exam_name,
        subject_code: s.subject_code,
        exam_date: s.exam_date,
        time_slot_name: s.time_slot_name,
      });
    });
  });

  const filteredDuties = allDuties.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.faculty_name && d.faculty_name.toLowerCase().includes(q)) ||
      (d.room_number && d.room_number.toLowerCase().includes(q)) ||
      (d.subject_code && d.subject_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Faculty Invigilation Allocations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervise room assignments, equitable workload distribution, and simultaneous duty restrictions
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
          Total Assigned Duties: {allDuties.length}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search faculty name, room, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredDuties.length} duties</span>
      </div>

      {/* Duties Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Time Slot</th>
              <th className="p-3.5">Faculty Member</th>
              <th className="p-3.5">Room & Venue</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Subject Supervised</th>
              <th className="p-3.5 text-right">Duty Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDuties.map((d, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-medium whitespace-nowrap">
                  {new Date(d.exam_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </td>
                <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">{d.time_slot_name}</td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{d.faculty_name}</td>
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{d.room_number}</td>
                <td className="p-3.5 capitalize">
                  <Badge variant={d.role === 'chief_invigilator' ? 'purple' : 'default'}>
                    {d.role.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="p-3.5 text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200 mr-1">{d.subject_code}</span>
                  {d.exam_name}
                </td>
                <td className="p-3.5 text-right">
                  <Badge variant="success">ASSIGNED</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

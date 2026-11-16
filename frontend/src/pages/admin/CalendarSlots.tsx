import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TimeSlot } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Clock,
  Calendar as CalendarIcon,
  Plus,
  Sun,
  Sunset,
  Moon,
  CheckCircle2
} from 'lucide-react';

export const CalendarSlots: React.FC = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotName, setSlotName] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('12:30');
  const [sessionType, setSessionType] = useState('morning');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tsRes, pRes] = await Promise.all([
        api.get('/time-slots'),
        api.get('/exam-periods'),
      ]);
      setTimeSlots(tsRes.data);
      setPeriods(pRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSlot = async () => {
    try {
      await api.post('/time-slots', {
        name: slotName || `${sessionType.toUpperCase()} (${startTime} - ${endTime})`,
        start_time: startTime,
        end_time: endTime,
        session_type: sessionType,
        is_active: true,
      });
      setShowSlotModal(false);
      setSlotName('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create time slot');
    }
  };

  const getSlotIcon = (type: string) => {
    if (type === 'morning') return <Sun className="w-4 h-4 text-amber-500" />;
    if (type === 'afternoon') return <Sunset className="w-4 h-4 text-orange-500" />;
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Calendar & Time Slots</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure examination period dates, active weekdays, holidays and daily session windows
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSlotModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Time Slot</span>
        </button>
      </div>

      {/* Active Exam Period Card */}
      {periods.map((p) => (
        <div key={p.id} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
            </div>
            <Badge variant="success">ACTIVE PERIOD</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Calendar Window</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {p.start_date} to {p.end_date}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Working Days</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {Array.isArray(p.available_days) ? p.available_days.join(', ') : 'Mon-Sat'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Excluded Holidays</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {Array.isArray(p.holidays) && p.holidays.length > 0 ? p.holidays.join(', ') : 'None declared'}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Time Slots Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Configured Daily Time Slots</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {timeSlots.map((ts) => (
            <div
              key={ts.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getSlotIcon(ts.session_type)}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {ts.session_type} Session
                    </span>
                  </div>
                  <Badge variant="outline">ACTIVE</Badge>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{ts.name}</h4>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 font-mono">
                  {ts.start_time} — {ts.end_time}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                Standard Duration: 3 Hours
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Slot Modal */}
      <Modal isOpen={showSlotModal} onClose={() => setShowSlotModal(false)} title="Add Examination Time Slot">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Time Slot Label
            </label>
            <input
              type="text"
              placeholder="e.g. Morning Session (09:30 - 12:30)"
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Session Category
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowSlotModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600">
              Cancel
            </button>
            <button
              onClick={handleCreateSlot}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Save Time Slot
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

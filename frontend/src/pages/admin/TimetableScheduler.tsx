import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  TimetableVersion,
  ExamSchedule,
  TimeSlot,
  RecommendedSlot,
  ValidationResult,
  Conflict,
  Department
} from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Filter,
  RefreshCw,
  Clock,
  DoorOpen,
  UserCheck,
  Search,
  Sliders,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const TimetableScheduler: React.FC = () => {
  const [versions, setVersions] = useState<TimetableVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'table' | 'department'>('calendar');

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Actions
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState<boolean>(false);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [activeSchedule, setActiveSchedule] = useState<ExamSchedule | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedSlot[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);

  // Edit Schedule form state
  const [editDate, setEditDate] = useState<string>('');
  const [editSlotId, setEditSlotId] = useState<number>(1);
  const [editReason, setEditReason] = useState<string>('');

  // Generator form state
  const [genSolveTime, setGenSolveTime] = useState<number>(30);
  const [genGapWeight, setGenGapWeight] = useState<number>(30);
  const [genBalanceWeight, setGenBalanceWeight] = useState<number>(20);
  const [generating, setGenerating] = useState<boolean>(false);

  // Validation
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState<boolean>(false);

  // Selected for multi-regen
  const [selectedExamIds, setSelectedExamIds] = useState<number[]>([]);
  const [regenerating, setRegenerating] = useState<boolean>(false);

  // Load versions & metadata
  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, slotsRes, deptRes] = await Promise.all([
        api.get('/timetable/versions'),
        api.get('/time-slots'),
        api.get('/departments'),
      ]);
      setVersions(vRes.data);
      setTimeSlots(slotsRes.data);
      setDepartments(deptRes.data);

      if (vRes.data.length > 0) {
        const active = vRes.data[0];
        setSelectedVersionId(active.id);
        await loadSchedules(active.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async (vId: number) => {
    try {
      const { data } = await api.get(`/timetable/version/${vId}/schedules`);
      setSchedules(data);
      runValidation(vId);
    } catch (err) {
      console.error(err);
    }
  };

  const runValidation = async (vId: number) => {
    try {
      setValidating(true);
      const { data } = await api.post(`/scheduler/validate/${vId}`);
      setValidationResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVersionChange = (vId: number) => {
    setSelectedVersionId(vId);
    setSelectedExamIds([]);
    loadSchedules(vId);
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const { data } = await api.post('/scheduler/generate', {
        academic_session_id: 1,
        max_solve_time_seconds: genSolveTime,
        weights: {
          min_student_gap_days: genGapWeight,
          balance_daily_load: genBalanceWeight,
        },
      });
      setShowGenerateModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectExamForRegen = (examId: number) => {
    if (selectedExamIds.includes(examId)) {
      setSelectedExamIds(selectedExamIds.filter((id) => id !== examId));
    } else {
      setSelectedExamIds([...selectedExamIds, examId]);
    }
  };

  const handleRegenerateSelected = async () => {
    if (!selectedVersionId || selectedExamIds.length === 0) return;
    try {
      setRegenerating(true);
      const { data } = await api.post('/scheduler/regenerate-selected', {
        timetable_version_id: selectedVersionId,
        exam_ids: selectedExamIds,
        max_solve_time_seconds: 15,
      });
      if (data.success) {
        setSelectedExamIds([]);
        await loadSchedules(selectedVersionId);
      } else {
        alert(data.details?.error || 'Could not find clash-free slot with other exams fixed.');
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  const handleOpenEditSchedule = async (sched: ExamSchedule) => {
    setActiveSchedule(sched);
    setEditDate(sched.exam_date);
    setEditSlotId(sched.time_slot_id);
    setEditReason('');
    setShowEditScheduleModal(true);

    // Fetch recommendations for this exam
    if (selectedVersionId) {
      try {
        setLoadingRecommendations(true);
        const { data } = await api.post('/scheduler/recommend-slots', {
          timetable_version_id: selectedVersionId,
          exam_id: sched.exam_id,
        });
        setRecommendations(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRecommendations(false);
      }
    }
  };

  const handleSaveScheduleEdit = async () => {
    if (!activeSchedule) return;
    try {
      await api.put(`/timetable/schedule/${activeSchedule.id}`, {
        exam_date: editDate,
        time_slot_id: editSlotId,
        reason: editReason || 'Manual adjustment via interactive scheduler',
      });
      setShowEditScheduleModal(false);
      if (selectedVersionId) {
        await loadSchedules(selectedVersionId);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update schedule');
    }
  };

  const handlePublish = async () => {
    if (!selectedVersionId) return;
    try {
      await api.post(`/timetable/publish/${selectedVersionId}`, {
        reason: 'Approved by Exam Board',
      });
      setShowPublishModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Publication rejected due to validation failure');
    }
  };

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    if (selectedDept !== 'all' && s.department_name !== selectedDept) return false;
    if (selectedType !== 'all' && s.exam_type !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.exam_name?.toLowerCase().includes(q);
      const matchCode = s.subject_code?.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  // Unique dates for calendar grid
  const uniqueDates = Array.from(new Set(schedules.map((s) => s.exam_date))).sort();
  const currentVersion = versions.find((v) => v.id === selectedVersionId);

  return (
    <div className="space-y-6">
      {/* Top Header & Version Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Timetable Scheduler & Editor</h2>
              {currentVersion && (
                <Badge
                  variant={
                    currentVersion.status === 'published'
                      ? 'success'
                      : currentVersion.status === 'validated'
                      ? 'purple'
                      : 'warning'
                  }
                >
                  {currentVersion.status.toUpperCase()}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hybrid Optimization: Auto-solver with drag-and-drop manual editing and conflict detection
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Version Selector */}
          <select
            value={selectedVersionId || ''}
            onChange={(e) => handleVersionChange(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.status})
              </option>
            ))}
          </select>

          {/* Regenerate Selected Button (active if any selected) */}
          {selectedExamIds.length > 0 && (
            <button
              onClick={handleRegenerateSelected}
              disabled={regenerating}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate ({selectedExamIds.length})</span>
            </button>
          )}

          {/* Generate Button */}
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate New</span>
          </button>

          {/* Publish Button */}
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={!validationResult?.is_valid}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Timetable</span>
          </button>
        </div>
      </div>

      {/* Validation Status Strip */}
      {validationResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            validationResult.is_valid
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300'
              : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {validationResult.is_valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold">
                {validationResult.is_valid
                  ? 'Mathematical Validation Passed: 0 Clashes'
                  : `Validation Alert: ${validationResult.conflicts.length} Constraint Violations Detected`}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {validationResult.scheduled_exams} of {validationResult.total_exams} exams scheduled •{' '}
                {validationResult.student_conflicts_count} student clashes •{' '}
                {validationResult.room_conflicts_count} room double-bookings •{' '}
                {validationResult.faculty_conflicts_count} faculty conflicts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedVersionId && (
              <a
                href={`/api/reports/pdf/master/${selectedVersionId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Schedule</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Filter and View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search exam or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none w-48"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Exam Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Exam Types</option>
            <option value="regular">Regular</option>
            <option value="backlog">Backlog</option>
            <option value="practical">Practical</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Calendar Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Table Roster
          </button>
        </div>
      </div>

      {/* Main Timetable View */}
      {viewMode === 'calendar' ? (
        /* Calendar Grid View */
        <div className="space-y-4">
          {uniqueDates.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No scheduled exams found</p>
              <p className="text-xs text-slate-500 mt-1">Generate a schedule using the CP-SAT engine above.</p>
            </div>
          ) : (
            uniqueDates.map((dateStr) => {
              const daySchedules = filteredSchedules.filter((s) => s.exam_date === dateStr);
              if (daySchedules.length === 0) return null;
              const dateObj = new Date(dateStr);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={dateStr}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                >
                  <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{dayName}</span>
                      <span className="text-xs text-slate-500 font-medium">• {formattedDate}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{daySchedules.length} exams</span>
                  </div>

                  {/* Slot Rows */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-4 space-y-4">
                    {timeSlots.map((slot) => {
                      const slotExams = daySchedules.filter((s) => s.time_slot_id === slot.id);
                      if (slotExams.length === 0) return null;

                      return (
                        <div key={slot.id} className="pt-2 first:pt-0">
                          <div className="flex items-center gap-2 mb-2.5">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {slot.name} ({slot.start_time} - {slot.end_time})
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {slotExams.map((s) => {
                              const isSelected = selectedExamIds.includes(s.exam_id);
                              const isBacklog = s.exam_type === 'backlog';

                              return (
                                <div
                                  key={s.id}
                                  className={`p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-400 dark:border-purple-800 ring-2 ring-purple-400'
                                      : isBacklog
                                      ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                  }`}
                                  onClick={() => handleOpenEditSchedule(s)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleSelectExamForRegen(s.exam_id);
                                        }}
                                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                      />
                                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                        {s.subject_code}
                                      </span>
                                    </div>
                                    <Badge variant={isBacklog ? 'warning' : 'default'} className="text-[10px]">
                                      {s.exam_type?.toUpperCase()}
                                    </Badge>
                                  </div>

                                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                                    {s.subject_name || s.exam_name}
                                  </h4>

                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {s.department_name} • Sem {s.semester_number} • {s.expected_students} students
                                  </p>

                                  {/* Allocated Rooms & Invigilators */}
                                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px]">
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                      <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">
                                        {s.room_allocations && s.room_allocations.length > 0
                                          ? s.room_allocations
                                              .map((a) => `${a.room_number} (${a.allocated_seats}s)`)
                                              .join(', ')
                                          : 'No rooms allocated'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">
                                        {s.invigilator_assignments && s.invigilator_assignments.length > 0
                                          ? s.invigilator_assignments.map((iv) => iv.faculty_name).join(', ')
                                          : 'No invigilator assigned'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 w-8">
                    <input type="checkbox" disabled className="rounded" />
                  </th>
                  <th className="p-3.5">Date & Day</th>
                  <th className="p-3.5">Time Slot</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Enrolled</th>
                  <th className="p-3.5">Rooms</th>
                  <th className="p-3.5">Invigilators</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSchedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={selectedExamIds.includes(s.exam_id)}
                        onChange={() => handleSelectExamForRegen(s.exam_id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {new Date(s.exam_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {s.time_slot_name || `${s.start_time} - ${s.end_time}`}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">{s.subject_code}</span>
                      <span className="text-slate-600 dark:text-slate-400">{s.subject_name}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {s.department_name} (Sem {s.semester_number})
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <Badge variant={s.exam_type === 'backlog' ? 'warning' : 'default'}>
                        {s.exam_type?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-medium">{s.expected_students}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {s.room_allocations?.map((a) => a.room_number).join(', ') || 'None'}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {s.invigilator_assignments?.map((iv) => iv.faculty_name).join(', ') || 'None'}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditSchedule(s)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Timetable Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Run CP-SAT Timetable Optimizer"
        description="Generates an optimal, clash-free examination timetable using Google OR-Tools"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
            <p className="font-semibold mb-1">Strict Mathematical Guarantee:</p>
            All hard constraints (zero student overlaps across regular and backlog subjects, room capacities, equipment requirements) are mathematically enforced.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Maximum Solver Time (seconds)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={genSolveTime}
              onChange={(e) => setGenSolveTime(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Minimum Study Gap Importance (Weight: {genGapWeight})
            </label>
            <input
              type="range"
              min={0}
              max={50}
              value={genGapWeight}
              onChange={(e) => setGenGapWeight(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <span className="text-[11px] text-slate-500">Penalizes consecutive examination days for enrolled students.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Daily Load Balance Importance (Weight: {genBalanceWeight})
            </label>
            <input
              type="range"
              min={0}
              max={50}
              value={genBalanceWeight}
              onChange={(e) => setGenBalanceWeight(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <span className="text-[11px] text-slate-500">Distributes examination events evenly across available dates.</span>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              onClick={() => setShowGenerateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{generating ? 'Optimizing with CP-SAT...' : 'Execute Optimizer'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Schedule & Alternative Slot Recommendations Modal */}
      <Modal
        isOpen={showEditScheduleModal}
        onClose={() => setShowEditScheduleModal(false)}
        title={`Adjust Schedule: ${activeSchedule?.subject_code || ''}`}
        description={activeSchedule?.subject_name || activeSchedule?.exam_name}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Examination Date
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Time Slot
              </label>
              <select
                value={editSlotId}
                onChange={(e) => setEditSlotId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
              >
                {timeSlots.map((ts) => (
                  <option key={ts.id} value={ts.id}>
                    {ts.name} ({ts.start_time} - {ts.end_time})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Adjustment Justification / Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Faculty requested adjustment or lab room preference"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          {/* Rule-Based Alternative Slot Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Intelligent Slot Recommendations
              </span>
              <span className="text-[11px] text-slate-400">Ranked by zero clashes & available capacity</span>
            </div>

            {loadingRecommendations ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-blue-600" />
                Evaluating alternative periods...
              </div>
            ) : recommendations.length === 0 ? (
              <p className="text-xs text-slate-500 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                No alternative slots available.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-950/40">
                {recommendations.slice(0, 5).map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setEditDate(rec.exam_date);
                      setEditSlotId(rec.time_slot_id);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs flex items-center justify-between ${
                      editDate === rec.exam_date && editSlotId === rec.time_slot_id
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700'
                        : rec.is_feasible
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{rec.exam_date}</span>
                        <span className="text-slate-500">• {rec.time_slot_name}</span>
                        {rec.is_feasible ? (
                          <Badge variant="success" className="text-[10px] py-0">
                            FEASIBLE
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] py-0">
                            CLASH
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{rec.reasons[0]}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Score: {rec.score}</span>
                      <span className="text-[10px] text-slate-400 block">{rec.total_spare_capacity} seats</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              onClick={() => setShowEditScheduleModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveScheduleEdit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              Apply Reschedule & Validate
            </button>
          </div>
        </div>
      </Modal>

      {/* Publish Timetable Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Official Examination Timetable"
        description="Make this examination schedule visible to all students and faculty"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-300">
            <p className="font-semibold mb-1">Publishing Conditions Checked:</p>
            Validation engine confirms 0 hard conflicts. Once published, students will see personalized admit cards and faculty will receive invigilation duty notifications.
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              onClick={() => setShowPublishModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Publish</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

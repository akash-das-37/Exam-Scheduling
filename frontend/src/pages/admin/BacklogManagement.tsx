import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  RotateCcw,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const BacklogManagement: React.FC = () => {
  const [backlogs, setBacklogs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Backlog Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentId, setStudentId] = useState<number>(1);
  const [subjectId, setSubjectId] = useState<number>(1);
  const [remarks, setRemarks] = useState('');

  const fetchBacklogs = async () => {
    try {
      setLoading(true);
      const [bRes, stRes, sbRes] = await Promise.all([
        api.get('/backlog'),
        api.get('/students'),
        api.get('/subjects'),
      ]);
      setBacklogs(bRes.data);
      setStudents(stRes.data);
      setSubjects(sbRes.data);
      if (stRes.data.length > 0) setStudentId(stRes.data[0].id);
      if (sbRes.data.length > 0) setSubjectId(sbRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacklogs();
  }, []);

  const handleCreateBacklog = async () => {
    try {
      await api.post('/backlog', {
        student_id: studentId,
        subject_id: subjectId,
        remarks,
      });
      setShowAddModal(false);
      setRemarks('');
      fetchBacklogs();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record backlog');
    }
  };

  const handleRegisterForExam = async (backlogId: number) => {
    try {
      await api.post(`/backlog/register?backlog_id=${backlogId}`);
      fetchBacklogs();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register backlog for exam');
    }
  };

  const filteredBacklogs = backlogs.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.student_name && b.student_name.toLowerCase().includes(q)) ||
      (b.roll_number && b.roll_number.toLowerCase().includes(q)) ||
      (b.subject_code && b.subject_code.toLowerCase().includes(q)) ||
      (b.subject_name && b.subject_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-2xl border border-amber-100 dark:border-amber-900">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Backlog Examination Tracking</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage previous-semester failed subjects and guarantee clash-free scheduling alongside regular exams
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Record Backlog Subject</span>
        </button>
      </div>

      {/* Search and count */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student, roll number, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredBacklogs.length} backlogs recorded</span>
      </div>

      {/* Backlog Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Roll Number</th>
              <th className="p-3.5">Student Name</th>
              <th className="p-3.5">Failed Subject</th>
              <th className="p-3.5">Attempts</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Remarks</th>
              <th className="p-3.5 text-right">Exam Registration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredBacklogs.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{b.roll_number}</td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{b.student_name}</td>
                <td className="p-3.5">
                  <span className="font-bold text-amber-600 dark:text-amber-400 mr-1.5">{b.subject_code}</span>
                  <span className="text-slate-600 dark:text-slate-400">{b.subject_name}</span>
                </td>
                <td className="p-3.5 font-medium">{b.attempts_count} attempt(s)</td>
                <td className="p-3.5">
                  <Badge variant={b.status === 'registered' ? 'success' : 'warning'}>
                    {b.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3.5 text-slate-500 max-w-xs truncate">{b.remarks || 'Standard backlog'}</td>
                <td className="p-3.5 text-right">
                  {b.status !== 'registered' ? (
                    <button
                      onClick={() => handleRegisterForExam(b.id)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Enroll in Session
                    </button>
                  ) : (
                    <span className="text-emerald-600 text-xs font-medium flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Enrolled</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Backlog Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Record Student Backlog">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Student
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.roll_number} — {st.full_name} ({st.department_name}, Sem {st.current_semester_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Failed Subject (Original Course Syllabus)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              {subjects.map((sb) => (
                <option key={sb.id} value={sb.id}>
                  {sb.subject_code} — {sb.subject_name} (Sem {sb.semester_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remarks / Academic Notes
            </label>
            <textarea
              placeholder="e.g. Failed in Semester 2. Appearing in upcoming end-semester backlog slot."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600">
              Cancel
            </button>
            <button
              onClick={handleCreateBacklog}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl"
            >
              Save Backlog Entry
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

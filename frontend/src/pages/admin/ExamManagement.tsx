import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Exam, Subject, Department, Course } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Clock,
  Layers,
  Calendar,
  Users
} from 'lucide-react';

export const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Add Exam Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [examName, setExamName] = useState('');
  const [subjectId, setSubjectId] = useState<number>(1);
  const [examType, setExamType] = useState('regular');
  const [duration, setDuration] = useState<number>(180);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDept !== 'all') params.department_id = selectedDept;
      if (selectedType !== 'all') params.exam_type = selectedType;

      const [exRes, sbRes, dRes] = await Promise.all([
        api.get('/exams', { params }),
        api.get('/subjects'),
        api.get('/departments'),
      ]);
      setExams(exRes.data);
      setSubjects(sbRes.data);
      setDepartments(dRes.data);
      if (sbRes.data.length > 0) setSubjectId(sbRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [selectedDept, selectedType]);

  const handleCreateExam = async () => {
    const sb = subjects.find((s) => s.id === subjectId);
    if (!sb) return;

    try {
      await api.post('/exams', {
        subject_id: subjectId,
        exam_name: examName || `${sb.subject_name} End Semester`,
        exam_type: examType,
        department_id: sb.department_id,
        course_id: sb.course_id,
        semester_number: sb.semester_number,
        academic_session_id: 1,
        duration_minutes: duration,
        required_equipment: sb.required_equipment || 'none',
      });
      setShowAddModal(false);
      setExamName('');
      fetchExams();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create exam');
    }
  };

  const filteredExams = exams.filter((ex) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ex.exam_name.toLowerCase().includes(q) ||
      (ex.subject_code && ex.subject_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Examination Events Roster</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Curricular examination occurrences linked to registered student cohorts
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Examination Event</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search exam or subject code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
          >
            <option value="all">All Types</option>
            <option value="regular">Regular</option>
            <option value="backlog">Backlog</option>
            <option value="practical">Practical</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredExams.length} examinations</span>
      </div>

      {/* Exams Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Subject Code</th>
              <th className="p-3.5">Examination Event Name</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Semester</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Duration</th>
              <th className="p-3.5">Registered Students</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredExams.map((ex) => (
              <tr key={ex.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{ex.subject_code}</td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{ex.exam_name}</td>
                <td className="p-3.5 text-slate-600 dark:text-slate-400">{ex.department_name}</td>
                <td className="p-3.5 font-medium">Sem {ex.semester_number}</td>
                <td className="p-3.5">
                  <Badge variant={ex.exam_type === 'backlog' ? 'warning' : 'default'}>
                    {ex.exam_type.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3.5 text-slate-500">{ex.duration_minutes} mins</td>
                <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                  {ex.expected_student_count || 0} students
                </td>
                <td className="p-3.5">
                  <Badge variant={ex.status === 'scheduled' ? 'success' : 'outline'}>
                    {ex.status.toUpperCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Exam Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Examination Event">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Curriculum Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject_code} — {s.subject_name} ({s.department_name}, Sem {s.semester_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Examination Title (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank to use default subject name"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Examination Category
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                <option value="regular">Regular</option>
                <option value="backlog">Backlog</option>
                <option value="practical">Practical</option>
                <option value="supplementary">Supplementary</option>
                <option value="internal">Internal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300">
            Note: All students currently registered for this subject will be automatically enrolled in this examination event.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateExam}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Create Examination
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

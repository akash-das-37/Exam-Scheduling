import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Subject, Department, Course } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  Cpu,
  Layers,
  Edit2
} from 'lucide-react';

export const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedSem, setSelectedSem] = useState<string>('all');

  // Add Subject Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [deptId, setDeptId] = useState<number>(1);
  const [courseId, setCourseId] = useState<number>(1);
  const [semester, setSemester] = useState<number>(4);
  const [subjType, setSubjType] = useState('theory');
  const [credits, setCredits] = useState<number>(3);
  const [duration, setDuration] = useState<number>(180);
  const [equipment, setEquipment] = useState('none');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDept !== 'all') params.department_id = selectedDept;
      if (selectedSem !== 'all') params.semester = selectedSem;

      const [sbRes, dRes, cRes] = await Promise.all([
        api.get('/subjects', { params }),
        api.get('/departments'),
        api.get('/courses'),
      ]);
      setSubjects(sbRes.data);
      setDepartments(dRes.data);
      setCourses(cRes.data);
      if (dRes.data.length > 0) setDeptId(dRes.data[0].id);
      if (cRes.data.length > 0) setCourseId(cRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [selectedDept, selectedSem]);

  const handleCreateSubject = async () => {
    try {
      await api.post('/subjects', {
        subject_code: subjCode,
        subject_name: subjName,
        department_id: deptId,
        course_id: courseId,
        semester_number: semester,
        subject_type: subjType,
        credits,
        exam_duration_minutes: duration,
        required_equipment: equipment,
      });
      setShowAddModal(false);
      setSubjCode('');
      setSubjName('');
      fetchSubjects();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create subject');
    }
  };

  const filteredSubjects = subjects.filter((sb) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return sb.subject_name.toLowerCase().includes(q) || sb.subject_code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Subject & Curriculum Catalog</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Course syllabus entities, elective categories, exam durations and equipment needs
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code or subject title..."
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
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Sem {s}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredSubjects.length} subjects</span>
      </div>

      {/* Subjects Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">Subject Name</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Semester</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Credits</th>
              <th className="p-3.5">Exam Duration</th>
              <th className="p-3.5">Equipment</th>
              <th className="p-3.5 text-right">Enrolled Students</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSubjects.map((sb) => (
              <tr key={sb.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{sb.subject_code}</td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{sb.subject_name}</td>
                <td className="p-3.5 text-slate-600 dark:text-slate-400">{sb.department_name}</td>
                <td className="p-3.5 font-medium">Sem {sb.semester_number}</td>
                <td className="p-3.5">
                  <Badge variant={sb.subject_type === 'elective' ? 'purple' : 'default'}>
                    {sb.subject_type.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3.5">{sb.credits} Credits</td>
                <td className="p-3.5 text-slate-600 dark:text-slate-400">{sb.exam_duration_minutes} mins</td>
                <td className="p-3.5 capitalize text-slate-500">{sb.required_equipment || 'None'}</td>
                <td className="p-3.5 text-right font-bold text-blue-600 dark:text-blue-400">
                  {sb.registered_students_count || 0} students
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Subject Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Subject to Curriculum">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Code
              </label>
              <input
                type="text"
                required
                placeholder="CS405"
                value={subjCode}
                onChange={(e) => setSubjCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Title
              </label>
              <input
                type="text"
                required
                placeholder="Compiler Construction"
                value={subjName}
                onChange={(e) => setSubjName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Degree Program
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Semester
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Type
              </label>
              <select
                value={subjType}
                onChange={(e) => setSubjType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                <option value="theory">Theory</option>
                <option value="practical">Practical</option>
                <option value="lab">Lab</option>
                <option value="elective">Elective</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exam Duration (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Required Room Equipment
            </label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              <option value="none">None (Standard Desk & Chair)</option>
              <option value="computers">Computer Terminals (Lab)</option>
              <option value="audio_visual">Audio / Visual (Auditorium)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSubject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Save Subject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

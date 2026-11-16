import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Department, Course, AcademicSession } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  Building,
  Edit2,
  CheckCircle2
} from 'lucide-react';

export const AcademicManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'departments' | 'courses' | 'sessions'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseDeptId, setCourseDeptId] = useState<number>(1);
  const [courseDuration, setCourseDuration] = useState<number>(4);
  const [courseSems, setCourseSems] = useState<number>(8);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, cRes, sRes] = await Promise.all([
        api.get('/departments'),
        api.get('/courses'),
        api.get('/academic-sessions'),
      ]);
      setDepartments(dRes.data);
      setCourses(cRes.data);
      setSessions(sRes.data);
      if (dRes.data.length > 0) {
        setCourseDeptId(dRes.data[0].id);
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

  const handleCreateDept = async () => {
    try {
      await api.post('/departments', {
        name: deptName,
        code: deptCode,
        description: deptDesc,
      });
      setShowDeptModal(false);
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create department');
    }
  };

  const handleCreateCourse = async () => {
    try {
      await api.post('/courses', {
        name: courseName,
        code: courseCode,
        department_id: courseDeptId,
        duration_years: courseDuration,
        total_semesters: courseSems,
      });
      setShowCourseModal(false);
      setCourseName('');
      setCourseCode('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create course');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Academic Structure</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage collegiate departments, degree programs, semester tracks and academic sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'departments' && (
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          )}
          {activeTab === 'courses' && (
            <button
              onClick={() => setShowCourseModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Degree Program</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'departments'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'courses'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Courses & Programs ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'sessions'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Academic Sessions ({sessions.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                    {d.code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{d.name}</h3>
                    <p className="text-xs text-slate-500">{d.description || 'No description provided'}</p>
                  </div>
                </div>
                <Badge variant="success">ACTIVE</Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{d.courses_count || 0}</p>
                  <p className="text-[10px] text-slate-400">Programs</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{d.students_count || 0}</p>
                  <p className="text-[10px] text-slate-400">Students</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{d.faculty_count || 0}</p>
                  <p className="text-[10px] text-slate-400">Faculty</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Program Code</th>
                <th className="p-3.5">Degree Title</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Total Semesters</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{c.code}</td>
                  <td className="p-3.5 font-medium">{c.name}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{c.department_name}</td>
                  <td className="p-3.5">{c.duration_years} Years</td>
                  <td className="p-3.5">{c.total_semesters} Semesters</td>
                  <td className="p-3.5">
                    <Badge variant="success">ACTIVE</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {s.start_date} to {s.end_date}
                  </p>
                </div>
                {s.is_current && <Badge variant="success">CURRENT TERM</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal isOpen={showDeptModal} onClose={() => setShowDeptModal(false)} title="Add Academic Department">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Civil & Environmental Engineering"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CE"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              placeholder="Brief description of department scope"
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowDeptModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDept}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Save Department
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Course Modal */}
      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Add Degree Program">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Program Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. B.Tech in Artificial Intelligence"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Program Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BT-AI"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department
            </label>
            <select
              value={courseDeptId}
              onChange={(e) => setCourseDeptId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Years)
              </label>
              <input
                type="number"
                value={courseDuration}
                onChange={(e) => setCourseDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Semesters
              </label>
              <input
                type="number"
                value={courseSems}
                onChange={(e) => setCourseSems(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCourseModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCourse}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Save Program
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Student, Department, Course } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  UserCheck,
  Edit2,
  BookOpen,
  RotateCcw,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedSem, setSelectedSem] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // New Student Form
  const [rollNumber, setRollNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deptId, setDeptId] = useState<number>(1);
  const [courseId, setCourseId] = useState<number>(1);
  const [semester, setSemester] = useState<number>(1);

  // File import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDept !== 'all') params.department_id = selectedDept;
      if (selectedSem !== 'all') params.semester = selectedSem;
      if (search) params.search = search;

      const [stRes, deptRes, cRes] = await Promise.all([
        api.get('/students', { params }),
        api.get('/departments'),
        api.get('/courses'),
      ]);
      setStudents(stRes.data);
      setDepartments(deptRes.data);
      setCourses(cRes.data);
      if (deptRes.data.length > 0) setDeptId(deptRes.data[0].id);
      if (cRes.data.length > 0) setCourseId(cRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedDept, selectedSem, search]);

  const handleAddStudent = async () => {
    try {
      await api.post('/students', {
        roll_number: rollNumber,
        full_name: fullName,
        email,
        phone,
        department_id: deptId,
        course_id: courseId,
        current_semester_number: semester,
        enrollment_year: 2024,
      });
      setShowAddModal(false);
      setRollNumber('');
      setFullName('');
      setEmail('');
      setPhone('');
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add student');
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) return;
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);
      const { data } = await api.post('/students-import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportReport(data);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to import Excel');
    } finally {
      setImporting(false);
    }
  };

  const openProfile = (st: Student) => {
    setActiveStudent(st);
    setShowProfileModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Student Roster Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain institutional registrations, course enrollments, backlogs and exam eligibilities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/students-export/excel"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </a>

          <button
            onClick={() => {
              setImportReport(null);
              setImportFile(null);
              setShowImportModal(true);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
          {students.length} students found
        </span>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Roll Number</th>
              <th className="p-3.5">Full Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Semester</th>
              <th className="p-3.5">Enrolled Subjects</th>
              <th className="p-3.5">Backlogs</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {students.map((st) => (
              <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{st.roll_number}</td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{st.full_name}</td>
                <td className="p-3.5 text-slate-500">{st.email}</td>
                <td className="p-3.5 text-slate-600 dark:text-slate-400">{st.department_name}</td>
                <td className="p-3.5 font-medium">Sem {st.current_semester_number}</td>
                <td className="p-3.5">{st.registered_subjects_count || 0} subjects</td>
                <td className="p-3.5">
                  {(st.backlog_count || 0) > 0 ? (
                    <Badge variant="warning">{st.backlog_count} Backlog(s)</Badge>
                  ) : (
                    <span className="text-slate-400 text-[11px]">None</span>
                  )}
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => openProfile(st)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register New Student">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                required
                placeholder="24CSE099"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                required
                placeholder="student@apex.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
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
              onClick={handleAddStudent}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Save Student Record
            </button>
          </div>
        </div>
      </Modal>

      {/* Excel Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Students from Excel">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Upload an Excel workbook (<code>.xlsx</code>) containing columns: Roll Number, Full Name, Email, Phone, Department Code, Course Code, Semester, Year, Status.
          </p>

          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
            className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          />

          {importReport && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs">
              <p className="font-semibold text-emerald-600">Successfully imported: {importReport.imported_count}</p>
              {importReport.errors && importReport.errors.length > 0 && (
                <div className="mt-2 text-rose-600 space-y-0.5">
                  <p className="font-semibold">Row-level issues:</p>
                  {importReport.errors.map((err: string, i: number) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600">
              Close
            </button>
            <button
              onClick={handleImportExcel}
              disabled={!importFile || importing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
            >
              {importing ? 'Processing...' : 'Upload & Parse'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Student Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title={activeStudent?.full_name || 'Student Profile'}
        description={`Roll Number: ${activeStudent?.roll_number}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{activeStudent?.department_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Program</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{activeStudent?.course_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Semester</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Sem {activeStudent?.current_semester_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Institutional Email</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{activeStudent?.email}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold">Registered Backlogs</p>
              <p className="text-[11px] text-slate-500">{activeStudent?.backlog_count || 0} active backlog subjects</p>
            </div>
            <a
              href={`/api/reports/pdf/student/1/${activeStudent?.id}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Admit Card PDF</span>
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Faculty, Department } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  UserCheck,
  Search,
  Plus,
  ShieldCheck,
  CalendarCheck,
  Clock,
  Download
} from 'lucide-react';

export const FacultyManagement: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Add Faculty Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [facultyCode, setFacultyCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deptId, setDeptId] = useState<number>(1);
  const [designation, setDesignation] = useState('Assistant Professor');
  const [maxWorkload, setMaxWorkload] = useState<number>(6);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDept !== 'all') params.department_id = selectedDept;

      const [fRes, dRes] = await Promise.all([
        api.get('/faculty', { params }),
        api.get('/departments'),
      ]);
      setFaculty(fRes.data);
      setDepartments(dRes.data);
      if (dRes.data.length > 0) setDeptId(dRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [selectedDept]);

  const handleAddFaculty = async () => {
    try {
      await api.post('/faculty', {
        faculty_code: facultyCode,
        full_name: fullName,
        email,
        phone,
        department_id: deptId,
        designation,
        max_invigilation_workload: maxWorkload,
      });
      setShowAddModal(false);
      setFacultyCode('');
      setFullName('');
      setEmail('');
      setPhone('');
      fetchFaculty();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create faculty');
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.full_name.toLowerCase().includes(q) ||
      f.faculty_code.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Faculty & Invigilator Roster</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervise faculty designations, invigilation workloads and duty assignments
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search faculty name, code, or email..."
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
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredFaculty.length} faculty</span>
      </div>

      {/* Faculty Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">Full Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Designation</th>
              <th className="p-3.5">Assigned Duties</th>
              <th className="p-3.5">Workload Limit</th>
              <th className="p-3.5 text-right">Duty Roster</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredFaculty.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{f.faculty_code}</td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{f.full_name}</td>
                <td className="p-3.5 text-slate-500">{f.email}</td>
                <td className="p-3.5 text-slate-600 dark:text-slate-400">{f.department_name}</td>
                <td className="p-3.5">{f.designation}</td>
                <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                  {f.assigned_duties_count || 0} duties
                </td>
                <td className="p-3.5 text-slate-500">Max {f.max_invigilation_workload}</td>
                <td className="p-3.5 text-right">
                  <a
                    href={`/api/reports/pdf/faculty/1/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Faculty Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register Faculty Member">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Faculty Code
              </label>
              <input
                type="text"
                required
                placeholder="FAC-CSE-09"
                value={facultyCode}
                onChange={(e) => setFacultyCode(e.target.value)}
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
                placeholder="Dr. Katherine Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="faculty@jisce.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
              </select>
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
                Max Invigilation Duties
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxWorkload}
                onChange={(e) => setMaxWorkload(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleAddFaculty}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Save Faculty Member
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

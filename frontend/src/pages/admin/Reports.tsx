import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TimetableVersion, Student, Faculty } from '../../types';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Users,
  UserCheck
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [versions, setVersions] = useState<TimetableVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number>(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(1);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number>(1);

  useEffect(() => {
    const load = async () => {
      try {
        const [vRes, stRes, fRes] = await Promise.all([
          api.get('/timetable/versions'),
          api.get('/students'),
          api.get('/faculty'),
        ]);
        setVersions(vRes.data);
        setStudents(stRes.data);
        setFaculty(fRes.data);
        if (vRes.data.length > 0) setSelectedVersionId(vRes.data[0].id);
        if (stRes.data.length > 0) setSelectedStudentId(stRes.data[0].id);
        if (fRes.data.length > 0) setSelectedFacultyId(fRes.data[0].id);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Official Reports & Exports Hub</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate publication-grade PDF documents and Excel data exports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Timetable Version:</label>
          <select
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Reports Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-600" />
            Official PDF Document Generators (ReportLab)
          </h3>

          {/* Master Timetable PDF Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">College Master Timetable</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Comprehensive schedule with all dates, rooms, and invigilators</p>
            </div>
            <a
              href={`/api/reports/pdf/master/${selectedVersionId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
          </div>

          {/* Student Admit Card PDF */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Student Admit Card & Schedule</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Personalized examination hall ticket with regular and backlog subjects</p>
              </div>
              <a
                href={`/api/reports/pdf/student/${selectedVersionId}/${selectedStudentId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Admit Card PDF</span>
              </a>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Select Student:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.roll_number} — {st.full_name} ({st.department_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Faculty Duty Sheet PDF */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Faculty Invigilation Duty Roster</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Official duty assignment sheet for individual professors</p>
              </div>
              <a
                href={`/api/reports/pdf/faculty/${selectedVersionId}/${selectedFacultyId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Duty Roster PDF</span>
              </a>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Select Faculty Member:</label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.faculty_code} — {f.full_name} ({f.department_name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Excel Exports Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel Spreadsheets (OpenPyXL)
          </h3>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Master Timetable Workbook</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Complete spreadsheet with all schedules, slots, rooms and invigilators</p>
            </div>
            <a
              href={`/api/reports/excel/timetable/${selectedVersionId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export (.xlsx)</span>
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Student Enrollment Roster</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Spreadsheet of all registered students with roll numbers and programs</p>
            </div>
            <a
              href="/api/students-export/excel"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export (.xlsx)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import {
  Settings as SettingsIcon,
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  Building
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [settingsData, setSettingsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [weights, setWeights] = useState<{ [key: string]: number }>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/settings');
      setSettingsData(data);
      const wMap: any = {};
      (data.constraints || []).forEach((c: any) => {
        wMap[c.key] = c.weight;
      });
      setWeights(wMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateWeight = async (key: string, val: string) => {
    try {
      setSavingKey(key);
      await api.put(`/settings/constraints/${key}`, {
        weight: weights[key],
        value: val || '1',
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update constraint');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading || !settingsData) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Institutional System Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              College identity parameters and CP-SAT constraint optimization weights
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Updated</span>
          </span>
        )}
      </div>

      {/* College Identity Box */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Institutional Identity</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 block mb-1">College Name</label>
            <input
              type="text"
              readOnly
              value={settingsData.college_name}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Institution Code</label>
            <input
              type="text"
              readOnly
              value={settingsData.college_code}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* CP-SAT Constraints & Penalty Weights */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Optimization Constraint Weights</h3>
          </div>
          <span className="text-[11px] text-slate-400">Hard constraints (100) are inviolable</span>
        </div>

        <div className="space-y-3">
          {(settingsData.constraints || []).map((c: any) => {
            const isHard = c.category === 'hard';
            return (
              <div
                key={c.key}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.name}</span>
                    <Badge variant={isHard ? 'destructive' : 'default'}>{c.category.toUpperCase()}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">{c.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!isHard ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={weights[c.key] ?? c.weight}
                        onChange={(e) =>
                          setWeights({ ...weights, [c.key]: Number(e.target.value) })
                        }
                        className="w-28 accent-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6">
                        {weights[c.key] ?? c.weight}
                      </span>
                      <button
                        onClick={() => handleUpdateWeight(c.key, c.value)}
                        disabled={savingKey === c.key}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950 dark:hover:bg-blue-900 text-xs font-semibold"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Strict Hard Constraint (Inviolable)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

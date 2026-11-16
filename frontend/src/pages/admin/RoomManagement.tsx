import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Room } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  DoorOpen,
  Search,
  Plus,
  Building,
  CheckCircle2,
  Cpu,
  BarChart2
} from 'lucide-react';

export const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Room Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [building, setBuilding] = useState('Main Academic Block');
  const [floor, setFloor] = useState<number>(1);
  const [roomType, setRoomType] = useState('classroom');
  const [capacity, setCapacity] = useState<number>(60);
  const [equipment, setEquipment] = useState('none');
  const [accessibility, setAccessibility] = useState(true);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const [rRes, uRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/rooms/utilization'),
      ]);
      setRooms(rRes.data);
      setUtilization(uRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    try {
      await api.post('/rooms', {
        room_number: roomNumber,
        building,
        floor,
        room_type: roomType,
        seating_capacity: capacity,
        available_equipment: equipment,
        accessibility,
      });
      setShowAddModal(false);
      setRoomNumber('');
      fetchRooms();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create room');
    }
  };

  const totalCapacity = rooms.reduce((sum, r) => sum + r.seating_capacity, 0);

  const filteredRooms = rooms.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.room_number.toLowerCase().includes(q) || r.building.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Examination Venues & Rooms</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seating capacities, equipment specifications, accessibility compliance and utilization rates
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Examination Room</span>
        </button>
      </div>

      {/* Capacity & Utilization Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Aggregate Campus Seating Capacity</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalCapacity} Seats</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Across {rooms.length} registered venues</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Exam Halls & Auditoriums</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {rooms.filter((r) => r.room_type === 'exam_hall' || r.room_type === 'auditorium').length} Halls
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">High-capacity venues (100+ seats)</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Computing & Practical Labs</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {rooms.filter((r) => r.available_equipment === 'computers').length} Labs
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Computer terminal verified</span>
        </div>
      </div>

      {/* Search and list */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search venue or building..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredRooms.length} rooms</span>
      </div>

      {/* Rooms Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Room Number</th>
              <th className="p-3.5">Building & Location</th>
              <th className="p-3.5">Venue Type</th>
              <th className="p-3.5">Capacity</th>
              <th className="p-3.5">Equipment Installed</th>
              <th className="p-3.5">Wheelchair Access</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRooms.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{r.room_number}</td>
                <td className="p-3.5 text-slate-600 dark:text-slate-400">
                  {r.building}, Floor {r.floor}
                </td>
                <td className="p-3.5 capitalize">{r.room_type.replace(/_/g, ' ')}</td>
                <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">{r.seating_capacity} seats</td>
                <td className="p-3.5 capitalize text-slate-500">{r.available_equipment || 'None'}</td>
                <td className="p-3.5">
                  {r.accessibility ? (
                    <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accessible
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Standard</span>
                  )}
                </td>
                <td className="p-3.5">
                  <Badge variant={r.status === 'available' ? 'success' : 'outline'}>
                    {r.status.toUpperCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Room Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Examination Room">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Room Number / Identifier
              </label>
              <input
                type="text"
                required
                placeholder="Hall-105"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Building Name
              </label>
              <input
                type="text"
                required
                placeholder="Main Academic Block"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Floor</label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Venue Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                <option value="classroom">Classroom</option>
                <option value="exam_hall">Exam Hall</option>
                <option value="computer_lab">Computer Lab</option>
                <option value="auditorium">Auditorium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Seating Capacity
              </label>
              <input
                type="number"
                min={10}
                max={500}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Installed Equipment
            </label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              <option value="none">None (Standard Desk & Chair)</option>
              <option value="computers">Computers / Workstations</option>
              <option value="projector">Projector / Audio Visual</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="acc"
              checked={accessibility}
              onChange={(e) => setAccessibility(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="acc" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Wheelchair accessible venue
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600">
              Cancel
            </button>
            <button
              onClick={handleCreateRoom}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Save Room
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

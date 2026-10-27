'use client';

import React, { useState } from 'react';
import type { Resource, Task, Farm } from '@/db/schema';
import { Plus, UserPlus, Trash2, ArrowRightLeft, ShieldCheck, Clock, MapPin } from 'lucide-react';

interface CrewViewProps {
  resources: Resource[];
  tasks: Task[];
  farms: Farm[];
  onUpdateResource: (
    resourceId: number,
    data: {
      status?: 'IDLE' | 'BUSY' | 'MAINTENANCE' | 'EN_ROUTE';
      currentFarmId?: number;
    }
  ) => Promise<void>;
  onAddResource?: (data: {
    name: string;
    type: string;
    currentFarmId: number;
    fuelOrBattery: number;
    model: string;
  }) => Promise<void>;
  onDeleteResource?: (resourceId: number) => Promise<void>;
}

export default function CrewView({
  resources,
  tasks,
  farms,
  onUpdateResource,
  onAddResource,
  onDeleteResource,
}: CrewViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Lead Agronomist');
  const [farmId, setFarmId] = useState(farms[0]?.id || 1);
  const [submitting, setSubmitting] = useState(false);

  const workers = resources.filter((r) => r.type === 'WORKER');

  const handleReassignSector = async (workerId: number, nextFarmId: number) => {
    await onUpdateResource(workerId, { currentFarmId: nextFarmId, status: 'IDLE' });
  };

  const handleToggleStatus = async (workerId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'BUSY' ? 'IDLE' : 'BUSY';
    await onUpdateResource(workerId, { status: nextStatus as 'IDLE' | 'BUSY' });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (onAddResource) {
        await onAddResource({
          name,
          type: 'WORKER',
          currentFarmId: farmId,
          fuelOrBattery: 100,
          model: role,
        });
      } else {
        await fetch('/api/resources/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            type: 'WORKER',
            currentFarmId: farmId,
            fuelOrBattery: 100,
            model: role,
          }),
        });
      }
      setShowAddModal(false);
      setName('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (workerId: number) => {
    if (!confirm('Are you sure you want to remove this operator from the roster?')) return;
    if (onDeleteResource) {
      await onDeleteResource(workerId);
    } else {
      await fetch(`/api/resources/${workerId}/delete`, { method: 'POST' });
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Field Agronomists & Edge Operators</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Certified crop scouts, lead agronomists, and tele-operators stationed across {farms.length} sectors
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#134E35] hover:bg-[#0D3826] text-white text-xs font-bold rounded-2xl shadow-xs transition-all hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Agronomist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((w) => {
          const farm = farms.find((f) => f.id === w.currentFarmId);
          const activeTask = tasks.find((t) => t.assignedResourceId === w.id && t.status === 'IN_PROGRESS');

          return (
            <div key={w.id} className="donezo-card p-6 space-y-4 hover:border-stone-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 font-bold text-xl flex items-center justify-center shadow-xs">
                      👷
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{w.name}</h4>
                      <p className="text-xs text-stone-500 font-medium">{w.model || 'Lead Agronomist'}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      w.status === 'BUSY'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {w.status === 'BUSY' ? 'Active Shift' : 'On Standby'}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-stone-50/80 rounded-xl border border-stone-200/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" /> Current Station
                    </span>
                    <span className="font-bold text-stone-800 font-mono">
                      {farm?.code || farm?.name.split(' - ')[0] || `Sector #${w.currentFarmId}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Active Field Mission</span>
                    <span className="font-semibold text-emerald-800 truncate max-w-[170px]">
                      {activeTask ? activeTask.title : 'Standby Inspection'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>Shift Stamina:</span>
                    <span className="font-mono font-bold text-stone-700">{w.fuelOrBattery}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="text-stone-500 flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3 text-stone-400" /> Reassign Sector:
                  </span>
                  <select
                    value={w.currentFarmId}
                    onChange={(e) => handleReassignSector(w.id, Number(e.target.value))}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-stone-200 bg-white"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code || f.name.split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleToggleStatus(w.id, w.status)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    {w.status === 'BUSY' ? 'Set Standby' : 'Start Shift'}
                  </button>

                  <button
                    onClick={() => handleDelete(w.id)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Crew Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Add Field Agronomist</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Role / Specialization</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-700"
                >
                  <option value="Lead Operations Agronomist">Lead Operations Agronomist</option>
                  <option value="Field Sensor Specialist">Field Sensor Specialist</option>
                  <option value="Irrigation & Drainage Supervisor">Irrigation & Drainage Supervisor</option>
                  <option value="Plant Pathology Specialist">Plant Pathology Specialist</option>
                  <option value="Autonomous Drone Operator">Autonomous Drone Operator</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Assigned Station</label>
                <select
                  value={farmId}
                  onChange={(e) => setFarmId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-700"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name.split(' - ')[0]} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#134E35] hover:bg-[#0D3826] rounded-xl shadow-xs"
                >
                  {submitting ? 'Registering...' : 'Add to Operations Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

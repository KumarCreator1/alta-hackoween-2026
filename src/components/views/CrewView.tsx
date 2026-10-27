'use client';

import React, { useState, useMemo } from 'react';
import type { Resource, Task, Farm } from '@/db/schema';

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

type StatusType = 'IDLE' | 'BUSY' | 'MAINTENANCE' | 'EN_ROUTE';

const STATUS_CONFIG: Record<StatusType, { label: string; bg: string; text: string; border: string }> = {
  IDLE: {
    label: 'Idle / Standby',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-300',
  },
  BUSY: {
    label: 'Task Assigned',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  MAINTENANCE: {
    label: 'Off Duty',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-300',
  },
  EN_ROUTE: {
    label: 'Change Post',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
};

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
  const [farmId, setFarmId] = useState<number>(farms[0]?.id || 1);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFarmId, setFilterFarmId] = useState<number | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const workers = useMemo(() => {
    return resources
      .filter((r) => r.type === 'WORKER')
      .filter((w) => {
        if (filterFarmId !== 'ALL' && w.currentFarmId !== filterFarmId) return false;
        if (filterStatus !== 'ALL' && w.status !== filterStatus) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const farm = farms.find((f) => f.id === w.currentFarmId);
          const activeTask = tasks.find(
            (t) => t.assignedResourceId === w.id && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
          );
          return (
            w.name.toLowerCase().includes(q) ||
            w.model?.toLowerCase().includes(q) ||
            farm?.code.toLowerCase().includes(q) ||
            farm?.name.toLowerCase().includes(q) ||
            activeTask?.title.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [resources, filterFarmId, filterStatus, searchQuery, farms, tasks]);

  const handleStatusChange = async (workerId: number, nextStatus: StatusType) => {
    setUpdatingId(workerId);
    try {
      await onUpdateResource(workerId, { status: nextStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReassignSector = async (workerId: number, nextFarmId: number) => {
    setUpdatingId(workerId);
    try {
      await onUpdateResource(workerId, { currentFarmId: nextFarmId, status: 'EN_ROUTE' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (onAddResource) {
        await onAddResource({
          name: name.trim(),
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
            name: name.trim(),
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

  const handleDelete = async (workerId: number, workerName: string) => {
    if (!confirm(`Are you sure you want to remove ${workerName} from the operator roster?`)) return;
    if (onDeleteResource) {
      await onDeleteResource(workerId);
    } else {
      await fetch(`/api/resources/${workerId}/delete`, { method: 'POST' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Field Agronomists & Operators</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Operator roster, assigned field missions, station allocations, and shift status
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          + Add Agronomist
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <span className="text-xs font-semibold text-stone-500">Search:</span>
            <input
              type="text"
              placeholder="Search by name, role, station, or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-md border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:border-stone-500"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-600 font-mono">
            <span>Roster: <strong>{workers.length} Personnel</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Station Post:</span>
            <select
              value={filterFarmId}
              onChange={(e) => setFilterFarmId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="text-xs px-2.5 py-1 rounded-md border border-stone-300 bg-white focus:outline-none focus:border-stone-500 font-medium"
            >
              <option value="ALL">All Stations</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} - {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-md border border-stone-300 bg-white focus:outline-none focus:border-stone-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="IDLE">Idle / Standby</option>
              <option value="BUSY">Task Assigned</option>
              <option value="MAINTENANCE">Off Duty</option>
              <option value="EN_ROUTE">Change Post</option>
            </select>
          </div>
        </div>
      </div>

      {/* Excel Table */}
      <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-300 select-none">
                <th className="py-2.5 px-3 w-10 text-center border-r border-stone-200">#</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-stone-200">Operator Name</th>
                <th className="py-2.5 px-3 min-w-[180px] border-r border-stone-200">Role / Specialization</th>
                <th className="py-2.5 px-3 min-w-[180px] border-r border-stone-200">Station Post</th>
                <th className="py-2.5 px-3 min-w-[260px] border-r border-stone-200">Assigned Job (Realtime Dynamic)</th>
                <th className="py-2.5 px-3 min-w-[130px] border-r border-stone-200">Current Status</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-stone-200">Update Status</th>
                <th className="py-2.5 px-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-normal">
              {workers.map((w, idx) => {
                const farm = farms.find((f) => f.id === w.currentFarmId);
                const activeTask = tasks.find(
                  (t) => t.assignedResourceId === w.id && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
                );
                const statusCfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.IDLE;
                const isBusy = updatingId === w.id;

                return (
                  <tr
                    key={w.id}
                    className={`hover:bg-stone-50/90 transition-colors ${
                      idx % 2 === 1 ? 'bg-stone-50/30' : 'bg-white'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-stone-400 font-mono text-[11px] border-r border-stone-200">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <div className="font-semibold text-stone-900">{w.name}</div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {w.serialNumber || `ID-${w.id}`}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 border-r border-stone-200 text-stone-700">
                      {w.model || 'Field Operator'}
                    </td>

                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <div className="flex items-center justify-between gap-1.5">
                        <div>
                          <div className="font-semibold text-stone-900 text-[11px]">
                            {farm?.code || `SEC-0${w.currentFarmId}`}
                          </div>
                          <div className="text-[10px] text-stone-500 truncate max-w-[120px]">
                            {farm?.name.split(' - ')[0] || `Farm #${w.currentFarmId}`}
                          </div>
                        </div>

                        <select
                          disabled={isBusy}
                          value={w.currentFarmId}
                          onChange={(e) => handleReassignSector(w.id, Number(e.target.value))}
                          title="Change post station"
                          className="text-[10px] font-mono py-1 px-1.5 bg-white border border-stone-300 rounded text-stone-700 hover:border-stone-400 focus:outline-none"
                        >
                          {farms.map((f) => (
                            <option key={f.id} value={f.id}>
                              Post: {f.code}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 border-r border-stone-200">
                      {activeTask ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-stone-900 leading-snug">
                            {activeTask.title}
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono flex items-center gap-2">
                            <span>{activeTask.category}</span>
                            <span>•</span>
                            <span>{activeTask.fieldSection}</span>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                activeTask.status === 'IN_PROGRESS' ? 'text-amber-700' : 'text-stone-700'
                              }`}
                            >
                              {activeTask.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-stone-400 font-mono text-[11px] italic">
                          None (Standby)
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <div className="flex items-center gap-1.5">
                        <select
                          disabled={isBusy}
                          value={w.status}
                          onChange={(e) => handleStatusChange(w.id, e.target.value as StatusType)}
                          className="text-[11px] py-1 px-2 bg-white border border-stone-300 rounded font-medium text-stone-800 hover:border-stone-400 focus:outline-none"
                        >
                          <option value="IDLE">Idle / Standby</option>
                          <option value="BUSY">Task Assigned</option>
                          <option value="MAINTENANCE">Off Duty</option>
                          <option value="EN_ROUTE">Change Post</option>
                        </select>

                        <button
                          disabled={isBusy}
                          onClick={() => handleStatusChange(w.id, w.status === 'BUSY' ? 'IDLE' : 'BUSY')}
                          className="text-[10px] px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-stone-700 font-medium"
                        >
                          {w.status === 'BUSY' ? 'Standby' : 'Start Task'}
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDelete(w.id, w.name)}
                        className="text-[11px] text-red-600 hover:text-red-800 hover:underline font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}

              {workers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                    No operator records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-stone-50 border-t border-stone-200 px-4 py-2 text-[11px] text-stone-500 font-mono">
          Showing {workers.length} operator records
        </div>
      </div>

      {/* Add Agronomist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 border border-stone-300">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Register New Agronomist</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Role / Specialization</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
                >
                  <option value="Lead Operations Agronomist">Lead Operations Agronomist</option>
                  <option value="Field Sensor Specialist">Field Sensor Specialist</option>
                  <option value="Irrigation Supervisor">Irrigation Supervisor</option>
                  <option value="Plant Pathology Specialist">Plant Pathology Specialist</option>
                  <option value="Drone Operator">Drone Operator</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Station Post</label>
                <select
                  value={farmId}
                  onChange={(e) => setFarmId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code} - {f.name.split(' - ')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-stone-900 text-white rounded font-semibold hover:bg-stone-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

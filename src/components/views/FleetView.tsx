'use client';

import React, { useState, useMemo } from 'react';
import type { Resource, Farm, Task } from '@/db/schema';

interface FleetViewProps {
  resources: Resource[];
  farms: Farm[];
  tasks?: Task[];
  onUpdateResource: (
    resourceId: number,
    data: {
      status?: 'IDLE' | 'BUSY' | 'MAINTENANCE' | 'EN_ROUTE';
      currentFarmId?: number;
      implementStatus?: string;
    }
  ) => Promise<void>;
  onAddResource: (data: {
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
    label: 'Idle',
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
    label: 'In Repair',
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

export default function FleetView({
  resources,
  farms,
  tasks = [],
  onUpdateResource,
  onAddResource,
  onDeleteResource,
}: FleetViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterFarmId, setFilterFarmId] = useState<number | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State for adding new equipment
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('TRACTOR');
  const [newFarmId, setNewFarmId] = useState<number>(farms[0]?.id || 1);
  const [newModel, setNewModel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal State for changing post / reassigning
  const [changePostResource, setChangePostResource] = useState<Resource | null>(null);
  const [targetPostFarmId, setTargetPostFarmId] = useState<number>(farms[0]?.id || 1);
  const [updatingPost, setUpdatingPost] = useState(false);

  // Status update state tracker for instant UI feedback
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Map each resource to its dynamic active job from tasks
  const getAssignedJob = (resourceId: number) => {
    const active = tasks.find(
      (t) =>
        t.assignedResourceId === resourceId &&
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELLED'
    );
    return active || null;
  };

  // Filtered dataset
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (filterType !== 'ALL' && r.type !== filterType) return false;
      if (filterFarmId !== 'ALL' && r.currentFarmId !== filterFarmId) return false;
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const farm = farms.find((f) => f.id === r.currentFarmId);
        const assignedJob = getAssignedJob(r.id);
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesModel = r.model?.toLowerCase().includes(q);
        const matchesFarm = farm?.name.toLowerCase().includes(q) || farm?.code.toLowerCase().includes(q);
        const matchesJob = assignedJob?.title.toLowerCase().includes(q);
        return matchesName || matchesModel || matchesFarm || matchesJob;
      }
      return true;
    });
  }, [resources, filterType, filterFarmId, filterStatus, searchQuery, farms, tasks]);

  // Handle direct status change
  const handleStatusChange = async (resourceId: number, newStatus: StatusType) => {
    setUpdatingId(resourceId);
    try {
      await onUpdateResource(resourceId, { status: newStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle station change
  const handlePostChange = async (resourceId: number, newFarmId: number) => {
    setUpdatingId(resourceId);
    try {
      await onUpdateResource(resourceId, {
        currentFarmId: newFarmId,
        status: 'EN_ROUTE',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle delete / retire
  const handleDelete = async (resourceId: number, resourceName: string) => {
    if (!confirm(`Are you sure you want to retire "${resourceName}" from the fleet?`)) return;
    if (onDeleteResource) {
      await onDeleteResource(resourceId);
    } else {
      await fetch(`/api/resources/${resourceId}/delete`, { method: 'POST' });
    }
  };

  // Handle create equipment
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await onAddResource({
        name: newName.trim(),
        type: newType,
        currentFarmId: newFarmId,
        fuelOrBattery: 100,
        model: newModel.trim() || 'Standard Implement',
      });
      setShowAddModal(false);
      setNewName('');
      setNewModel('');
    } finally {
      setSubmitting(false);
    }
  };

  // Metric counts
  const totalCount = resources.length;
  const idleCount = resources.filter((r) => r.status === 'IDLE').length;
  const taskAssignedCount = resources.filter((r) => r.status === 'BUSY').length;
  const repairCount = resources.filter((r) => r.status === 'MAINTENANCE').length;
  const changePostCount = resources.filter((r) => r.status === 'EN_ROUTE').length;

  return (
    <div className="space-y-4">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Fleet & Equipment Operations</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Realtime equipment inventory, active work assignments, station posts, and operational status management
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          + Add Equipment
        </button>
      </div>

      {/* Excel Toolbar & Filters Bar */}
      <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <span className="text-xs font-semibold text-stone-500">Search:</span>
            <input
              type="text"
              placeholder="Search by name, model, station, or job..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-md border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:border-stone-500"
            />
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 text-[11px] text-stone-600 font-mono">
            <span>Total: <strong>{totalCount}</strong></span>
            <span>|</span>
            <span>Idle: <strong className="text-stone-700">{idleCount}</strong></span>
            <span>|</span>
            <span>Task Assigned: <strong className="text-amber-700">{taskAssignedCount}</strong></span>
            <span>|</span>
            <span>In Repair: <strong className="text-red-700">{repairCount}</strong></span>
            <span>|</span>
            <span>Change Post: <strong className="text-blue-700">{changePostCount}</strong></span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-stone-100 text-xs">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Type:</span>
            <div className="inline-flex rounded-md border border-stone-300 bg-stone-100 p-0.5">
              {['ALL', 'TRACTOR', 'HARVESTER', 'DRONE', 'WORKER'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                    filterType === t
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {t === 'ALL' ? 'All' : t === 'HARVESTER' ? 'Harvester/Sprayer' : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sector Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Station Post:</span>
            <select
              value={filterFarmId}
              onChange={(e) => setFilterFarmId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="text-xs px-2.5 py-1 rounded-md border border-stone-300 bg-white focus:outline-none focus:border-stone-500 font-medium"
            >
              <option value="ALL">All Stations ({resources.length})</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} - {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-md border border-stone-300 bg-white focus:outline-none focus:border-stone-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="IDLE">Idle</option>
              <option value="BUSY">Task Assigned</option>
              <option value="MAINTENANCE">In Repair</option>
              <option value="EN_ROUTE">Change Post</option>
            </select>
          </div>

          {(searchQuery || filterType !== 'ALL' || filterFarmId !== 'ALL' || filterStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('ALL');
                setFilterFarmId('ALL');
                setFilterStatus('ALL');
              }}
              className="text-[11px] text-stone-500 hover:text-stone-900 underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Simple Excel-Like Table */}
      <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-300 select-none">
                <th className="py-2.5 px-3 w-10 text-center border-r border-stone-200">#</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-stone-200">Asset Name</th>
                <th className="py-2.5 px-3 min-w-[110px] border-r border-stone-200">Type</th>
                <th className="py-2.5 px-3 min-w-[180px] border-r border-stone-200">Station Post</th>
                <th className="py-2.5 px-3 min-w-[260px] border-r border-stone-200">Assigned Job (Realtime Dynamic)</th>
                <th className="py-2.5 px-3 min-w-[130px] border-r border-stone-200">Current Status</th>
                <th className="py-2.5 px-3 min-w-[220px] border-r border-stone-200">Update Status</th>
                <th className="py-2.5 px-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-normal">
              {filteredResources.map((r, idx) => {
                const farm = farms.find((f) => f.id === r.currentFarmId);
                const assignedJob = getAssignedJob(r.id);
                const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.IDLE;
                const isBusy = updatingId === r.id;

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-stone-50/90 transition-colors ${
                      idx % 2 === 1 ? 'bg-stone-50/30' : 'bg-white'
                    }`}
                  >
                    {/* # Index */}
                    <td className="py-2.5 px-3 text-center text-stone-400 font-mono text-[11px] border-r border-stone-200">
                      {idx + 1}
                    </td>

                    {/* Asset Name */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <div className="font-semibold text-stone-900 leading-snug">{r.name}</div>
                      <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                        {r.model || 'Standard Implement'}
                        {r.serialNumber ? ` • ${r.serialNumber}` : ''}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-stone-100 text-stone-700 border border-stone-200">
                        {r.type}
                      </span>
                    </td>

                    {/* Station Post */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <div className="flex items-center justify-between gap-1.5">
                        <div>
                          <div className="font-semibold text-stone-900 text-[11px]">
                            {farm?.code || `SEC-0${r.currentFarmId}`}
                          </div>
                          <div className="text-[10px] text-stone-500 truncate max-w-[140px]">
                            {farm?.name.split(' - ')[0] || `Farm #${r.currentFarmId}`}
                          </div>
                        </div>

                        {/* Inline Change Post Dropdown */}
                        <select
                          disabled={isBusy}
                          value={r.currentFarmId}
                          onChange={(e) => handlePostChange(r.id, Number(e.target.value))}
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

                    {/* Assigned Job (Realtime Dynamic) */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      {assignedJob ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-stone-900 leading-snug">
                            {assignedJob.title}
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono flex items-center gap-2">
                            <span>{assignedJob.category}</span>
                            <span>•</span>
                            <span>{assignedJob.fieldSection}</span>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                assignedJob.status === 'IN_PROGRESS'
                                  ? 'text-amber-700'
                                  : assignedJob.status === 'PAUSED_BY_AI'
                                  ? 'text-red-700'
                                  : 'text-stone-700'
                              }`}
                            >
                              {assignedJob.status === 'IN_PROGRESS'
                                ? `${assignedJob.progressPercent}% active`
                                : assignedJob.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-stone-400 font-mono text-[11px] italic">
                          None (Standby)
                        </span>
                      )}
                    </td>

                    {/* Current Status */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Update Status Actions */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <div className="flex items-center gap-1.5">
                        <select
                          disabled={isBusy}
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value as StatusType)}
                          className="text-[11px] py-1 px-2 bg-white border border-stone-300 rounded font-medium text-stone-800 hover:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        >
                          <option value="IDLE">Idle</option>
                          <option value="BUSY">Task Assigned</option>
                          <option value="MAINTENANCE">In Repair</option>
                          <option value="EN_ROUTE">Change Post</option>
                        </select>

                        {/* Quick 1-Click Status Update Buttons */}
                        {r.status !== 'IDLE' && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleStatusChange(r.id, 'IDLE')}
                            title="Set Idle"
                            className="text-[10px] px-1.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-stone-700 font-medium"
                          >
                            Set Idle
                          </button>
                        )}

                        {r.status !== 'MAINTENANCE' && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleStatusChange(r.id, 'MAINTENANCE')}
                            title="Set In Repair"
                            className="text-[10px] px-1.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-700 font-medium"
                          >
                            Repair
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDelete(r.id, r.name)}
                        className="text-[11px] text-red-600 hover:text-red-800 hover:underline font-medium"
                      >
                        Retire
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredResources.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                    No equipment records match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Excel Status Bar Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-stone-500 font-mono">
          <div>
            Showing {filteredResources.length} of {resources.length} fleet records
          </div>
          <div className="flex items-center gap-4">
            <span>Status Codes: IDLE | BUSY (Assigned) | MAINTENANCE (Repair) | EN_ROUTE (Change Post)</span>
          </div>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 border border-stone-300">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Register New Equipment</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Equipment Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Deere 9RX - Unit 05"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
                  >
                    <option value="TRACTOR">Tractor</option>
                    <option value="HARVESTER">Harvester / Sprayer</option>
                    <option value="DRONE">Drone</option>
                    <option value="WORKER">Worker / Operator</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Station Post</label>
                  <select
                    value={newFarmId}
                    onChange={(e) => setNewFarmId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name.split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Model / Implement Specs</label>
                <input
                  type="text"
                  placeholder="e.g. 410 HP Guidance RTK"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
                />
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
                  {submitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

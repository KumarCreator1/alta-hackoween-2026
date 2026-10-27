'use client';

import React, { useState, useMemo } from 'react';
import WeatherConstraintMatrix from '@/components/WeatherConstraintMatrix';
import type { Task, Farm, Resource } from '@/db/schema';

interface TasksViewProps {
  tasks: Task[];
  farms: Farm[];
  resources: Resource[];
  onOpenAddTask: () => void;
  onUpdateTask: (taskId: number, data: Record<string, unknown>) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
  onRefresh?: () => void;
}

type TaskStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED_BY_AI' | 'COMPLETED' | 'CANCELLED';

const PRIORITY_CONFIG: Record<number, { label: string; bg: string; text: string; border: string }> = {
  1: { label: 'P1 Urgent', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  2: { label: 'P2 High', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  3: { label: 'P3 Normal', bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-300' },
  4: { label: 'P4 Low', bg: 'bg-stone-50', text: 'text-stone-500', border: 'border-stone-200' },
};

export default function TasksView({
  tasks,
  farms,
  resources,
  onOpenAddTask,
  onUpdateTask,
  onDeleteTask,
  onRefresh,
}: TasksViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmFilter, setSelectedFarmFilter] = useState<number | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GROUPED'>('TABLE');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'SCHEDULE' | 'NAME'>('PRIORITY');
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [showConstraintMatrix, setShowConstraintMatrix] = useState<boolean>(true);

  // Inline editing schedule slot
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editingSlotValue, setEditingSlotValue] = useState<string>('');

  // Check if a worker is already busy on another task in the exact same scheduled slot
  const isWorkerBusyInSlot = (workerId: number, currentTaskId: number, slot: string) => {
    return tasks.some(
      (t) =>
        t.id !== currentTaskId &&
        t.assignedResourceId === workerId &&
        t.scheduledSlot.trim().toLowerCase() === slot.trim().toLowerCase() &&
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELLED'
    );
  };

  // Filtered and Ordered Tasks
  const orderedTasks = useMemo(() => {
    const list = tasks.filter((t) => {
      if (selectedFarmFilter !== 'ALL' && t.farmId !== selectedFarmFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'NEEDS_VERIFICATION') {
          if (!t.workerCompletedAt || t.verifiedByOwner) return false;
        } else if (statusFilter === 'COMPLETED') {
          if (t.status !== 'COMPLETED') return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const farm = farms.find((f) => f.id === t.farmId);
        const resource = resources.find((r) => r.id === t.assignedResourceId);
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesSection = t.fieldSection?.toLowerCase().includes(q);
        const matchesCategory = t.category?.toLowerCase().includes(q);
        const matchesFarm = farm?.code.toLowerCase().includes(q) || farm?.name.toLowerCase().includes(q);
        const matchesResource = resource?.name.toLowerCase().includes(q);
        return matchesTitle || matchesSection || matchesCategory || matchesFarm || matchesResource;
      }
      return true;
    });

    // Sort order
    return list.sort((a, b) => {
      if (sortBy === 'PRIORITY') {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.scheduledSlot.localeCompare(b.scheduledSlot);
      }
      if (sortBy === 'SCHEDULE') {
        return a.scheduledSlot.localeCompare(b.scheduledSlot);
      }
      return a.title.localeCompare(b.title);
    });
  }, [tasks, selectedFarmFilter, priorityFilter, statusFilter, searchQuery, sortBy, farms, resources]);

  // Handler for quick status change
  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    setUpdatingTaskId(taskId);
    try {
      await onUpdateTask(taskId, { status });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Handler for priority change
  const handlePriorityChange = async (taskId: number, priority: number) => {
    setUpdatingTaskId(taskId);
    try {
      await onUpdateTask(taskId, { priority });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Handler for employee re-assignment (filtered for available at that farm)
  const handleEmployeeChange = async (taskId: number, assignedResourceId: number | null) => {
    setUpdatingTaskId(taskId);
    try {
      await onUpdateTask(taskId, { assignedResourceId });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Handler for inline schedule update
  const handleSaveSlot = async (taskId: number) => {
    if (!editingSlotValue.trim()) return;
    setUpdatingTaskId(taskId);
    try {
      await onUpdateTask(taskId, { scheduledSlot: editingSlotValue.trim() });
      setEditingSlotId(null);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 1. Employee Action: Mark Done as Worker
  const handleWorkerMarkDone = async (task: Task) => {
    setUpdatingTaskId(task.id);
    const nowTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      await onUpdateTask(task.id, {
        workerCompletedAt: nowTimestamp,
        progressPercent: 100,
        status: 'IN_PROGRESS',
        verificationNotes: `Worker submitted completion report at ${nowTimestamp}. Awaiting owner field verification.`,
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 2. Owner Action: Verify and Mark Completely Done
  const handleOwnerVerifyComplete = async (task: Task) => {
    setUpdatingTaskId(task.id);
    try {
      await onUpdateTask(task.id, {
        verifiedByOwner: true,
        status: 'COMPLETED',
        progressPercent: 100,
        verificationNotes: `Verified and confirmed by Owner. Mission completed.`,
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 3. Owner Action: Reject / Send Back (if employee lied or task is incomplete)
  const handleOwnerReject = async (task: Task) => {
    setUpdatingTaskId(task.id);
    try {
      await onUpdateTask(task.id, {
        workerCompletedAt: null,
        verifiedByOwner: false,
        status: 'IN_PROGRESS',
        progressPercent: 50,
        verificationNotes: 'Owner rejected completion claim. Work failed inspection; returned to In Progress.',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 4. AI Override / Resume: Resume paused task
  const handleAIOverrideResume = async (task: Task) => {
    setUpdatingTaskId(task.id);
    try {
      await onUpdateTask(task.id, {
        status: 'IN_PROGRESS',
        aiReasoning: 'Owner manually overrode AI pause condition after field safety assessment.',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Metric breakdown
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS' && !t.workerCompletedAt).length;
  const assignedCount = tasks.filter((t) => t.status === 'SCHEDULED').length;
  const pausedByAiCount = tasks.filter((t) => t.status === 'PAUSED_BY_AI').length;
  const needsVerificationCount = tasks.filter((t) => t.workerCompletedAt && !t.verifiedByOwner && t.status !== 'COMPLETED').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED' || t.verifiedByOwner).length;

  return (
    <div className="space-y-4">
      {/* Productivity App Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Work Orders & Operations Dispatch</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Ordered operational schedule, intelligent employee slot assignment, AI conflict management, and dual-tier owner verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-md border border-stone-300 bg-stone-100 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                viewMode === 'TABLE' ? 'bg-white text-stone-900 font-semibold shadow-2xs' : 'text-stone-600'
              }`}
            >
              Ordered Table
            </button>
            <button
              onClick={() => setViewMode('GROUPED')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                viewMode === 'GROUPED' ? 'bg-white text-stone-900 font-semibold shadow-2xs' : 'text-stone-600'
              }`}
            >
              Grouped Status
            </button>
          </div>

          <button
            onClick={onOpenAddTask}
            className="inline-flex items-center justify-center px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            + New Work Order
          </button>
        </div>
      </div>

      {showConstraintMatrix && (
        <WeatherConstraintMatrix farms={farms} tasks={tasks} onRefresh={onRefresh || (() => {})} />
      )}

      {/* Productivity Status Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`p-3 rounded-lg border text-left transition-colors ${
            statusFilter === 'IN_PROGRESS' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">In Progress</div>
          <div className="text-xl font-bold mt-0.5 text-amber-700">{inProgressCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'SCHEDULED' ? 'ALL' : 'SCHEDULED')}
          className={`p-3 rounded-lg border text-left transition-colors ${
            statusFilter === 'SCHEDULED' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Assigned / Queue</div>
          <div className="text-xl font-bold mt-0.5 text-stone-800">{assignedCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'NEEDS_VERIFICATION' ? 'ALL' : 'NEEDS_VERIFICATION')}
          className={`p-3 rounded-lg border text-left transition-colors ${
            statusFilter === 'NEEDS_VERIFICATION' ? 'bg-stone-900 text-white border-stone-900' : 'bg-purple-50/50 border-purple-200 hover:border-purple-300'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-700">Needs Owner Verification</div>
          <div className="text-xl font-bold mt-0.5 text-purple-800">{needsVerificationCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'PAUSED_BY_AI' ? 'ALL' : 'PAUSED_BY_AI')}
          className={`p-3 rounded-lg border text-left transition-colors ${
            statusFilter === 'PAUSED_BY_AI' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Paused by AI (Conflicts)</div>
          <div className="text-xl font-bold mt-0.5 text-red-700">{pausedByAiCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`p-3 rounded-lg border text-left transition-colors ${
            statusFilter === 'COMPLETED' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Verified & Complete</div>
          <div className="text-xl font-bold mt-0.5 text-emerald-800">{completedCount}</div>
        </button>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <span className="text-xs font-semibold text-stone-500">Search:</span>
            <input
              type="text"
              placeholder="Search by task title, section, category, or assigned worker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-md border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:border-stone-500"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-stone-500">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1 rounded-md border border-stone-300 bg-white font-medium focus:outline-none"
            >
              <option value="PRIORITY">Priority Order (P1 to P4)</option>
              <option value="SCHEDULE">Scheduled Time Window</option>
              <option value="NAME">Task Name</option>
            </select>
          </div>
        </div>

        {/* Filter Badges Row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-stone-100 text-xs">
          {/* Sector Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Sector:</span>
            <select
              value={selectedFarmFilter}
              onChange={(e) => setSelectedFarmFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="text-xs px-2.5 py-1 rounded-md border border-stone-300 bg-white font-medium focus:outline-none"
            >
              <option value="ALL">All Sectors ({tasks.length})</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} - {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="text-xs px-2.5 py-1 rounded-md border border-stone-300 bg-white font-medium focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value={1}>P1 Urgent</option>
              <option value={2}>P2 High</option>
              <option value={3}>P3 Normal</option>
              <option value={4}>P4 Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-md border border-stone-300 bg-white font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SCHEDULED">Assigned / Scheduled</option>
              <option value="NEEDS_VERIFICATION">Needs Owner Verification</option>
              <option value="PAUSED_BY_AI">Paused by AI</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {(searchQuery || selectedFarmFilter !== 'ALL' || priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFarmFilter('ALL');
                setPriorityFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-[11px] text-stone-500 hover:text-stone-900 underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Ordered Table View */}
      <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-300 select-none">
                <th className="py-2.5 px-3 w-16 text-center border-r border-stone-200">Priority</th>
                <th className="py-2.5 px-3 min-w-[240px] border-r border-stone-200">Task Name & Section</th>
                <th className="py-2.5 px-3 min-w-[140px] border-r border-stone-200">Schedule At</th>
                <th className="py-2.5 px-3 min-w-[220px] border-r border-stone-200">
                  Responsible Employee (Available in Slot at Farm)
                </th>
                <th className="py-2.5 px-3 min-w-[150px] border-r border-stone-200">Status</th>
                <th className="py-2.5 px-3 min-w-[280px] border-r border-stone-200">
                  Dual Verification Workflow & AI Overrides
                </th>
                <th className="py-2.5 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-normal">
              {orderedTasks.map((task, idx) => {
                const farm = farms.find((f) => f.id === task.farmId);
                const assignedResource = resources.find((r) => r.id === task.assignedResourceId);
                const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[3];
                const isBusy = updatingTaskId === task.id;

                // Intelligent filtering: Employees stationed at this farm
                const employeesAtFarm = resources.filter(
                  (r) => r.type === 'WORKER' && r.currentFarmId === task.farmId
                );
                // Machinery implements at this farm
                const implementsAtFarm = resources.filter(
                  (r) => r.type !== 'WORKER' && r.currentFarmId === task.farmId
                );
                // Other workers from different sectors
                const otherWorkers = resources.filter(
                  (r) => r.type === 'WORKER' && r.currentFarmId !== task.farmId
                );

                // Verification status computation
                const isPausedByAI = task.status === 'PAUSED_BY_AI';
                const isWorkerDone = Boolean(task.workerCompletedAt);
                const isOwnerVerified = Boolean(task.verifiedByOwner);
                const isCompleted = task.status === 'COMPLETED' || isOwnerVerified;
                const needsVerification = isWorkerDone && !isOwnerVerified && !isCompleted;

                // Check for weather conflict at the farm
                const hasWeatherConflict =
                  farm &&
                  (farm.weatherStatus.includes('RAIN') ||
                    farm.weatherStatus.includes('STORM') ||
                    farm.weatherStatus.includes('WARNING'));

                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-stone-50/90 transition-colors ${
                      isPausedByAI
                        ? 'bg-red-50/20'
                        : needsVerification
                        ? 'bg-purple-50/20'
                        : idx % 2 === 1
                        ? 'bg-stone-50/30'
                        : 'bg-white'
                    }`}
                  >
                    {/* Priority Order */}
                    <td className="py-2.5 px-3 border-r border-stone-200 text-center">
                      <select
                        disabled={isBusy}
                        value={task.priority}
                        onChange={(e) => handlePriorityChange(task.id, Number(e.target.value))}
                        className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border focus:outline-none ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}
                      >
                        <option value={1}>P1</option>
                        <option value={2}>P2</option>
                        <option value={3}>P3</option>
                        <option value={4}>P4</option>
                      </select>
                    </td>

                    {/* Task Name & Location */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <div className="font-semibold text-stone-900 leading-snug">{task.title}</div>
                      <div className="text-[11px] text-stone-500 font-mono flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-stone-700">{farm?.code || `SEC-0${task.farmId}`}</span>
                        <span>•</span>
                        <span>{task.category}</span>
                        <span>•</span>
                        <span>{task.fieldSection || 'Section A'}</span>
                        {task.targetHectares ? (
                          <>
                            <span>•</span>
                            <span>{task.targetHectares} Ha</span>
                          </>
                        ) : null}
                      </div>

                      {/* AI Reasoning / Overwrite Banner */}
                      {task.aiReasoning && (
                        <div className="mt-1 px-2 py-0.5 bg-stone-100 rounded text-[10px] text-stone-700 border border-stone-200 font-mono">
                          <strong className="text-stone-900">AI Note:</strong> {task.aiReasoning}
                        </div>
                      )}

                      {/* Environmental Weather Warning Conflict */}
                      {hasWeatherConflict && !isPausedByAI && (
                        <div className="mt-1 px-2 py-0.5 bg-amber-50 rounded text-[10px] text-amber-800 border border-amber-200 font-mono">
                          <strong>Weather Alert:</strong> {farm?.weatherStatus} (Wash-off conflict possible)
                        </div>
                      )}
                    </td>

                    {/* Schedule At */}
                    <td className="py-2.5 px-3 border-r border-stone-200 font-mono">
                      {editingSlotId === task.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingSlotValue}
                            onChange={(e) => setEditingSlotValue(e.target.value)}
                            className="text-[11px] px-1.5 py-0.5 border border-stone-300 rounded w-28 bg-white"
                          />
                          <button
                            onClick={() => handleSaveSlot(task.id)}
                            className="text-[10px] px-1.5 py-0.5 bg-stone-900 text-white rounded font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1 group">
                          <span className="text-[11px] font-semibold text-stone-800">
                            {task.scheduledSlot}
                          </span>
                          <button
                            onClick={() => {
                              setEditingSlotId(task.id);
                              setEditingSlotValue(task.scheduledSlot);
                            }}
                            className="text-[10px] text-stone-400 hover:text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Responsible Employee (Only available in that slot at that farm) */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <select
                        disabled={isBusy}
                        value={task.assignedResourceId || ''}
                        onChange={(e) =>
                          handleEmployeeChange(task.id, e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-full text-[11px] px-2 py-1 bg-white border border-stone-300 rounded font-medium text-stone-800 focus:outline-none focus:border-stone-500 truncate"
                      >
                        <option value="">-- Unassigned (Standby) --</option>

                        {/* Stationed Employees */}
                        {employeesAtFarm.length > 0 && (
                          <optgroup label={`Stationed at ${farm?.code || 'This Farm'}`}>
                            {employeesAtFarm.map((emp) => {
                              const isBusySlot = isWorkerBusyInSlot(emp.id, task.id, task.scheduledSlot);
                              return (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} {isBusySlot ? '(Busy in Slot)' : '(Available)'}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}

                        {/* Implement machinery */}
                        {implementsAtFarm.length > 0 && (
                          <optgroup label={`Implements at ${farm?.code || 'This Farm'}`}>
                            {implementsAtFarm.map((imp) => (
                              <option key={imp.id} value={imp.id}>
                                {imp.name} ({imp.type})
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {/* Remote / Other Farm workers */}
                        {otherWorkers.length > 0 && (
                          <optgroup label="Workers at Other Sectors">
                            {otherWorkers.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} (Stationed at Farm #{emp.currentFarmId})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>

                      {assignedResource && (
                        <div className="text-[10px] text-stone-500 font-mono mt-0.5 truncate">
                          Current: {assignedResource.name} ({assignedResource.type})
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      {isPausedByAI ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 border border-red-300">
                          Paused by AI
                        </span>
                      ) : needsVerification ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                          Needs Verification
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Completed
                        </span>
                      ) : task.status === 'IN_PROGRESS' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          In Progress ({task.progressPercent}%)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-300">
                          Assigned
                        </span>
                      )}
                    </td>

                    {/* Dual Verification Workflow & AI Overrides */}
                    <td className="py-2.5 px-3 border-r border-stone-200">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* 1. Worker Action: Mark Done */}
                        {!isWorkerDone && !isCompleted && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleWorkerMarkDone(task)}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-[10px] font-medium text-stone-800"
                            title="Worker submits completion for manager review"
                          >
                            Mark Done (Worker)
                          </button>
                        )}

                        {/* 2. Owner Action: Verify and Complete */}
                        {needsVerification && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleOwnerVerifyComplete(task)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold shadow-2xs"
                            title="Owner confirms work was legitimately inspected and completed"
                          >
                            Verify & Approve
                          </button>
                        )}

                        {/* 3. Owner Action: Reject if worker lied or task incomplete */}
                        {needsVerification && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleOwnerReject(task)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-[10px] font-medium text-red-700"
                            title="Reject worker completion claim and send back to In Progress"
                          >
                            Reject Claim
                          </button>
                        )}

                        {/* 4. AI Overwrite: Resume / Override if paused by AI */}
                        {isPausedByAI && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleAIOverrideResume(task)}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shadow-2xs"
                            title="Owner manually overrides AI pause rule"
                          >
                            AI Override (Resume)
                          </button>
                        )}

                        {/* Quick Status toggle between Assigned and In-Progress */}
                        {task.status === 'SCHEDULED' && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                            className="px-2 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-[10px] font-medium text-stone-700"
                          >
                            Start Ops
                          </button>
                        )}

                        {/* Direct Owner Complete if already confirmed */}
                        {!isCompleted && !needsVerification && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleOwnerVerifyComplete(task)}
                            className="px-2 py-1 text-[10px] text-stone-500 hover:text-stone-800 underline"
                          >
                            Direct Complete
                          </button>
                        )}

                        {isCompleted && (
                          <span className="text-[10px] text-emerald-700 font-mono font-medium">
                            Verified by Owner
                          </span>
                        )}
                      </div>

                      {/* Verification Notes Log */}
                      {task.verificationNotes && (
                        <div className="text-[10px] text-stone-500 font-mono mt-0.5 truncate max-w-[260px]">
                          {task.verificationNotes}
                        </div>
                      )}
                    </td>

                    {/* Delete Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        disabled={isBusy}
                        onClick={() => {
                          if (confirm(`Cancel and purge work order "${task.title}"?`)) {
                            onDeleteTask(task.id);
                          }
                        }}
                        className="text-[11px] text-red-600 hover:text-red-800 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {orderedTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400 text-xs">
                    No work orders found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Productivity Table Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-stone-500 font-mono">
          <div>
            Showing {orderedTasks.length} of {tasks.length} total work orders
          </div>
          <div className="flex items-center gap-3">
            <span>Workflow: Assigned &rarr; In Progress &rarr; Worker Done &rarr; Owner Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

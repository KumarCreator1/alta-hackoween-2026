'use client';

import React, { useState } from 'react';
import type { Task, Farm, Resource } from '@/db/schema';
import { Plus, Play, Pause, CheckCircle2, Trash2, Clock, AlertTriangle, Filter, Layers } from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  farms: Farm[];
  resources: Resource[];
  onOpenAddTask: () => void;
  onUpdateTask: (
    taskId: number,
    data: {
      status?: 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED_BY_AI' | 'COMPLETED' | 'CANCELLED';
      progressPercent?: number;
    }
  ) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
}

export default function TasksView({
  tasks,
  farms,
  resources,
  onOpenAddTask,
  onUpdateTask,
  onDeleteTask,
}: TasksViewProps) {
  const [selectedFarmFilter, setSelectedFarmFilter] = useState<number | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredTasks = tasks.filter((t) => {
    if (selectedFarmFilter !== 'ALL' && t.farmId !== selectedFarmFilter) return false;
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    return true;
  });

  const scheduledCount = tasks.filter((t) => t.status === 'SCHEDULED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const pausedCount = tasks.filter((t) => t.status === 'PAUSED_BY_AI').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Work Orders & Operations Dispatch</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            ACID relational tasks, telemetry progress tracking, and autonomous conflict resolution
          </p>
        </div>

        <button
          onClick={onOpenAddTask}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#134E35] hover:bg-[#0D3826] text-white text-xs font-bold rounded-2xl shadow-xs transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* 4 Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter(statusFilter === 'SCHEDULED' ? 'ALL' : 'SCHEDULED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'SCHEDULED' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200/80 hover:border-stone-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-stone-400">Scheduled Queue</div>
          <div className="text-2xl font-bold mt-1">{scheduledCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'IN_PROGRESS' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-stone-200/80 hover:border-stone-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-stone-400">Active Field Ops</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'PAUSED_BY_AI' ? 'ALL' : 'PAUSED_BY_AI')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PAUSED_BY_AI' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-stone-200/80 hover:border-stone-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-stone-400">Paused by AI (Conflicts)</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{pausedCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'COMPLETED' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white border-stone-200/80 hover:border-stone-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-stone-400">Completed Shifts</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
        {/* Farm Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Sector:
          </span>
          <button
            onClick={() => setSelectedFarmFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedFarmFilter === 'ALL'
                ? 'bg-[#134E35] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-50'
            }`}
          >
            All Sectors ({tasks.length})
          </button>
          {farms.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFarmFilter(f.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedFarmFilter === f.id
                  ? 'bg-[#134E35] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-50'
              }`}
            >
              {f.code || f.name.split(' - ')[0]}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3" /> Type:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:border-emerald-700"
          >
            <option value="ALL">All Operations</option>
            <option value="TILLAGE">Tillage & Prep</option>
            <option value="SPRAYING">Spraying & Fertilizing</option>
            <option value="IRRIGATION">Irrigation Monitoring</option>
            <option value="SURVEY">Aerial Drone Survey</option>
            <option value="FIELD_OPS">General Field Ops</option>
          </select>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => {
          const farm = farms.find((f) => f.id === task.farmId);
          const resource = resources.find((r) => r.id === task.assignedResourceId);
          const isPaused = task.status === 'PAUSED_BY_AI';
          const isInProgress = task.status === 'IN_PROGRESS';
          const isDone = task.status === 'COMPLETED';

          return (
            <div
              key={task.id}
              className={`donezo-card p-5 space-y-3.5 flex flex-col justify-between transition-all ${
                isPaused ? 'border-red-300 bg-red-50/20' : 'hover:border-stone-300'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                      P{task.priority}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                      {farm?.code || farm?.name.split(' - ')[0] || `Sector #${task.farmId}`}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      {task.category || 'FIELD_OPS'}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-bold font-mono px-2.5 py-0.5 rounded-md ${
                      isPaused
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : isInProgress
                        ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                        : isDone
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-stone-900 mt-2 leading-snug">
                  {task.title}
                </h3>

                {/* Section & Slot */}
                <div className="flex items-center gap-3 text-xs text-stone-500 mt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" /> {task.scheduledSlot}
                  </span>
                  <span>•</span>
                  <span>{task.fieldSection || 'Zone A'} ({task.targetHectares || 25} Ha)</span>
                </div>

                {/* Assigned Asset */}
                <div className="mt-3 p-2.5 bg-stone-50/80 rounded-xl border border-stone-200/70 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Assigned Implement:</span>
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>{resource ? (resource.type === 'TRACTOR' ? '🚜' : resource.type === 'DRONE' ? '🛸' : resource.type === 'WORKER' ? '👷' : '🌾') : '⚠️'}</span>
                    <span>{resource ? resource.name : 'Unassigned (Dispatch Pending)'}</span>
                  </span>
                </div>

                {/* AI Reasoning Banner if Paused or Emergency */}
                {task.aiReasoning && (
                  <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    isPaused ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>AI Decision:</strong> {task.aiReasoning}
                    </p>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500">Operation Completion</span>
                    <span className="font-mono font-bold text-stone-700">{task.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone ? 'bg-emerald-600' : isInProgress ? 'bg-amber-500' : 'bg-stone-400'
                      }`}
                      style={{ width: `${task.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                <div className="flex items-center gap-1.5">
                  {!isInProgress && !isDone && (
                    <button
                      onClick={() => onUpdateTask(task.id, { status: 'IN_PROGRESS', progressPercent: Math.max(10, task.progressPercent) })}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3" /> Start
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => onUpdateTask(task.id, { status: 'SCHEDULED' })}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Pause className="w-3 h-3" /> Pause
                    </button>
                  )}

                  {!isDone && (
                    <button
                      onClick={() => onUpdateTask(task.id, { status: 'COMPLETED', progressPercent: 100 })}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Complete
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onDeleteTask(task.id)}
                  title="Delete work order"
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="col-span-2 text-center py-16 bg-white rounded-3xl border border-dashed border-stone-200 text-stone-400">
            <p className="text-sm font-semibold">No work orders match the selected filters.</p>
            <button
              onClick={onOpenAddTask}
              className="mt-3 px-4 py-2 bg-[#134E35] text-white text-xs font-bold rounded-xl"
            >
              + Create First Work Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

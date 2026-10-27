'use client';

import React, { useState } from 'react';
import type { Farm, Resource, Task, IncidentTicket } from '@/db/schema';
import LeafUploader from '@/components/LeafUploader';
import {
  CloudRain,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Tractor,
  Play,
  RotateCcw,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface SimpleDashboardProps {
  farms: Farm[];
  resources: Resource[];
  tasks: Task[];
  tickets: IncidentTicket[];
  onUpdateTask: (taskId: number, data: Record<string, unknown>) => Promise<void>;
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
  onOpenAddTask: () => void;
  onRefresh: () => void;
}

export default function SimpleDashboard({
  farms,
  resources,
  tasks,
  tickets,
  onUpdateTask,
  onTriggerCrisis,
  onOpenAddTask,
  onRefresh,
}: SimpleDashboardProps) {
  const [selectedFarmFilter, setSelectedFarmFilter] = useState<number | 'ALL'>('ALL');
  const [dispatchingResourceId, setDispatchingResourceId] = useState<number>(resources[0]?.id || 1);
  const [dispatchTargetFarmId, setDispatchTargetFarmId] = useState<number>(farms[1]?.id || 2);
  const [dispatching, setDispatching] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  // Find tasks paused by weather or AI
  const pausedTasks = tasks.filter((t) => t.status === 'PAUSED_BY_AI');
  const activeWeatherAlertFarm = farms.find((f) =>
    f.weatherStatus.toLowerCase().includes('rain') || f.weatherStatus.toLowerCase().includes('storm')
  );

  // Filter tasks
  const visibleTasks = tasks.filter((t) => {
    if (selectedFarmFilter !== 'ALL' && t.farmId !== selectedFarmFilter) return false;
    return true;
  });

  // Task Actions
  const handleQuickStatus = async (taskId: number, newStatus: Task['status'], extra: Record<string, unknown> = {}) => {
    setUpdatingTaskId(taskId);
    try {
      await onUpdateTask(taskId, { status: newStatus, ...extra });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Cross-farm equipment dispatch
  const handleCrossFarmDispatch = async () => {
    setDispatching(true);
    try {
      await fetch(`/api/resources/${dispatchingResourceId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'EN_ROUTE',
          currentFarmId: dispatchTargetFarmId,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setDispatching(false);
    }
  };

  // Quick weather simulation
  const handleToggleWeather = async (farmId: number, currentStatus: string) => {
    const isRain = currentStatus.toLowerCase().includes('rain') || currentStatus.toLowerCase().includes('storm');
    const newCondition = isRain ? 'Clear Skies, 28°C' : 'HEAVY_RAIN_WARNING';
    await onTriggerCrisis('WEATHER_WEBHOOK', farmId, { condition: newCondition });
    onRefresh();
  };

  // Quick crop disease assay upload
  const handleLeafUpload = async (base64: string) => {
    const targetFarm = farms[1]?.id || farms[0]?.id || 1;
    await onTriggerCrisis('CV_DISEASE_REPORT', targetFarm, {
      disease: 'Late Blight Fungus',
      imageBase64: base64,
    });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Clear Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Farm Operations
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Weather, soil, crop health, and scheduled tasks coordinated across your farms.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleToggleWeather(farms[0]?.id || 1, farms[0]?.weatherStatus || 'Clear')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors flex items-center gap-1.5"
          >
            <CloudRain className="w-3.5 h-3.5 text-amber-700" />
            <span>Simulate Weather Shift</span>
          </button>

          <button
            onClick={onOpenAddTask}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Donezo Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Farms Monitored
          </span>
          <div className="text-2xl font-bold text-stone-900 mt-1">{farms.length} Sectors</div>
          <p className="text-[11px] text-stone-500 mt-0.5">All telemetry connected</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Active Tasks
          </span>
          <div className="text-2xl font-bold text-stone-900 mt-1">{tasks.length} Operations</div>
          <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            {tasks.filter((t) => t.status === 'IN_PROGRESS').length} in progress today
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Machinery & Crew
          </span>
          <div className="text-2xl font-bold text-stone-900 mt-1">{resources.length} Units</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Tractors, drones, and crew</p>
        </div>

        <div
          className={`rounded-xl p-4 border shadow-2xs transition-colors ${
            pausedTasks.length > 0 || activeWeatherAlertFarm
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-white border-stone-200'
          }`}
        >
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Weather Status
          </span>
          <div className="text-2xl font-bold text-stone-900 mt-1">
            {pausedTasks.length > 0 ? `${pausedTasks.length} Paused` : 'Clear & Optimal'}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {pausedTasks.length > 0 ? 'Chemical wash-off protection' : 'No operational conflicts'}
          </p>
        </div>
      </div>

      {/* 3. Weather / Conflict Dynamic Alert Banner */}
      {pausedTasks.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <CloudRain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-900">
                Weather Conflict: {pausedTasks.length} task(s) paused to protect farm inputs
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {pausedTasks[0]?.aiReasoning ||
                  'Precipitation will wash chemical spray into runoff. Tasks held until weather clears.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleQuickStatus(pausedTasks[0].id, 'IN_PROGRESS', { aiReasoning: 'Resumed by manager' })}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-800 hover:bg-amber-900 text-white shadow-2xs transition-colors"
            >
              Resume Task
            </button>
            <button
              onClick={() => handleToggleWeather(pausedTasks[0].farmId, 'HEAVY_RAIN_WARNING')}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-amber-400 bg-white hover:bg-amber-50 text-amber-900 transition-colors"
            >
              Clear Rain Alert
            </button>
          </div>
        </div>
      )}

      {/* 4. Main 2-Column Working Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 Cols): Today's Schedule & Actionable Tasks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  Today&apos;s Field Schedule
                </h2>
                <p className="text-xs text-stone-500">
                  Work orders and resource assignments
                </p>
              </div>

              {/* Farm Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-400 font-medium">Farm:</span>
                <select
                  value={selectedFarmFilter}
                  onChange={(e) =>
                    setSelectedFarmFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                  }
                  className="px-2 py-1 rounded border border-stone-200 bg-stone-50 font-medium text-stone-800 focus:outline-none"
                >
                  <option value="ALL">All Farms ({tasks.length})</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name.split(' - ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tasks List */}
            <div className="divide-y divide-stone-100">
              {visibleTasks.map((task) => {
                const farm = farms.find((f) => f.id === task.farmId);
                const resource = resources.find((r) => r.id === task.assignedResourceId);
                const isPaused = task.status === 'PAUSED_BY_AI';
                const isInProgress = task.status === 'IN_PROGRESS';
                const isCompleted = task.status === 'COMPLETED';
                const needsVerification = task.workerCompletedAt && !task.verifiedByOwner;
                const isBusy = updatingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isPaused ? 'bg-amber-50/40 px-2 rounded-lg my-1' : ''
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-mono">
                          {farm?.code || `FARM-${task.farmId}`}
                        </span>
                        <h3 className="text-xs font-bold text-stone-900 truncate">
                          {task.title}
                        </h3>
                        <span className="text-[10px] text-stone-400 font-mono">
                          P{task.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-stone-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {task.scheduledSlot}
                        </span>
                        <span>•</span>
                        <span>Assigned: {resource?.name || 'Unassigned'}</span>
                        {task.targetHectares ? (
                          <>
                            <span>•</span>
                            <span>{task.targetHectares} Ha</span>
                          </>
                        ) : null}
                      </div>

                      {/* Paused Explanation */}
                      {isPaused && (
                        <p className="text-[11px] text-amber-800 font-medium">
                          Paused: {task.aiReasoning || 'Weather conflict detected.'}
                        </p>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPaused ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          Paused (Rain)
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Completed
                        </span>
                      ) : needsVerification ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          Needs Review
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          In Progress
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          Scheduled
                        </span>
                      )}

                      {/* Quick Action Button */}
                      {isPaused ? (
                        <button
                          disabled={isBusy}
                          onClick={() => handleQuickStatus(task.id, 'IN_PROGRESS', { aiReasoning: 'Resumed manually' })}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-900 hover:bg-stone-800 text-white transition-colors"
                        >
                          Resume
                        </button>
                      ) : needsVerification ? (
                        <button
                          disabled={isBusy}
                          onClick={() =>
                            handleQuickStatus(task.id, 'COMPLETED', {
                              verifiedByOwner: true,
                              verificationNotes: 'Verified and approved by owner.',
                            })
                          }
                          className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                        >
                          Approve
                        </button>
                      ) : isInProgress ? (
                        <button
                          disabled={isBusy}
                          onClick={() =>
                            handleQuickStatus(task.id, 'COMPLETED', {
                              workerCompletedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              verifiedByOwner: true,
                            })
                          }
                          className="px-2.5 py-1 text-xs font-medium rounded border border-stone-300 hover:bg-stone-50 text-stone-800 transition-colors"
                        >
                          Mark Done
                        </button>
                      ) : (
                        <button
                          disabled={isBusy}
                          onClick={() => handleQuickStatus(task.id, 'IN_PROGRESS')}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-stone-300 hover:bg-stone-50 text-stone-800 transition-colors"
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {visibleTasks.length === 0 && (
                <div className="py-8 text-center text-xs text-stone-400">
                  No tasks found for this selection.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Farm Conditions & Simple Coordination */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card A: Farm Conditions (Weather & Soil at a glance) */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h2 className="text-sm font-bold text-stone-900">
                Farm Conditions & Soil
              </h2>
              <span className="text-xs text-stone-400">{farms.length} Locations</span>
            </div>

            <div className="space-y-2.5">
              {farms.map((farm) => {
                const isRain =
                  farm.weatherStatus.toLowerCase().includes('rain') ||
                  farm.weatherStatus.toLowerCase().includes('storm');

                return (
                  <div
                    key={farm.id}
                    className="p-3 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors bg-stone-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-stone-900">
                          {farm.name.split(' - ')[0]}
                        </span>
                        <span className="text-[11px] text-stone-500 ml-1.5 font-mono">
                          ({farm.cropType.split(' ')[0]})
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleWeather(farm.id, farm.weatherStatus)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                          isRain
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                        title="Click to simulate rain or clear weather"
                      >
                        {isRain ? 'Rain Alert (Click to Clear)' : 'Clear (Click to Simulate Rain)'}
                      </button>
                    </div>

                    {/* Soil & Weather Metrics */}
                    <div className="flex items-center justify-between text-xs text-stone-600 font-mono">
                      <span>Soil Moisture: {farm.soilMoisture}%</span>
                      <span>Wind: {farm.windSpeedKmh} km/h</span>
                      <span>Temp: {farm.tempCelsius}°C</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card B: Quick Crop Disease Check */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-2.5">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Crop Health Scan
              </h3>
              <p className="text-xs text-stone-500">
                Upload a leaf image to diagnose disease and schedule treatment
              </p>
            </div>
            <LeafUploader onUpload={handleLeafUpload} />
          </div>

          {/* Card C: Cross-Farm Equipment Dispatch */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Cross-Farm Equipment Sharing
              </h3>
              <p className="text-xs text-stone-500">
                Reallocate equipment from an idle farm to a farm in need
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-1">Equipment:</label>
                <select
                  value={dispatchingResourceId}
                  onChange={(e) => setDispatchingResourceId(Number(e.target.value))}
                  className="w-full p-1.5 rounded border border-stone-200 bg-stone-50 text-stone-800"
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name.split(' - ')[0]} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-1">Send to Farm:</label>
                <select
                  value={dispatchTargetFarmId}
                  onChange={(e) => setDispatchTargetFarmId(Number(e.target.value))}
                  className="w-full p-1.5 rounded border border-stone-200 bg-stone-50 text-stone-800"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name.split(' - ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCrossFarmDispatch}
              disabled={dispatching}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Tractor className="w-3.5 h-3.5" />
              <span>{dispatching ? 'Dispatching...' : 'Dispatch Equipment'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


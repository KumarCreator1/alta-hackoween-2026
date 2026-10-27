'use client';

import React, { useState } from 'react';
import type { Resource, Task, Farm } from '@/db/schema';

interface WorkerViewProps {
  resources: Resource[];
  tasks: Task[];
  farms: Farm[];
  onUpdateTaskStatus: (taskId: number, status: 'IN_PROGRESS' | 'COMPLETED') => Promise<void>;
}

export default function WorkerView({
  resources,
  tasks,
  farms,
  onUpdateTaskStatus,
}: WorkerViewProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<number>(3); // Rohan by default
  const workers = resources.filter((r) => r.type === 'WORKER');
  const currentWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];
  const currentFarm = farms.find((f) => f.id === currentWorker?.currentFarmId);
  const workerTasks = tasks.filter((t) => t.assignedResourceId === currentWorker?.id || t.farmId === currentWorker?.currentFarmId);
  const enRoute = resources.find((r) => r.status === 'EN_ROUTE');

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Field Worker Viewport (Edge Device)</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Simulated in-cab tablet & rugged mobile phone interface carried by farm crew
          </p>
        </div>

        {/* Worker Switcher */}
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-xs">
          {workers.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWorkerId(w.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedWorkerId === w.id
                  ? 'bg-[#134E35] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tablet Simulation Container */}
      <div className="max-w-2xl mx-auto bg-gray-950 text-white rounded-[36px] p-6 shadow-2xl border-4 border-gray-800 space-y-5">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-gray-200 font-bold">5G PARALLAX EDGE LINK</span>
          </div>
          <div>STATION: {currentFarm?.name || 'Sector Alpha'}</div>
          <div>BATTERY: 98%</div>
        </div>

        {/* Operator Card */}
        <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 font-bold text-xl flex items-center justify-center">
              👷
            </div>
            <div>
              <div className="text-sm font-bold text-gray-100">{currentWorker?.name}</div>
              <div className="text-xs text-emerald-400 font-mono">Shift Active // Certified Lead Agronomist</div>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {currentWorker?.status || 'IDLE'}
          </span>
        </div>

        {/* Cross-Farm Reroute Alert if AI Triggered */}
        {enRoute && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl p-4 text-xs space-y-2 slide-up">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <span>⚡</span>
              <span>AUTONOMOUS DISPATCH ALERT // CROSS-FARM REALLOCATION</span>
            </div>
            <p className="text-gray-200 leading-relaxed">
              Gemini AI detected an emergency priority surge. <strong>{enRoute.name}</strong> has been routed to <strong>Farm #{enRoute.currentFarmId}</strong>. Maintain highway transit protocol.
            </p>
          </div>
        )}

        {/* Assigned Shift Work Orders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono px-1">
            <span>TODAY&apos;S WORK ORDERS ({workerTasks.length})</span>
            <span>REAL-TIME DATABASE SYNC</span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {workerTasks.map((t) => {
              const isPaused = t.status === 'PAUSED_BY_AI';
              const isWorking = t.status === 'IN_PROGRESS';
              const isDone = t.status === 'COMPLETED';

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPaused
                      ? 'bg-red-500/20 border-red-500/50 flash-red'
                      : isWorking
                      ? 'bg-emerald-500/15 border-emerald-500/40'
                      : isDone
                      ? 'bg-white/5 border-white/5 opacity-60'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-100">{t.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 font-mono">
                        <span>Window: {t.scheduledSlot}</span>
                        <span>•</span>
                        <span>Priority: P{t.priority}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg ${
                        isPaused
                          ? 'bg-red-500 text-white'
                          : isWorking
                          ? 'bg-emerald-500 text-gray-950'
                          : isDone
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  {isPaused && (
                    <div className="mt-2 text-xs text-red-300 bg-red-950/60 p-2.5 rounded-xl border border-red-500/30">
                      ⚠ <strong>AI INTERVENTION:</strong> Spraying halted to prevent chemical wash-off. Stand down until storm clears.
                    </div>
                  )}

                  {!isDone && !isPaused && (
                    <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-white/10">
                      {!isWorking && (
                        <button
                          onClick={() => onUpdateTaskStatus(t.id, 'IN_PROGRESS')}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          Accept & Start Engine
                        </button>
                      )}
                      {isWorking && (
                        <button
                          onClick={() => onUpdateTaskStatus(t.id, 'COMPLETED')}
                          className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-colors"
                        >
                          Mark Job Completed ✓
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


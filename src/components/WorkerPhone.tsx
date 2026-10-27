'use client';

import type { Resource, Task } from '@/db/schema';
import { useEffect, useState } from 'react';

interface WorkerPhoneProps {
  resources: Resource[];
  tasks: Task[];
}

export default function WorkerPhone({ resources, tasks }: WorkerPhoneProps) {
  const [flashTaskIds, setFlashTaskIds] = useState<Set<number>>(new Set());
  const [prevTaskStatuses, setPrevTaskStatuses] = useState<Map<number, string>>(new Map());

  // Detect task status changes for animations
  useEffect(() => {
    const newFlashes = new Set<number>();
    tasks.forEach((task) => {
      const prev = prevTaskStatuses.get(task.id);
      if (prev && prev !== task.status && task.status === 'PAUSED_BY_AI') {
        newFlashes.add(task.id);
      }
    });
    if (newFlashes.size > 0) {
      setFlashTaskIds(newFlashes);
      setTimeout(() => setFlashTaskIds(new Set()), 1200);
    }
    setPrevTaskStatuses(new Map(tasks.map((t) => [t.id, t.status])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // Get worker resources
  const workers = resources.filter((r) => r.type === 'WORKER');
  const activeWorker = workers.find((w) => w.status === 'BUSY') || workers[0];

  // Get tasks for displayed farm
  const workerTasks = activeWorker
    ? tasks.filter((t) => t.farmId === activeWorker.currentFarmId).slice(0, 6)
    : [];

  const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
    SCHEDULED: { color: 'text-gray-400', icon: '○', label: 'Queued' },
    IN_PROGRESS: { color: 'text-emerald-400', icon: '●', label: 'Active' },
    PAUSED_BY_AI: { color: 'text-red-400', icon: '⏸', label: 'PAUSED' },
    COMPLETED: { color: 'text-gray-600', icon: '✓', label: 'Done' },
    CANCELLED: { color: 'text-gray-600', icon: '✕', label: 'Cancelled' },
  };

  const enRouteResources = resources.filter((r) => r.status === 'EN_ROUTE');

  return (
    <div className="flex flex-col h-full">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-500">
          📱 Field Worker View
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Phone Frame */}
      <div className="flex-1 flex justify-center">
        <div
          className="relative w-full max-w-[240px] rounded-[24px] border-2 border-white/10 
                      bg-gradient-to-b from-[#0D0E14] to-[#090A0F] overflow-hidden
                      shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        >
          {/* Notch */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-20 h-5 rounded-b-xl bg-black border border-white/5 flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              <div className="w-6 h-1 rounded-full bg-white/5" />
            </div>
          </div>

          {/* Phone Screen Content */}
          <div className="px-3 pb-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 32px)' }}>
            {/* Status Bar */}
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-[8px] font-mono text-gray-500">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-gray-500">📶</span>
                <span className="text-[8px] text-gray-500">🔋</span>
              </div>
            </div>

            {/* Worker Info */}
            {activeWorker && (
              <div className="glass-card p-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">
                    👷
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-gray-200 truncate">
                      {activeWorker.name}
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono">
                      {activeWorker.status === 'EN_ROUTE' ? (
                        <span className="text-cyan-400">⚡ EN ROUTE — Rerouted</span>
                      ) : (
                        <span className={activeWorker.status === 'BUSY' ? 'text-emerald-400' : ''}>
                          {activeWorker.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EN_ROUTE Alerts */}
            {enRouteResources.map((r) => (
              <div
                key={r.id}
                className="glass-card p-2 border-l-2 border-l-cyan-500/50 slide-in"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">⚡</span>
                  <span className="text-[9px] font-semibold text-cyan-400 uppercase tracking-wider">
                    Rerouted
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {r.name} → Farm #{r.currentFarmId}
                </p>
              </div>
            ))}

            {/* Task List */}
            <div className="text-[8px] font-semibold tracking-[0.15em] uppercase text-gray-500 px-1 mt-1">
              Today&apos;s Tasks
            </div>
            <div className="space-y-1">
              {workerTasks.map((task) => {
                const cfg = statusConfig[task.status] || statusConfig.SCHEDULED;
                const isFlashing = flashTaskIds.has(task.id);
                const isNew = task.status === 'SCHEDULED' && task.priority === 1;

                return (
                  <div
                    key={task.id}
                    className={`glass-card p-2 transition-all ${isFlashing ? 'flash-alert' : ''} ${isNew ? 'slide-in' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-[10px] mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-300 leading-tight truncate">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[8px] font-mono ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-[8px] font-mono text-gray-600">
                            {task.scheduledSlot}
                          </span>
                        </div>
                        {task.status === 'PAUSED_BY_AI' && task.aiReasoning && (
                          <div className="text-[8px] text-red-400/80 mt-1 italic">
                            ⚠ AI: {task.aiReasoning}
                          </div>
                        )}
                      </div>
                      {task.priority === 1 && (
                        <span className="text-[7px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">
                          P1
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom indicator */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-24 h-1 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

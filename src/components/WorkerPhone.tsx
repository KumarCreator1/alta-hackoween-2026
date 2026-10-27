'use client';

import React, { useState } from 'react';
import type { Resource, Task } from '@/db/schema';

interface WorkerPhoneProps {
  resources: Resource[];
  tasks: Task[];
  onUpdateTaskStatus?: (taskId: number, status: 'IN_PROGRESS' | 'COMPLETED') => Promise<void>;
}

export default function WorkerPhone({
  resources,
  tasks,
  onUpdateTaskStatus,
}: WorkerPhoneProps) {
  const [activeWorkerId, setActiveWorkerId] = useState<number>(3); // Rohan by default
  const [actingTaskId, setActingTaskId] = useState<number | null>(null);

  const workers = resources.filter((r) => r.type === 'WORKER');
  const currentWorker = workers.find((w) => w.id === activeWorkerId) || workers[0];

  const assignedTasks = tasks.filter((t) => t.assignedResourceId === currentWorker?.id || t.farmId === currentWorker?.currentFarmId);
  const enRoute = resources.find((r) => r.status === 'EN_ROUTE');

  const handleAction = async (taskId: number, newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    if (!onUpdateTaskStatus) return;
    setActingTaskId(taskId);
    try {
      await onUpdateTaskStatus(taskId, newStatus);
    } finally {
      setActingTaskId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between text-white font-sans">
      {/* Phone Header / Dynamic Island */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-3.5 bg-black rounded-full mb-2 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500/80 mr-1" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Worker Selector Pill */}
        <div className="w-full flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">👷</span>
            <span className="text-xs font-bold text-gray-100">{currentWorker?.name || 'Field Worker'}</span>
          </div>

          <div className="flex gap-1">
            {workers.map((w) => (
              <button
                key={w.id}
                onClick={() => setActiveWorkerId(w.id)}
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  activeWorkerId === w.id
                    ? 'bg-emerald-500 text-gray-950'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {w.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reroute Alert if Dispatched */}
      {enRoute && (
        <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl p-2 my-1 text-xs slide-up">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <span>⚡</span>
            <span>REROUTED TO SECTOR #{enRoute.currentFarmId}</span>
          </div>
          <p className="text-[10px] text-gray-300 mt-0.5">
            AI Dispatched: Proceed to Highway corridor immediately.
          </p>
        </div>
      )}

      {/* Worker Task Queue */}
      <div className="space-y-1.5 my-1 overflow-y-auto max-h-[140px] pr-0.5">
        {assignedTasks.slice(0, 3).map((task) => {
          const isPaused = task.status === 'PAUSED_BY_AI';
          const isWorking = task.status === 'IN_PROGRESS';
          const isDone = task.status === 'COMPLETED';

          return (
            <div
              key={task.id}
              className={`p-2 rounded-xl text-left border text-[11px] transition-all ${
                isPaused
                  ? 'bg-red-500/20 border-red-500/40 flash-red'
                  : isWorking
                  ? 'bg-emerald-500/15 border-emerald-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-bold text-gray-200 leading-snug truncate">
                  {task.title}
                </span>
                <span
                  className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    isPaused ? 'bg-red-500 text-white' : isWorking ? 'bg-emerald-500 text-gray-950' : 'bg-white/10'
                  }`}
                >
                  {task.status.replace('_', ' ')}
                </span>
              </div>

              {isPaused && (
                <div className="text-[9px] text-red-300 mt-1 italic">
                  ⚠ Paused by AI to prevent wash-off runoff!
                </div>
              )}

              {/* Interactive Worker Actions */}
              {!isDone && !isPaused && onUpdateTaskStatus && (
                <div className="flex justify-end gap-1.5 mt-1.5 pt-1 border-t border-white/10">
                  {!isWorking && (
                    <button
                      onClick={() => handleAction(task.id, 'IN_PROGRESS')}
                      disabled={actingTaskId === task.id}
                      className="px-2 py-0.5 bg-emerald-500 text-gray-950 font-bold text-[9px] rounded-md hover:bg-emerald-400"
                    >
                      Start Task
                    </button>
                  )}
                  {isWorking && (
                    <button
                      onClick={() => handleAction(task.id, 'COMPLETED')}
                      disabled={actingTaskId === task.id}
                      className="px-2 py-0.5 bg-white/20 text-white font-bold text-[9px] rounded-md hover:bg-white/30"
                    >
                      Mark Complete ✓
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Phone Bar */}
      <div className="pt-1 flex items-center justify-between text-[9px] text-gray-400 font-mono">
        <span>GPS: RTK FIXED</span>
        <span>BATTERY: 100%</span>
      </div>
    </div>
  );
}

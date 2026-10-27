'use client';

import React from 'react';
import type { Resource, Task } from '@/db/schema';

interface TeamCollaborationProps {
  resources: Resource[];
  tasks: Task[];
}

export default function TeamCollaboration({
  resources,
  tasks,
}: TeamCollaborationProps) {
  const getResourceTask = (resourceId: number) => {
    return tasks.find(
      (t) => t.assignedResourceId === resourceId && (t.status === 'IN_PROGRESS' || t.status === 'SCHEDULED')
    );
  };

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    BUSY: { label: 'In Progress', bg: 'bg-amber-100', text: 'text-amber-800' },
    IDLE: { label: 'Available', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    EN_ROUTE: { label: 'En Route', bg: 'bg-blue-100', text: 'text-blue-800' },
    MAINTENANCE: { label: 'Service', bg: 'bg-red-100', text: 'text-red-800' },
  };

  const typeIcons: Record<string, string> = {
    WORKER: '👷',
    TRACTOR: '🚜',
    HARVESTER: '🌾',
    DRONE: '🛸',
  };

  return (
    <div className="space-y-3">
      {resources.map((r) => {
        const activeTask = getResourceTask(r.id);
        const status = statusConfig[r.status] || statusConfig.IDLE;
        const icon = typeIcons[r.type] || '📦';
        const isWorker = r.type === 'WORKER';

        return (
          <div
            key={r.id}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
          >
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-xs ${
                  isWorker ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {icon}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 leading-tight flex items-center gap-2">
                  <span>{r.name}</span>
                  <span className="text-[10px] font-mono text-gray-400 font-normal">
                    (Sector {r.currentFarmId === 1 ? 'Alpha' : 'Beta'})
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">
                  {activeTask ? activeTask.title : 'Standby / Optimal fuel level'}
                </p>
              </div>
            </div>

            {/* Right: Status Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-medium text-gray-400">
                {r.fuelOrBattery}%
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${status.bg} ${status.text}`}
              >
                {status.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


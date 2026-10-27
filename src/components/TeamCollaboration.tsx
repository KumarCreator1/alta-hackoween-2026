'use client';

import React from 'react';
import type { Resource, Task } from '@/db/schema';
import { User, Tractor, Shield, Navigation } from 'lucide-react';

interface TeamCollaborationProps {
  resources: Resource[];
  tasks: Task[];
}

export default function TeamCollaboration({ resources, tasks }: TeamCollaborationProps) {
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

  const renderIcon = (type: string) => {
    switch (type) {
      case 'WORKER':
        return <User className="w-3.5 h-3.5 text-stone-600" />;
      case 'TRACTOR':
        return <Tractor className="w-3.5 h-3.5 text-stone-600" />;
      case 'HARVESTER':
        return <Shield className="w-3.5 h-3.5 text-stone-600" />;
      default:
        return <Navigation className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  return (
    <div className="space-y-2">
      {resources.slice(0, 5).map((r) => {
        const activeTask = getResourceTask(r.id);
        const status = statusConfig[r.status] || statusConfig.IDLE;
        const isWorker = r.type === 'WORKER';

        return (
          <div
            key={r.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors border border-stone-100"
          >
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                {renderIcon(r.type)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-900 truncate">
                  {r.name}
                </div>
                <div className="text-[10px] text-stone-500 font-mono truncate">
                  {activeTask
                    ? `Job: ${activeTask.title}`
                    : isWorker
                    ? 'Station Standby'
                    : `Implement: ${r.implementStatus || 'Standby'}`}
                </div>
              </div>
            </div>

            {/* Right: Status Pill */}
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import React from 'react';
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
}

export default function CrewView({
  resources,
  tasks,
  farms,
  onUpdateResource,
}: CrewViewProps) {
  const workers = resources.filter((r) => r.type === 'WORKER');

  const handleReassignSector = async (workerId: number, currentFarmId: number) => {
    const nextFarmId = currentFarmId === 1 ? 2 : 1;
    await onUpdateResource(workerId, { currentFarmId: nextFarmId, status: 'IDLE' });
  };

  const handleToggleStatus = async (workerId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'BUSY' ? 'IDLE' : 'BUSY';
    await onUpdateResource(workerId, { status: nextStatus as 'IDLE' | 'BUSY' });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Field Agronomists & Edge Operators</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Certified crop scouts, lead agronomists, and autonomous equipment operators
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((w) => {
          const farm = farms.find((f) => f.id === w.currentFarmId);
          const activeTask = tasks.find((t) => t.assignedResourceId === w.id && t.status === 'IN_PROGRESS');

          return (
            <div key={w.id} className="donezo-card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 font-bold text-base flex items-center justify-center shadow-xs">
                    👷
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{w.name}</h4>
                    <p className="text-xs text-gray-400 font-medium">{w.model || 'Lead Agronomist'}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    w.status === 'BUSY'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {w.status === 'BUSY' ? 'Active Shift' : 'On Standby'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Current Station</span>
                  <span className="font-bold text-gray-800">
                    {farm?.name.split(' - ')[0] || `Sector #${w.currentFarmId}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Active Field Mission</span>
                  <span className="font-semibold text-emerald-700 truncate max-w-[170px]">
                    {activeTask ? activeTask.title : 'Standby Inspection'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Shift Endurance:</span>
                  <span className="font-mono font-bold text-gray-700">{w.fuelOrBattery}%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleReassignSector(w.id, w.currentFarmId)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Transfer to {w.currentFarmId === 1 ? 'Beta' : 'Alpha'}
                </button>
                <button
                  onClick={() => handleToggleStatus(w.id, w.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    w.status === 'BUSY'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {w.status === 'BUSY' ? 'Set Standby' : 'Assign Mission'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

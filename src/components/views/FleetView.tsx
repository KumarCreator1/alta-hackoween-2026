'use client';

import React, { useState } from 'react';
import type { Resource, Farm } from '@/db/schema';

interface FleetViewProps {
  resources: Resource[];
  farms: Farm[];
  onUpdateResource: (
    resourceId: number,
    data: {
      status?: 'IDLE' | 'BUSY' | 'MAINTENANCE' | 'EN_ROUTE';
      currentFarmId?: number;
      fuelOrBattery?: number;
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
}

export default function FleetView({
  resources,
  farms,
  onUpdateResource,
  onAddResource,
}: FleetViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('TRACTOR');
  const [newFarmId, setNewFarmId] = useState(farms[0]?.id || 1);
  const [newModel, setNewModel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredResources = resources.filter((r) => {
    if (filterType === 'ALL') return true;
    return r.type === filterType;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setSubmitting(true);
    try {
      await onAddResource({
        name: newName,
        type: newType,
        currentFarmId: newFarmId,
        fuelOrBattery: 100,
        model: newModel || 'Autonomous Implement',
      });
      setShowAddModal(false);
      setNewName('');
      setNewModel('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTransit = async (r: Resource) => {
    const nextFarmId = r.currentFarmId === 1 ? 2 : 1;
    await onUpdateResource(r.id, {
      status: 'EN_ROUTE',
      currentFarmId: nextFarmId,
    });
  };

  const handleRefuel = async (r: Resource) => {
    await onUpdateResource(r.id, { fuelOrBattery: 100 });
  };

  const handleToggleMaintenance = async (r: Resource) => {
    const nextStatus = r.status === 'MAINTENANCE' ? 'IDLE' : 'MAINTENANCE';
    await onUpdateResource(r.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Autonomous Machinery Fleet</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            ISOBUS telematics, CAN-bus health telemetry, and cross-farm route dispatch
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Type Filter Pills */}
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-xs">
            {['ALL', 'TRACTOR', 'HARVESTER', 'DRONE', 'WORKER'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === type
                    ? 'bg-[#134E35] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span>+</span>
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((r) => {
          const farm = farms.find((f) => f.id === r.currentFarmId);
          const isEnRoute = r.status === 'EN_ROUTE';
          const isMaint = r.status === 'MAINTENANCE';

          return (
            <div key={r.id} className="donezo-card p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-lg">
                      {r.type === 'TRACTOR' ? '🚜' : r.type === 'DRONE' ? '🛸' : r.type === 'HARVESTER' ? '🌾' : '👷'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">{r.name}</h4>
                      <p className="text-[11px] text-gray-400 font-medium">{r.model || r.type}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-md ${
                      isEnRoute
                        ? 'bg-blue-100 text-blue-800'
                        : isMaint
                        ? 'bg-red-100 text-red-800'
                        : r.status === 'BUSY'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                {/* Telematics Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Sector Location</span>
                    <span className="font-bold text-gray-800">
                      {farm?.name.split(' - ')[0] || `Farm #${r.currentFarmId}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Fuel / Charge Level</span>
                    <span className="font-mono font-bold text-emerald-700">{r.fuelOrBattery}%</span>
                  </div>

                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        r.fuelOrBattery < 30 ? 'bg-red-500' : r.fuelOrBattery < 60 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${r.fuelOrBattery}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400 font-mono">
                    <span>Engine Hrs: {r.engineHours || 420}h</span>
                    <span>Implement: {r.implementStatus || 'Standby'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleToggleTransit(r)}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  🔀 Route to {r.currentFarmId === 1 ? 'Beta' : 'Alpha'}
                </button>
                <button
                  onClick={() => handleRefuel(r)}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  ⚡ Refuel 100%
                </button>
                <button
                  onClick={() => handleToggleMaintenance(r)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                    isMaint ? 'bg-red-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {isMaint ? 'Clear Fault' : '🔧 Service'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-gray-200 slide-up">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Add New Agricultural Asset</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Equipment Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Deere 9RX - Unit 05"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600"
                  >
                    <option value="TRACTOR">Tractor</option>
                    <option value="HARVESTER">Sprayer / Harvester</option>
                    <option value="DRONE">Autonomous Drone</option>
                    <option value="WORKER">Agronomist / Field Tech</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Assigned Sector</label>
                  <select
                    value={newFarmId}
                    onChange={(e) => setNewFarmId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name.split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Model / Specs</label>
                <input
                  type="text"
                  placeholder="e.g. 410 HP Autonomous Guidance RTK"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 text-xs font-bold shadow-sm"
                >
                  {submitting ? 'Registering...' : 'Register Asset in Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

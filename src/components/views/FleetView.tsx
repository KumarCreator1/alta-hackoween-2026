'use client';

import React, { useState } from 'react';
import type { Resource, Farm } from '@/db/schema';
import { Plus, Trash2, BatteryCharging, Wrench, ArrowRightLeft, Gauge, Layers } from 'lucide-react';

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
  onDeleteResource?: (resourceId: number) => Promise<void>;
}

export default function FleetView({
  resources,
  farms,
  onUpdateResource,
  onAddResource,
  onDeleteResource,
}: FleetViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterFarmId, setFilterFarmId] = useState<number | 'ALL'>('ALL');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('TRACTOR');
  const [newFarmId, setNewFarmId] = useState(farms[0]?.id || 1);
  const [newModel, setNewModel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredResources = resources.filter((r) => {
    if (filterType !== 'ALL' && r.type !== filterType) return false;
    if (filterFarmId !== 'ALL' && r.currentFarmId !== filterFarmId) return false;
    return true;
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

  const handleReallocate = async (r: Resource, targetFarmId: number) => {
    if (targetFarmId === r.currentFarmId) return;
    await onUpdateResource(r.id, {
      status: 'EN_ROUTE',
      currentFarmId: targetFarmId,
    });
  };

  const handleRefuel = async (r: Resource) => {
    await onUpdateResource(r.id, { fuelOrBattery: 100 });
  };

  const handleToggleMaintenance = async (r: Resource) => {
    const nextStatus = r.status === 'MAINTENANCE' ? 'IDLE' : 'MAINTENANCE';
    await onUpdateResource(r.id, { status: nextStatus });
  };

  const handleDelete = async (resourceId: number) => {
    if (!confirm('Are you sure you want to retire this asset from the fleet?')) return;
    if (onDeleteResource) {
      await onDeleteResource(resourceId);
    } else {
      await fetch(`/api/resources/${resourceId}/delete`, { method: 'POST' });
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Autonomous Machinery Fleet</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            ISOBUS telematics, CAN-bus health telemetry, and cross-farm route dispatch across {farms.length} locations
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#134E35] hover:bg-[#0D3826] text-white text-xs font-bold rounded-2xl shadow-xs transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment</span>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
        {/* Type Filter */}
        <div className="flex bg-stone-100 p-1 rounded-xl">
          {['ALL', 'TRACTOR', 'HARVESTER', 'DRONE', 'WORKER'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === type
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Sector Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3" /> Filter Sector:
          </span>
          <select
            value={filterFarmId}
            onChange={(e) => setFilterFarmId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 font-semibold focus:outline-none focus:border-emerald-700"
          >
            <option value="ALL">All Sectors ({resources.length})</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name.split(' - ')[0]} ({f.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((r) => {
          const farm = farms.find((f) => f.id === r.currentFarmId);
          const isEnRoute = r.status === 'EN_ROUTE';
          const isMaint = r.status === 'MAINTENANCE';

          return (
            <div key={r.id} className="donezo-card p-5 space-y-4 flex flex-col justify-between hover:border-stone-300 transition-all">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-lg">
                      {r.type === 'TRACTOR' ? '🚜' : r.type === 'DRONE' ? '🛸' : r.type === 'HARVESTER' ? '🌾' : '👷'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 leading-snug">{r.name}</h4>
                      <p className="text-[11px] text-stone-500 font-medium">{r.model || r.type}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-md ${
                      isEnRoute
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
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
                <div className="mt-4 p-3 bg-stone-50/80 rounded-xl border border-stone-200/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Sector Station</span>
                    <span className="font-bold text-stone-800 font-mono">
                      {farm?.code || farm?.name.split(' - ')[0] || `Farm #${r.currentFarmId}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Fuel / Charge Level</span>
                    <span className="font-mono font-bold text-emerald-800">{r.fuelOrBattery}%</span>
                  </div>

                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        r.fuelOrBattery < 30 ? 'bg-red-500' : r.fuelOrBattery < 60 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${r.fuelOrBattery}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-stone-400 font-mono">
                    <span>Engine Hrs: {r.engineHours || 420}h</span>
                    <span>Implement: {r.implementStatus || 'Standby'}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Reallocation & Actions */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                {/* Sector Switch Dropdown */}
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="text-stone-500 flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3 text-stone-400" /> Dispatch To:
                  </span>
                  <select
                    value={r.currentFarmId}
                    onChange={(e) => handleReallocate(r, Number(e.target.value))}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-stone-200 bg-white"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code || f.name.split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => handleRefuel(r)}
                    className="px-2 py-1.5 rounded-lg border border-stone-200 text-[10px] font-bold text-stone-700 hover:bg-stone-50 flex items-center justify-center gap-1 transition-colors"
                  >
                    <BatteryCharging className="w-3 h-3 text-emerald-700" /> Refuel
                  </button>

                  <button
                    onClick={() => handleToggleMaintenance(r)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${
                      isMaint ? 'bg-red-600 text-white' : 'border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Wrench className="w-3 h-3" /> {isMaint ? 'Online' : 'Service'}
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="px-2 py-1.5 rounded-lg border border-stone-200 text-[10px] font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Retire
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-stone-200 slide-up">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Add New Agricultural Asset</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Equipment / Operator Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Deere 9RX - Unit 05"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-700"
                  >
                    <option value="TRACTOR">Tractor (Field Prep)</option>
                    <option value="HARVESTER">Sprayer / Harvester</option>
                    <option value="DRONE">Autonomous Drone</option>
                    <option value="WORKER">Agronomist / Field Tech</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Assigned Sector</label>
                  <select
                    value={newFarmId}
                    onChange={(e) => setNewFarmId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-700"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code || f.name.split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Model / Implement Specs</label>
                <input
                  type="text"
                  placeholder="e.g. 410 HP Autonomous Guidance RTK"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#134E35] hover:bg-[#0D3826] rounded-xl shadow-xs"
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

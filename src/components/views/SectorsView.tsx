'use client';

import React, { useState } from 'react';
import type { Farm, Resource, Task } from '@/db/schema';
import AddFarmModal from '@/components/AddFarmModal';
import { Plus, Trash2, Droplets, MapPin, Gauge, Sprout, ShieldCheck, Wind, Thermometer } from 'lucide-react';

interface SectorsViewProps {
  farms: Farm[];
  resources: Resource[];
  tasks: Task[];
  onUpdateFarm: (farmId: number, data: Record<string, unknown>) => Promise<void>;
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
  onRefresh: () => void;
}

export default function SectorsView({
  farms,
  resources,
  tasks,
  onUpdateFarm,
  onTriggerCrisis,
  onRefresh,
}: SectorsViewProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<number>(farms[0]?.id || 1);
  const [customMoisture, setCustomMoisture] = useState<number>(farms[0]?.soilMoisture || 45);
  const [saving, setSaving] = useState(false);
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const farmResources = resources.filter((r) => r.currentFarmId === currentFarm?.id);
  const farmTasks = tasks.filter((t) => t.farmId === currentFarm?.id);

  const handleMoistureSave = async () => {
    if (!currentFarm) return;
    setSaving(true);
    try {
      await onUpdateFarm(currentFarm.id, { soilMoisture: customMoisture });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleWeatherChange = async (newWeather: string) => {
    if (!currentFarm) return;
    await onUpdateFarm(currentFarm.id, { weatherStatus: newWeather });
    if (newWeather.includes('STORM') || newWeather.includes('RAIN') || newWeather.includes('WARNING')) {
      await onTriggerCrisis('WEATHER_WEBHOOK', currentFarm.id, { condition: newWeather });
    }
    onRefresh();
  };

  const handleDeleteFarm = async (farmId: number, farmName: string) => {
    if (!confirm(`Are you sure you want to decommission "${farmName}"? All appointed equipment and tasks will be unlinked.`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/farms/${farmId}/delete`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to delete farm');
      onRefresh();
      const remaining = farms.filter((f) => f.id !== farmId);
      if (remaining.length > 0) setSelectedFarmId(remaining[0].id);
    } catch (err) {
      console.error(err);
      alert('Error deleting farm');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header with Multi-Farm Management */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Centralized Multi-Farm Sectors</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time acreage telemetry, soil chemistry envelopes, irrigation rigs & appointed assets across {farms.length} locations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sector Switcher Tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-stone-200 shadow-2xs overflow-x-auto max-w-md no-scrollbar">
            {farms.map((farm) => (
              <button
                key={farm.id}
                onClick={() => {
                  setSelectedFarmId(farm.id);
                  setCustomMoisture(farm.soilMoisture);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedFarmId === farm.id
                    ? 'bg-[#134E35] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {farm.code || farm.name.split(' - ')[0]}
              </button>
            ))}
          </div>

          {/* + Register Sector Button */}
          <button
            onClick={() => setIsAddFarmOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#134E35] hover:bg-[#0D3826] text-white text-xs font-bold rounded-2xl shadow-xs transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sector</span>
          </button>
        </div>
      </div>

      {currentFarm && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Farm Telemetry & Soil Simulation (Col-7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="donezo-card p-6 space-y-6">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-900">{currentFarm.name}</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                      {currentFarm.code || 'SEC'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" /> {currentFarm.region || 'Central Valley'}
                    </span>
                    <span>•</span>
                    <span>Acreage: <strong>{currentFarm.acreage || 500} Acres</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-700" /> <strong>{currentFarm.cropType || 'Rotational Grain'}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
                    {currentFarm.weatherStatus}
                  </span>
                  {farms.length > 1 && (
                    <button
                      onClick={() => handleDeleteFarm(currentFarm.id, currentFarm.name)}
                      disabled={deleting}
                      title="Decommission this sector"
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Telemetry Metrics Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/80">
                  <div className="text-[10px] text-stone-500 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-600" /> Moisture Target
                  </div>
                  <div className="text-sm font-bold text-stone-900 mt-1">
                    {currentFarm.targetMoistureMin}% - {currentFarm.targetMoistureMax}%
                  </div>
                  <div className="text-[9px] text-stone-400 mt-0.5">Current: {currentFarm.soilMoisture}%</div>
                </div>

                <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/80">
                  <div className="text-[10px] text-stone-500 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-emerald-700" /> Soil Profile
                  </div>
                  <div className="text-sm font-bold text-stone-900 mt-1 truncate">
                    {currentFarm.soilType || 'Loam'}
                  </div>
                  <div className="text-[9px] text-stone-400 mt-0.5">pH: {currentFarm.soilPh || '6.8'}</div>
                </div>

                <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/80">
                  <div className="text-[10px] text-stone-500 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-amber-600" /> Climate Ambient
                  </div>
                  <div className="text-sm font-bold text-stone-900 mt-1">
                    {currentFarm.tempCelsius || 26}°C
                  </div>
                  <div className="text-[9px] text-stone-400 mt-0.5 flex items-center gap-0.5">
                    <Wind className="w-2.5 h-2.5" /> {currentFarm.windSpeedKmh || 12} km/h
                  </div>
                </div>

                <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/80">
                  <div className="text-[10px] text-stone-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Health Index
                  </div>
                  <div className="text-sm font-bold text-emerald-800 mt-1 font-mono">
                    {currentFarm.healthScore || 96} / 100
                  </div>
                  <div className="text-[9px] text-stone-400 mt-0.5">{currentFarm.irrigationType?.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Dynamic Interactive Moisture Adjustment */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-emerald-700" /> Soil Moisture Simulator & Sensor Calibration
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                    Live Probe: {customMoisture}%
                  </span>
                </div>

                <input
                  type="range"
                  min="15"
                  max="95"
                  value={customMoisture}
                  onChange={(e) => setCustomMoisture(parseInt(e.target.value, 10))}
                  className="w-full accent-[#134E35] cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>Critically Dry (15%)</span>
                  <span>Target Range ({currentFarm.targetMoistureMin}-{currentFarm.targetMoistureMax}%)</span>
                  <span>Waterlogged / Flood (95%)</span>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleMoistureSave}
                    disabled={saving}
                    className="btn-primary px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    {saving ? 'Syncing...' : 'Sync Sensor Reading to Supabase'}
                  </button>
                </div>
              </div>

              {/* Weather Condition Controls */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-700 block">
                  Simulate Sector Microclimate & Weather Ingestion:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleWeatherChange('Clear Skies, 28°C')}
                    className="p-2.5 rounded-xl border border-stone-200 text-xs font-semibold hover:border-emerald-600 hover:bg-emerald-50/30 transition-all text-left"
                  >
                    ☀️ Clear & Sunny
                  </button>
                  <button
                    onClick={() => handleWeatherChange('HEAVY_RAIN_WARNING')}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-900 text-xs font-semibold hover:border-amber-400 transition-all text-left"
                  >
                    ⛈️ Heavy Rain Warning
                  </button>
                  <button
                    onClick={() => handleWeatherChange('FROST_ALERT_WARNING')}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-900 text-xs font-semibold hover:border-blue-400 transition-all text-left"
                  >
                    ❄️ Frost Alert (-2°C)
                  </button>
                </div>
              </div>
            </div>

            {/* Farm Active Machinery & Employees */}
            <div className="donezo-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-stone-900">
                  Fleet & Personnel Stationed in {currentFarm.code || currentFarm.name} ({farmResources.length})
                </h4>
                <span className="text-[10px] font-mono text-stone-400 uppercase">
                  Appointed Resources
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {farmResources.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border border-stone-200 flex items-center justify-between bg-white">
                    <div>
                      <div className="text-xs font-bold text-stone-900">{r.name}</div>
                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                        {r.type} • {r.type === 'WORKER' ? 'Stamina' : 'Battery/Fuel'}: {r.fuelOrBattery}%
                      </div>
                      <div className="text-[9px] text-stone-400 truncate max-w-[160px]">{r.model}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        r.status === 'BUSY'
                          ? 'bg-amber-100 text-amber-800'
                          : r.status === 'EN_ROUTE'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Scheduled Missions for this Sector (Col-5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="donezo-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-stone-900">
                  Field Operations Schedule ({farmTasks.length})
                </h4>
                <span className="text-[10px] font-mono font-bold text-stone-400">
                  PRIORITY DISPATCH
                </span>
              </div>

              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {farmTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-stone-200/80 bg-stone-50/60 hover:bg-white hover:border-stone-300 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-stone-900 leading-snug">{t.title}</span>
                      <span
                        className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-md ${
                          t.status === 'PAUSED_BY_AI'
                            ? 'bg-red-100 text-red-700'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60 text-[10px] text-stone-500 font-mono">
                      <span>Window: {t.scheduledSlot}</span>
                      <span>Progress: {t.progressPercent}%</span>
                    </div>

                    {t.aiReasoning && (
                      <p className="text-[10px] text-amber-800/90 italic mt-1.5 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                        🤖 AI Note: {t.aiReasoning}
                      </p>
                    )}
                  </div>
                ))}

                {farmTasks.length === 0 && (
                  <div className="text-center py-8 text-stone-400 text-xs">
                    No active missions scheduled for this sector.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding a new enterprise farm */}
      <AddFarmModal
        isOpen={isAddFarmOpen}
        onClose={() => setIsAddFarmOpen(false)}
        onCreated={() => {
          onRefresh();
        }}
      />
    </div>
  );
}

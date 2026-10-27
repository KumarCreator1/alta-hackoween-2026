'use client';

import React, { useState } from 'react';
import type { Farm, Resource, Task } from '@/db/schema';

interface SectorsViewProps {
  farms: Farm[];
  resources: Resource[];
  tasks: Task[];
  onUpdateFarm: (farmId: number, data: { soilMoisture?: number; weatherStatus?: string }) => Promise<void>;
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
}

export default function SectorsView({
  farms,
  resources,
  tasks,
  onUpdateFarm,
  onTriggerCrisis,
}: SectorsViewProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<number>(farms[0]?.id || 1);
  const [customMoisture, setCustomMoisture] = useState<number>(45);
  const [saving, setSaving] = useState(false);

  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const farmResources = resources.filter((r) => r.currentFarmId === currentFarm?.id);
  const farmTasks = tasks.filter((t) => t.farmId === currentFarm?.id);

  const handleMoistureSave = async () => {
    if (!currentFarm) return;
    setSaving(true);
    try {
      await onUpdateFarm(currentFarm.id, { soilMoisture: customMoisture });
    } finally {
      setSaving(false);
    }
  };

  const handleWeatherChange = async (newWeather: string) => {
    if (!currentFarm) return;
    await onUpdateFarm(currentFarm.id, { weatherStatus: newWeather });
    if (newWeather.includes('STORM') || newWeather.includes('RAIN')) {
      await onTriggerCrisis('WEATHER_WEBHOOK', currentFarm.id, { condition: newWeather });
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sectors & Agricultural Zones</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time soil sensors, variable rate irrigation, and agronomic field boundaries
          </p>
        </div>

        {/* Sector Switcher Pills */}
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-xs">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => {
                setSelectedFarmId(farm.id);
                setCustomMoisture(farm.soilMoisture);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedFarmId === farm.id
                  ? 'bg-[#134E35] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {farm.name.split(' - ')[0]}
            </button>
          ))}
        </div>
      </div>

      {currentFarm && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Farm Specs & Soil Simulation (Col-7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="donezo-card p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{currentFarm.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>Acreage: <strong>{currentFarm.acreage || 500} Acres</strong></span>
                    <span>•</span>
                    <span>Crops: <strong>{currentFarm.cropType || 'Winter Wheat'}</strong></span>
                  </div>
                </div>

                <span className="text-xs font-bold font-mono px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
                  {currentFarm.weatherStatus}
                </span>
              </div>

              {/* Dynamic Interactive Moisture Adjustment */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">
                    💧 Interactive Soil Moisture Sensor Simulator
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                    Target: {customMoisture}%
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

                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Critically Dry (15%)</span>
                  <span>Optimal Field Capacity (40-65%)</span>
                  <span>Waterlogged / Flood (95%)</span>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleMoistureSave}
                    disabled={saving}
                    className="btn-primary px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    {saving ? 'Updating...' : 'Push Sensor Reading to Supabase'}
                  </button>
                </div>
              </div>

              {/* Weather Condition Controls */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 block">
                  Simulate Microclimate & Weather Warnings:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleWeatherChange('Clear Skies, 30°C')}
                    className="p-2.5 rounded-xl border border-gray-200 text-xs font-semibold hover:border-emerald-600 hover:bg-emerald-50/30 transition-all text-left"
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

            {/* Farm Active Machinery */}
            <div className="donezo-card p-6">
              <h4 className="text-sm font-bold text-gray-900 mb-3">
                Assets Deployed in this Sector ({farmResources.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {farmResources.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-800">{r.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {r.type} • Battery/Fuel: {r.fuelOrBattery}%
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
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
                <h4 className="text-sm font-bold text-gray-900">
                  Sector Missions Schedule ({farmTasks.length})
                </h4>
                <span className="text-[10px] font-mono font-bold text-gray-400">
                  PRIORITY QUEUE
                </span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {farmTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-gray-900 leading-snug">{t.title}</span>
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

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50 text-[10px] text-gray-500 font-mono">
                      <span>Window: {t.scheduledSlot}</span>
                      <span>Priority: P{t.priority}</span>
                    </div>

                    {t.aiReasoning && (
                      <p className="text-[10px] text-amber-700/90 italic mt-1.5 bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                        🤖 AI Note: {t.aiReasoning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

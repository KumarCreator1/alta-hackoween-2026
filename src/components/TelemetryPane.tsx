'use client';

import type { Farm, Resource } from '@/db/schema';
import LeafUploader from './LeafUploader';

interface TelemetryPaneProps {
  farms: Farm[];
  resources: Resource[];
  godMode: boolean;
  onRefresh: () => void;
}

function getWeatherBadge(weather: string) {
  const w = weather.toLowerCase();
  if (w.includes('storm') || w.includes('alert') || w.includes('severe'))
    return { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '⛈️' };
  if (w.includes('warning') || w.includes('cloudy') || w.includes('rain'))
    return { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '🌤️' };
  return { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '☀️' };
}

function MoistureBar({ value }: { value: number }) {
  const color =
    value < 30 ? 'bg-red-500' : value < 50 ? 'bg-amber-500' : 'bg-emerald-500';
  const glowColor =
    value < 30
      ? 'shadow-[0_0_8px_rgba(239,68,68,0.4)]'
      : value < 50
        ? 'shadow-[0_0_8px_rgba(245,158,11,0.4)]'
        : 'shadow-[0_0_8px_rgba(16,185,129,0.4)]';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} ${glowColor} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-mono text-[11px] text-gray-400 w-8 text-right">{value}%</span>
    </div>
  );
}

function ResourceBadge({ resource }: { resource: Resource }) {
  const statusColors: Record<string, string> = {
    IDLE: 'bg-emerald-500',
    BUSY: 'bg-amber-500',
    MAINTENANCE: 'bg-red-500',
    EN_ROUTE: 'bg-cyan-500',
  };
  const typeIcons: Record<string, string> = {
    TRACTOR: '🚜',
    HARVESTER: '🌾',
    DRONE: '🛸',
    WORKER: '👷',
  };
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`w-1.5 h-1.5 rounded-full ${statusColors[resource.status] || 'bg-gray-500'}`} />
      <span className="text-[11px]">{typeIcons[resource.type] || '📦'}</span>
      <span className="text-[11px] text-gray-300 truncate flex-1">{resource.name}</span>
      <span className="text-[9px] font-mono text-gray-500 uppercase">{resource.status}</span>
    </div>
  );
}

export default function TelemetryPane({ farms, resources, godMode, onRefresh }: TelemetryPaneProps) {
  const handleChaos = async (type: string, farmId: number, payload: Record<string, unknown> = {}) => {
    try {
      await fetch('/api/events/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, farmId, ...payload }),
      });
      onRefresh();
    } catch (err) {
      console.error('Chaos injection failed:', err);
    }
  };

  const handleLeafUpload = async (base64: string) => {
    await fetch('/api/events/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'CV_DISEASE_REPORT', farmId: farms[1]?.id ?? 2, imageBase64: base64 }),
    });
    onRefresh();
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-500">
          📡 Farm Telemetry
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Farm Cards */}
      {farms.map((farm) => {
        const weather = getWeatherBadge(farm.weatherStatus);
        const farmResources = resources.filter((r) => r.currentFarmId === farm.id);
        return (
          <div key={farm.id} className="glass-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-200">{farm.name}</h3>
                <p className="font-mono text-[10px] text-gray-500 mt-0.5">
                  COORD [{(farm.coordinates as { x: number; y: number }).x}, {(farm.coordinates as { x: number; y: number }).y}]
                </p>
              </div>
              <div
                className={`px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase rounded-full border ${weather.color}`}
              >
                {weather.icon} {farm.weatherStatus}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] tracking-wider uppercase text-gray-500">Soil Moisture</span>
              </div>
              <MoistureBar value={farm.soilMoisture} />
            </div>

            <div className="border-t border-white/5 pt-2">
              <span className="text-[9px] tracking-wider uppercase text-gray-500 mb-1 block">
                Resources ({farmResources.length})
              </span>
              {farmResources.map((r) => (
                <ResourceBadge key={r.id} resource={r} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Chaos Injector */}
      {godMode && (
        <div className="space-y-3 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-500">
              ⚡ Trigger Crisis
            </span>
            <div className="flex-1 h-px bg-amber-500/10" />
          </div>

          <div className="grid gap-2">
            <button
              onClick={() => handleChaos('WEATHER_WEBHOOK', farms[0]?.id ?? 1)}
              className="chaos-btn glass-card px-3 py-2.5 text-left text-[11px] font-medium text-gray-300
                         hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
            >
              <span className="flex items-center gap-2">
                <span className="text-base group-hover:scale-110 transition-transform">🌧️</span>
                <span>
                  Flash Storm
                  <span className="block text-[9px] text-gray-500 font-normal">
                    Severe weather → Sector Alpha
                  </span>
                </span>
              </span>
            </button>

            <button
              onClick={() => handleChaos('CV_DISEASE_REPORT', farms[1]?.id ?? 2)}
              className="chaos-btn glass-card px-3 py-2.5 text-left text-[11px] font-medium text-gray-300
                         hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
            >
              <span className="flex items-center gap-2">
                <span className="text-base group-hover:scale-110 transition-transform">🍂</span>
                <span>
                  Fungal Blight
                  <span className="block text-[9px] text-gray-500 font-normal">
                    Disease detected → Sector Beta
                  </span>
                </span>
              </span>
            </button>

            <button
              onClick={() => handleChaos('EQUIPMENT_FAILURE', farms[0]?.id ?? 1)}
              className="chaos-btn glass-card px-3 py-2.5 text-left text-[11px] font-medium text-gray-300
                         hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group"
            >
              <span className="flex items-center gap-2">
                <span className="text-base group-hover:scale-110 transition-transform">🔧</span>
                <span>
                  Tractor Failure
                  <span className="block text-[9px] text-gray-500 font-normal">
                    Mechanical fault → Unit 01
                  </span>
                </span>
              </span>
            </button>
          </div>

          <LeafUploader onUpload={handleLeafUpload} />
        </div>
      )}
    </div>
  );
}

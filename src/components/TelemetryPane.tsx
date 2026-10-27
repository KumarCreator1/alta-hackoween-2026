'use client';

import type { Farm, Resource } from '@/db/schema';
import LeafUploader from './LeafUploader';
import { CloudRain, CloudSun, Sun, Tractor, Shield, Navigation, User } from 'lucide-react';

interface TelemetryPaneProps {
  farms: Farm[];
  resources: Resource[];
  godMode: boolean;
  onRefresh: () => void;
}

export default function TelemetryPane({ farms, resources, onRefresh }: TelemetryPaneProps) {
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
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-4 text-xs font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
        <span>Sector Telemetry Feed</span>
        <span>{farms.length} NODES</span>
      </div>

      <div className="space-y-3">
        {farms.map((f) => (
          <div key={f.id} className="p-3 rounded-lg border border-stone-200 bg-white space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900">{f.code} - {f.name}</span>
              <span className="text-[10px] text-stone-500">{f.weatherStatus}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-600">
              <span>Soil Moisture: {f.soilMoisture}% (Target: {f.targetMoistureMin}-{f.targetMoistureMax}%)</span>
              <span>Wind: {f.windSpeedKmh} km/h</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <LeafUploader onUpload={handleLeafUpload} />
      </div>
    </div>
  );
}

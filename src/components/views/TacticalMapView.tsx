'use client';

import React, { useState } from 'react';
import type { Farm, Resource, IncidentTicket } from '@/db/schema';
import TacticalMap from '@/components/TacticalMap';

interface TacticalMapViewProps {
  farms: Farm[];
  resources: Resource[];
  activeTickets: IncidentTicket[];
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
}

export default function TacticalMapView({
  farms,
  resources,
  activeTickets,
  onTriggerCrisis,
}: TacticalMapViewProps) {
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tactical Vector Schematic Map</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time cross-farm transit corridor, GPS RTK telemetry, and autonomous tractor routing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-xs text-xs font-bold">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  speedMultiplier === spd
                    ? 'bg-[#134E35] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {spd}x Simulation
              </button>
            ))}
          </div>

          <button
            onClick={() => onTriggerCrisis('CV_DISEASE_REPORT', 2, { disease: 'Late Blight Outbreak' })}
            className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span>🔀</span>
            <span>Simulate Tractor Dispatch</span>
          </button>
        </div>
      </div>

      {/* Large Tactical Map Canvas */}
      <div className="donezo-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono">
              Vector Map Navigation // Live Tracking
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
            <span>SECTOR ALPHA: [150, 200]</span>
            <span>•</span>
            <span>SECTOR BETA: [650, 200]</span>
          </div>
        </div>

        <div className="min-h-[400px]">
          <TacticalMap
            farms={farms}
            resources={resources}
            activeTickets={activeTickets}
          />
        </div>
      </div>
    </div>
  );
}


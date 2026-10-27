'use client';

import React, { useState } from 'react';
import type { Farm, Resource, Ticket } from '@/db/schema';
import TacticalMap from '@/components/TacticalMap';
import { Share2 } from 'lucide-react';

interface TacticalMapViewProps {
  farms: Farm[];
  resources: Resource[];
  activeTickets: Ticket[];
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
}

export default function TacticalMapView({
  farms,
  resources,
  activeTickets,
  onTriggerCrisis,
}: TacticalMapViewProps) {
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Multi-Farm Tactical Topology Map</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Geographic hub schematic, inter-sector transit corridors, and real-time fleet tracking across {farms.length} locations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed Controls */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-stone-300 text-xs font-semibold">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  speedMultiplier === spd
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {spd}x Rate
              </button>
            ))}
          </div>

          <button
            onClick={() => onTriggerCrisis('CV_DISEASE_REPORT', farms[1]?.id || 2, { disease: 'Late Blight Outbreak' })}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Simulate Tractor Dispatch</span>
          </button>
        </div>
      </div>

      {/* Large Tactical Map Canvas */}
      <div className="bg-white border border-stone-300 rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">
              Vector Map Navigation // Live Tracking
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
            <span>CORRIDORS: ACTIVE</span>
            <span>NODES: {farms.length}</span>
            <span>FLEET CONNECTED: {resources.length}</span>
          </div>
        </div>

        <TacticalMap
          farms={farms}
          resources={resources}
          activeTickets={activeTickets}
        />
      </div>
    </div>
  );
}

'use client';

import React from 'react';

interface FleetGaugeProps {
  resources: any[];
  farms: any[];
}

export default function FleetGauge({ resources, farms }: FleetGaugeProps) {
  const avgMoisture = farms.length > 0
    ? Math.round(farms.reduce((acc, f) => acc + (f.soilMoisture || 0), 0) / farms.length)
    : 55;

  const total = resources.length || 6;
  const busy = resources.filter((r) => r.status === 'BUSY' || r.status === 'EN_ROUTE').length;
  const idle = resources.filter((r) => r.status === 'IDLE').length;
  const healthPercent = Math.round(((idle + busy) / total) * 100);

  return (
    <div className="flex flex-col items-center justify-between h-full pt-1">
      {/* Semi-circular gauge SVG */}
      <div className="relative w-48 h-28 flex items-center justify-center">
        <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
          {/* Background Track Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Active Progress Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#134E35"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray="126"
            strokeDashoffset={126 - (126 * (healthPercent / 100))}
            className="transition-all duration-1000"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            {healthPercent}%
          </span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Operational
          </span>
        </div>
      </div>

      {/* Moisture & Soil Vitals Info */}
      <div className="w-full grid grid-cols-2 gap-2 text-center pt-2 border-t border-gray-100">
        <div>
          <span className="text-[10px] text-gray-400 font-semibold uppercase block">Avg Moisture</span>
          <span className="text-sm font-bold text-emerald-700">{avgMoisture}%</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-semibold uppercase block">Active Fleet</span>
          <span className="text-sm font-bold text-gray-900">{busy} / {total} Units</span>
        </div>
      </div>

      {/* Legend Dots */}
      <div className="flex items-center gap-4 text-[11px] font-medium text-gray-600 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#134E35]" /> Dispatched
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Standby
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-300" /> Scheduled
        </span>
      </div>
    </div>
  );
}


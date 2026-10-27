'use client';

import React from 'react';
import type { Farm, Resource, IncidentTicket } from '@/db/schema';

interface TacticalMapProps {
  farms: Farm[];
  resources: Resource[];
  activeTickets: IncidentTicket[];
}

const FARM_POSITIONS = [
  { cx: 180, cy: 150 }, // Sector Alpha (left)
  { cx: 580, cy: 150 }, // Sector Beta (right)
];

export default function TacticalMap({
  farms,
  resources,
  activeTickets,
}: TacticalMapProps) {
  // Find pending or active cross-farm transfers
  const pendingTransit = activeTickets.flatMap((t) =>
    (t.proposedMutations || [])
      .filter((m) => m.action === 'REASSIGN_RESOURCE')
      .map((m) => ({
        mutation: m,
        status: t.status,
        ticketId: t.id,
      }))
  );

  const isEnRoute = resources.some((r) => r.status === 'EN_ROUTE');
  const hasPendingApproval = pendingTransit.some((p) => p.status === 'AWAITING_APPROVAL');
  const hasDispatched = pendingTransit.some((p) => p.status === 'DISPATCHED') || isEnRoute;

  const farmAlpha = farms[0] || {
    name: 'Sector Alpha - North Valley',
    soilMoisture: 42,
    weatherStatus: 'Partly Cloudy, 28°C',
    coordinates: { x: 150, y: 200 },
  };

  const farmBeta = farms[1] || {
    name: 'Sector Beta - High Plains',
    soilMoisture: 67,
    weatherStatus: 'Clear Skies, 32°C',
    coordinates: { x: 650, y: 200 },
  };

  const alphaResources = resources.filter((r) => r.currentFarmId === farmAlpha.id || r.currentFarmId === 1);
  const betaResources = resources.filter((r) => r.currentFarmId === farmBeta.id || r.currentFarmId === 2);

  return (
    <div className="w-full flex flex-col h-full">
      {/* Schematic Map SVG Container */}
      <div className="relative w-full h-[290px] bg-gradient-to-b from-gray-50/70 to-white rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center">
        {/* Background Grid Pattern */}
        <svg
          viewBox="0 0 760 300"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="tactical-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E7EB" strokeWidth="0.8" strokeOpacity="0.6" />
            </pattern>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.08" />
            </filter>
            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#134E35" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width="760" height="300" fill="url(#tactical-grid)" />

          {/* Transit Corridor Highway */}
          <line
            x1={FARM_POSITIONS[0].cx}
            y1={FARM_POSITIONS[0].cy}
            x2={FARM_POSITIONS[1].cx}
            y2={FARM_POSITIONS[1].cy}
            stroke="#D1D5DB"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          <text
            x="380"
            y={FARM_POSITIONS[0].cy - 14}
            textAnchor="middle"
            className="text-[10px] font-bold fill-gray-400 tracking-[0.2em] font-mono"
          >
            ACTIVE TRANSIT CORRIDOR (INTER-SECTOR HWY)
          </text>

          {/* Dynamic Bezier Curve during Proposed or Dispatched Routing */}
          {(hasPendingApproval || hasDispatched) && (
            <g>
              <path
                d={`M ${FARM_POSITIONS[0].cx} ${FARM_POSITIONS[0].cy} Q 380 60 ${FARM_POSITIONS[1].cx} ${FARM_POSITIONS[1].cy}`}
                fill="none"
                stroke={hasDispatched ? '#10B981' : '#F59E0B'}
                strokeWidth={hasDispatched ? '3.5' : '2.5'}
                strokeDasharray={hasDispatched ? 'none' : '8 6'}
                className={hasPendingApproval ? 'transit-line' : ''}
              />

              {/* Animated Tractor sliding from Alpha to Beta if Dispatched */}
              {hasDispatched && (
                <g>
                  <circle r="14" fill="#134E35" filter="url(#shadow)">
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      path={`M ${FARM_POSITIONS[0].cx} ${FARM_POSITIONS[0].cy} Q 380 60 ${FARM_POSITIONS[1].cx} ${FARM_POSITIONS[1].cy}`}
                    />
                  </circle>
                  <text fontSize="13" textAnchor="middle" dy="4">
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      path={`M ${FARM_POSITIONS[0].cx} ${FARM_POSITIONS[0].cy} Q 380 60 ${FARM_POSITIONS[1].cx} ${FARM_POSITIONS[1].cy}`}
                    />
                    🚜
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Sector Alpha Node (Left) */}
          <g transform={`translate(${FARM_POSITIONS[0].cx}, ${FARM_POSITIONS[0].cy})`}>
            {/* Outer Ring */}
            <circle r="52" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" filter="url(#shadow)" />
            <circle r="44" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1.5" />
            <text y="-8" textAnchor="middle" fontSize="22">🌾</text>
            <text y="14" textAnchor="middle" className="text-[11px] font-bold fill-gray-900 tracking-tight">
              ALPHA
            </text>
            <text y="26" textAnchor="middle" className="text-[9px] font-semibold fill-emerald-700">
              {alphaResources.length} Assets
            </text>
          </g>

          {/* Sector Beta Node (Right) */}
          <g transform={`translate(${FARM_POSITIONS[1].cx}, ${FARM_POSITIONS[1].cy})`}>
            {/* Outer Ring */}
            <circle r="52" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" filter="url(#shadow)" />
            <circle r="44" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
            <text y="-8" textAnchor="middle" fontSize="22">🌽</text>
            <text y="14" textAnchor="middle" className="text-[11px] font-bold fill-gray-900 tracking-tight">
              BETA
            </text>
            <text y="26" textAnchor="middle" className="text-[9px] font-semibold fill-blue-700">
              {betaResources.length} Assets
            </text>
          </g>
        </svg>

        {/* Real-time Status Overlay Pill */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-gray-700">
              Sector Alpha: <span className="font-mono text-emerald-700 font-semibold">{farmAlpha.soilMoisture}% Moisture</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-[11px] text-gray-500">{farmAlpha.weatherStatus}</span>
          </div>

          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[11px] font-bold text-gray-700">
              Sector Beta: <span className="font-mono text-blue-700 font-semibold">{farmBeta.soilMoisture}% Moisture</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-[11px] text-gray-500">{farmBeta.weatherStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

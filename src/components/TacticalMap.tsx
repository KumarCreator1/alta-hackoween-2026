'use client';

import React from 'react';
import type { Farm, Resource, Ticket, ProposedMutation } from '@/db/schema';

interface TacticalMapProps {
  farms: Farm[];
  resources: Resource[];
  activeTickets: Ticket[];
}

export default function TacticalMap({
  farms,
  resources,
  activeTickets,
}: TacticalMapProps) {
  // Calculate positions for all farms
  const farmPositions = farms.map((farm, index) => {
    const total = farms.length;
    let cx = 380;
    let cy = 150;

    if (farm.coordinates && typeof farm.coordinates.x === 'number' && typeof farm.coordinates.y === 'number') {
      cx = Math.min(680, Math.max(90, farm.coordinates.x));
      cy = Math.min(230, Math.max(70, farm.coordinates.y));
    } else if (total === 1) {
      cx = 380; cy = 150;
    } else if (total === 2) {
      cx = index === 0 ? 200 : 560;
      cy = 150;
    } else if (total === 3) {
      const p = [{ cx: 180, cy: 180 }, { cx: 380, cy: 90 }, { cx: 580, cy: 180 }];
      cx = p[index].cx; cy = p[index].cy;
    } else if (total === 4) {
      const p = [
        { cx: 140, cy: 120 },
        { cx: 380, cy: 80 },
        { cx: 620, cy: 120 },
        { cx: 380, cy: 220 },
      ];
      cx = p[index].cx; cy = p[index].cy;
    } else {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      cx = Math.round(380 + 260 * Math.cos(angle));
      cy = Math.round(150 + 85 * Math.sin(angle));
    }

    return { farm, cx, cy };
  });

  const getPositionByFarmId = (id: number) => {
    const found = farmPositions.find((fp) => fp.farm.id === id);
    return found ? { cx: found.cx, cy: found.cy } : farmPositions[0] || { cx: 380, cy: 150 };
  };

  // Find pending or active cross-farm transfers
  const pendingTransit = activeTickets.flatMap((t) =>
    (t.proposedMutations || [])
      .filter((m: ProposedMutation) => m.action === 'REASSIGN_RESOURCE')
      .map((m: ProposedMutation) => ({
        mutation: m,
        status: t.status,
        ticketId: t.id,
        fromPos: getPositionByFarmId(m.fromFarmId || farms[0]?.id || 1),
        toPos: getPositionByFarmId(m.toFarmId || farms[1]?.id || 2),
      }))
  );

  const isEnRoute = resources.some((r) => r.status === 'EN_ROUTE');
  const enRouteResources = resources.filter((r) => r.status === 'EN_ROUTE');

  return (
    <div className="w-full flex flex-col h-full">
      {/* Schematic Map SVG Container */}
      <div className="relative w-full h-[310px] bg-stone-50 rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center shadow-2xs">
        {/* SVG Schematic */}
        <svg
          viewBox="0 0 760 300"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="tactical-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" strokeWidth="0.8" strokeOpacity="0.6" />
            </pattern>
            <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="760" height="300" fill="url(#tactical-grid)" />

          {/* Background Transit Corridor Highways between adjacent sectors */}
          {farmPositions.map((fp, i) => {
            const nextFp = farmPositions[(i + 1) % farmPositions.length];
            if (farmPositions.length < 2) return null;
            return (
              <line
                key={`hw-${fp.farm.id}-${nextFp.farm.id}`}
                x1={fp.cx}
                y1={fp.cy}
                x2={nextFp.cx}
                y2={nextFp.cy}
                stroke="#CBD5E1"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
            );
          })}

          {/* Dynamic Active Transit Bezier Curves for mutations / en route */}
          {pendingTransit.map((pt, idx) => {
            const midX = (pt.fromPos.cx + pt.toPos.cx) / 2;
            const midY = Math.min(pt.fromPos.cy, pt.toPos.cy) - 40;
            const pathD = `M ${pt.fromPos.cx} ${pt.fromPos.cy} Q ${midX} ${midY} ${pt.toPos.cx} ${pt.toPos.cy}`;
            const isApproved = pt.status === 'DISPATCHED' || isEnRoute;

            return (
              <g key={`transit-${pt.ticketId}-${idx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isApproved ? '#059669' : '#D97706'}
                  strokeWidth={isApproved ? '3' : '2'}
                  strokeDasharray={isApproved ? 'none' : '6 4'}
                />

                {/* Animated transit dot along path */}
                {isApproved && (
                  <g>
                    <circle r="7" fill="#18181B" filter="url(#shadow)">
                      <animateMotion dur="4s" repeatCount="indefinite" path={pathD} />
                    </circle>
                    <circle r="3" fill="#10B981">
                      <animateMotion dur="4s" repeatCount="indefinite" path={pathD} />
                    </circle>
                  </g>
                )}
              </g>
            );
          })}

          {/* En Route Machinery Direct Indicators */}
          {enRouteResources.map((res, idx) => {
            const targetPos = getPositionByFarmId(res.currentFarmId);
            return (
              <g key={`enroute-${res.id}-${idx}`} transform={`translate(${targetPos.cx + 40}, ${targetPos.cy - 30})`}>
                <rect x="-35" y="-12" width="70" height="20" rx="4" fill="#18181B" />
                <text x="0" y="2" textAnchor="middle" fontSize="9" fill="#FFFFFF" fontWeight="bold" fontFamily="monospace">
                  EN ROUTE
                </text>
              </g>
            );
          })}

          {/* Dynamic Farm Nodes */}
          {farmPositions.map((fp) => {
            const farmRes = resources.filter((r) => r.currentFarmId === fp.farm.id);
            const isAlarm = fp.farm.weatherStatus.includes('WARNING') || fp.farm.weatherStatus.includes('STORM');

            return (
              <g key={`farm-node-${fp.farm.id}`} transform={`translate(${fp.cx}, ${fp.cy})`}>
                {/* Node Outer Ring */}
                <circle
                  r="42"
                  fill="#FFFFFF"
                  stroke={isAlarm ? '#F87171' : '#CBD5E1'}
                  strokeWidth={isAlarm ? '2.5' : '1.5'}
                  filter="url(#shadow)"
                />
                <circle
                  r="34"
                  fill={isAlarm ? '#FEF2F2' : '#F8FAFC'}
                  stroke={isAlarm ? '#EF4444' : '#E2E8F0'}
                  strokeWidth="1"
                />
                <text y="-4" textAnchor="middle" className="text-[11px] font-bold fill-stone-900 tracking-tight font-mono">
                  {fp.farm.code || `SEC-0${fp.farm.id}`}
                </text>
                <text y="10" textAnchor="middle" className="text-[9px] font-medium fill-stone-500">
                  {fp.farm.name.split(' - ')[1] || 'Hub'}
                </text>
                <text y="22" textAnchor="middle" className="text-[8.5px] font-semibold fill-emerald-800 font-mono">
                  {farmRes.length} Assets
                </text>
              </g>
            );
          })}
        </svg>

        {/* Real-time Status Overlay Bar */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 overflow-x-auto pointer-events-none no-scrollbar">
          {farms.slice(0, 4).map((f) => {
            const isWarn = f.weatherStatus.includes('WARNING') || f.weatherStatus.includes('STORM');
            return (
              <div
                key={`badge-${f.id}`}
                className="flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded border border-stone-200 shadow-2xs whitespace-nowrap text-[10px]"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isWarn ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="font-bold text-stone-800 font-mono">{f.code || f.name.split(' - ')[0]}:</span>
                <span className="font-mono text-emerald-800 font-semibold">{f.soilMoisture}%</span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500 truncate max-w-[110px]">{f.weatherStatus}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

'use client';

import type { Farm, Resource, IncidentTicket, ProposedMutation } from '@/db/schema';

interface TacticalMapProps {
  farms: Farm[];
  resources: Resource[];
  activeTickets: IncidentTicket[];
}

const FARM_POSITIONS = [
  { cx: 180, cy: 180 }, // Farm Alpha (left)
  { cx: 720, cy: 180 }, // Farm Beta (right)
];

function HexNode({
  cx,
  cy,
  farm,
  resourceCount,
}: {
  cx: number;
  cy: number;
  farm: Farm;
  resourceCount: number;
}) {
  const weatherColor =
    farm.weatherStatus.toLowerCase().includes('storm') || farm.weatherStatus.toLowerCase().includes('alert')
      ? '#EF4444'
      : farm.weatherStatus.toLowerCase().includes('warn') || farm.weatherStatus.toLowerCase().includes('cloud')
        ? '#F59E0B'
        : '#10B981';

  // Hexagon points
  const r = 48;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <g>
      {/* Glow */}
      <polygon
        points={points}
        fill="none"
        stroke={weatherColor}
        strokeWidth="1"
        opacity="0.15"
        filter="url(#glow)"
      />
      {/* Hex border */}
      <polygon
        points={points}
        fill="rgba(255,255,255,0.03)"
        stroke={weatherColor}
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Inner icon */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fill="white">
        🌾
      </text>
      {/* Farm name */}
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="8"
        fill="#9CA3AF"
        fontFamily="monospace"
        letterSpacing="0.05em"
      >
        {farm.name.split(' - ')[0]?.toUpperCase()}
      </text>
      {/* Resource count badge */}
      <circle cx={cx + 38} cy={cy - 38} r="10" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x={cx + 38} y={cy - 34} textAnchor="middle" fontSize="8" fill="#E5E7EB" fontFamily="monospace">
        {resourceCount}
      </text>
      {/* Status indicator ring */}
      <circle cx={cx} cy={cy + 36} r="3" fill={weatherColor} opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function ResourceDot({
  resource,
  farmPos,
  index,
}: {
  resource: Resource;
  farmPos: { cx: number; cy: number };
  index: number;
}) {
  const statusColors: Record<string, string> = {
    IDLE: '#10B981',
    BUSY: '#F59E0B',
    MAINTENANCE: '#EF4444',
    EN_ROUTE: '#06B6D4',
  };
  const typeIcons: Record<string, string> = {
    TRACTOR: '🚜',
    HARVESTER: '🌾',
    DRONE: '🛸',
    WORKER: '👷',
  };
  const color = statusColors[resource.status] || '#6B7280';
  // Position resources in a column below the farm hex
  const x = farmPos.cx - 30 + (index % 3) * 30;
  const y = farmPos.cy + 65 + Math.floor(index / 3) * 25;

  return (
    <g>
      <rect x={x - 12} y={y - 8} width="24" height="16" rx="4" fill="rgba(0,0,0,0.5)" stroke={color} strokeWidth="0.5" opacity="0.8" />
      <text x={x} y={y + 3} textAnchor="middle" fontSize="9">
        {typeIcons[resource.type] || '📦'}
      </text>
      {/* Status dot */}
      <circle cx={x + 10} cy={y - 6} r="2" fill={color}>
        {resource.status === 'EN_ROUTE' && (
          <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
        )}
      </circle>
    </g>
  );
}

export default function TacticalMap({ farms, resources, activeTickets }: TacticalMapProps) {
  // Determine transit lines from tickets with REASSIGN_RESOURCE mutations
  const transitLines = activeTickets.flatMap((ticket) => {
    const mutations = (ticket.proposedMutations as ProposedMutation[]) || [];
    return mutations
      .filter((m) => m.action === 'REASSIGN_RESOURCE' && m.fromFarmId && m.toFarmId)
      .map((m) => ({
        from: m.fromFarmId!,
        to: m.toFarmId!,
        status: ticket.status,
        ticketId: ticket.id,
      }));
  });

  return (
    <div className="glass-card p-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-500">
          🗺️ Tactical Overview
        </span>
        <div className="flex-1 h-px bg-white/5" />
        <div className="flex items-center gap-3">
          {['IDLE', 'BUSY', 'EN_ROUTE', 'MAINTENANCE'].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  s === 'IDLE' ? 'bg-emerald-500' : s === 'BUSY' ? 'bg-amber-500' : s === 'EN_ROUTE' ? 'bg-cyan-500' : 'bg-red-500'
                }`}
              />
              <span className="text-[8px] font-mono text-gray-500">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 900 320" className="w-full" style={{ minHeight: 240 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="gridGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Background Grid */}
        {Array.from({ length: 18 }, (_, i) => (
          <line
            key={`vg-${i}`}
            x1={i * 50}
            y1="0"
            x2={i * 50}
            y2="320"
            stroke="rgba(255,255,255,0.02)"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line
            key={`hg-${i}`}
            x1="0"
            y1={i * 50}
            x2="900"
            y2={i * 50}
            stroke="rgba(255,255,255,0.02)"
            strokeWidth="0.5"
          />
        ))}

        {/* Transit corridor (base) */}
        <line
          x1={FARM_POSITIONS[0].cx}
          y1={FARM_POSITIONS[0].cy}
          x2={FARM_POSITIONS[1].cx}
          y2={FARM_POSITIONS[1].cy}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          strokeDasharray="6 4"
        />
        <text
          x={450}
          y={FARM_POSITIONS[0].cy - 12}
          textAnchor="middle"
          fontSize="7"
          fill="rgba(255,255,255,0.15)"
          fontFamily="monospace"
          letterSpacing="0.15em"
        >
          TRANSIT CORRIDOR
        </text>

        {/* Active transit lines */}
        {transitLines.map((t, i) => {
          const fromPos = farms.findIndex((f) => f.id === t.from);
          const toPos = farms.findIndex((f) => f.id === t.to);
          if (fromPos === -1 || toPos === -1) return null;
          const fp = FARM_POSITIONS[fromPos] || FARM_POSITIONS[0];
          const tp = FARM_POSITIONS[toPos] || FARM_POSITIONS[1];
          const midY = (fp.cy + tp.cy) / 2 - 40;
          const isDispatched = t.status === 'DISPATCHED';

          return (
            <g key={`transit-${i}`}>
              <path
                d={`M ${fp.cx} ${fp.cy} Q ${(fp.cx + tp.cx) / 2} ${midY} ${tp.cx} ${tp.cy}`}
                fill="none"
                stroke={isDispatched ? '#10B981' : '#F59E0B'}
                strokeWidth={isDispatched ? 2 : 1.5}
                strokeDasharray={isDispatched ? 'none' : '4 4'}
                opacity={0.7}
                className={!isDispatched ? '' : ''}
              >
                {!isDispatched && (
                  <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
                )}
              </path>
              {isDispatched && (
                <g>
                  <circle r="6" fill="#10B981" opacity="0.8">
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      path={`M ${fp.cx} ${fp.cy} Q ${(fp.cx + tp.cx) / 2} ${midY} ${tp.cx} ${tp.cy}`}
                    />
                  </circle>
                  <text fontSize="10" dy="4" dx="-5">
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      path={`M ${fp.cx} ${fp.cy} Q ${(fp.cx + tp.cx) / 2} ${midY} ${tp.cx} ${tp.cy}`}
                    />
                    🚜
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Farm nodes */}
        {farms.map((farm, i) => {
          const pos = FARM_POSITIONS[i];
          if (!pos) return null;
          const farmResources = resources.filter((r) => r.currentFarmId === farm.id);
          return (
            <g key={farm.id}>
              <HexNode cx={pos.cx} cy={pos.cy} farm={farm} resourceCount={farmResources.length} />
              {farmResources.map((r, ri) => (
                <ResourceDot key={r.id} resource={r} farmPos={pos} index={ri} />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

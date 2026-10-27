'use client';

import React, { useState, useEffect } from 'react';
import type { Resource, Task, EventLog } from '@/db/schema';
import WorkerPhone from './WorkerPhone';
import LiveTerminal from './LiveTerminal';

interface EdgeTrackerCardProps {
  resources: Resource[];
  tasks: Task[];
  logs: EventLog[];
}

export default function EdgeTrackerCard({
  resources,
  tasks,
  logs,
}: EdgeTrackerCardProps) {
  const [activeView, setActiveView] = useState<'terminal' | 'phone'>('terminal');
  const [seconds, setSeconds] = useState(14852); // ~4 hours shift time

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const enRoute = resources.find((r) => r.status === 'EN_ROUTE');

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0B2317] via-[#0D1F17] to-[#050C09] text-white p-4 shadow-md relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 font-mono">
            Edge Dispatch // Telemetry
          </span>
          <div className="text-xl font-bold tracking-tight font-mono text-gray-100 mt-0.5">
            {formatTimer(seconds)}
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveView('terminal')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              activeView === 'terminal'
                ? 'bg-emerald-500 text-gray-950 shadow-xs'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Terminal
          </button>
          <button
            onClick={() => setActiveView('phone')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              activeView === 'phone'
                ? 'bg-emerald-500 text-gray-950 shadow-xs'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Worker
          </button>
        </div>
      </div>

      {/* En Route Emergency Alert Banner if any */}
      {enRoute && (
        <div className="my-2 bg-amber-500/20 border border-amber-500/30 rounded-xl px-2.5 py-1.5 flex items-center gap-2 z-10 slide-up">
          <span className="text-sm">⚡</span>
          <div className="text-[11px] font-semibold text-amber-300">
            Rerouting: {enRoute.name} → Farm #{enRoute.currentFarmId}
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="flex-1 my-2 overflow-hidden z-10 min-h-[170px] max-h-[220px]">
        {activeView === 'terminal' ? (
          <div className="h-full bg-black/40 rounded-xl border border-white/10 p-2 overflow-hidden">
            <LiveTerminal logs={logs} />
          </div>
        ) : (
          <div className="h-full bg-black/40 rounded-xl border border-white/10 p-2 overflow-y-auto">
            <WorkerPhone resources={resources} tasks={tasks} />
          </div>
        )}
      </div>

      {/* Footer Status Indicators */}
      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400/80 pt-2 border-t border-white/10 z-10">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          SSE UPLINK LIVE
        </span>
        <span className="text-gray-400">PORTS: 5432 / 3000</span>
      </div>
    </div>
  );
}

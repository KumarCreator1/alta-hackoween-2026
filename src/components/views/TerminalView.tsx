'use client';

import React, { useState } from 'react';
import type { EventLog } from '@/db/schema';

interface TerminalViewProps {
  logs: EventLog[];
}

export default function TerminalView({ logs }: TerminalViewProps) {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const levelColors: Record<string, string> = {
    INFO: 'text-gray-300',
    WARN: 'text-amber-400',
    CRITICAL: 'text-red-400 font-bold',
    AI: 'text-cyan-400',
    DISPATCH: 'text-emerald-400 font-semibold',
  };

  const formatTime = (timestamp: string | Date) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return '--:--:--';
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `arm-telemetry-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Telemetry Terminal Feed</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Mission control event stream, state diff audits, and autonomous dispatches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="btn-outline px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Terminal Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200">
        {/* Level Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'INFO', 'DISPATCH', 'AI', 'WARN', 'CRITICAL'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterLevel === lvl
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Search in logs */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search log stream..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-gray-900"
          />
          <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Terminal Console Box */}
      <div className="rounded-2xl bg-gray-950 text-gray-200 p-5 font-mono text-xs border border-gray-800 shadow-xl min-h-[500px] max-h-[600px] overflow-y-auto space-y-2">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 text-[11px] text-gray-500">
          <span>PARALLAX ARM TELEMETRY LOG // ISO 11783 PROTOCOL</span>
          <span>{filteredLogs.length} EVENTS RECORDED</span>
        </div>

        {filteredLogs.map((log, i) => (
          <div key={`term-${log.id}-${i}`} className="flex items-start gap-3 hover:bg-white/5 py-1 px-2 rounded-lg transition-colors">
            <span className="text-gray-500 shrink-0 text-[10px]">
              [{formatTime(log.timestamp)}]
            </span>
            <span className="shrink-0">{log.emoji}</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                log.level === 'CRITICAL'
                  ? 'bg-red-500/30 text-red-400'
                  : log.level === 'WARN'
                  ? 'bg-amber-500/30 text-amber-400'
                  : log.level === 'DISPATCH'
                  ? 'bg-emerald-500/30 text-emerald-400'
                  : log.level === 'AI'
                  ? 'bg-cyan-500/30 text-cyan-400'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {log.level}
            </span>
            <span className={`${levelColors[log.level] || 'text-gray-300'} flex-1 leading-relaxed`}>
              {log.message}
            </span>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            No telemetry events matching the current filter.
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import type { EventLog } from '@/db/schema';
import { Download, Search } from 'lucide-react';

interface TerminalViewProps {
  logs: EventLog[];
  onRefresh: () => void;
}

export default function TerminalView({ logs }: TerminalViewProps) {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q) ||
        (log.farmId != null && String(log.farmId).includes(q))
      );
    }
    return true;
  });

  const levelBadges: Record<string, { bg: string; text: string }> = {
    INFO: { bg: 'bg-stone-800', text: 'text-stone-300' },
    WARN: { bg: 'bg-amber-900/60', text: 'text-amber-300' },
    CRITICAL: { bg: 'bg-red-900/60', text: 'text-red-300' },
    AI: { bg: 'bg-sky-900/60', text: 'text-sky-300' },
    DISPATCH: { bg: 'bg-emerald-900/60', text: 'text-emerald-300' },
  };

  const handleExportJSON = () => {
    const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(logs, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `arm-telemetry-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">System Audit & Telemetry Log</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Operational event stream, state diff audits, and autonomous dispatches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone-300 hover:bg-stone-50 text-stone-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Export JSON Audit</span>
          </button>
        </div>
      </div>

      {/* Terminal Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-stone-200">
        {/* Level Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'INFO', 'DISPATCH', 'AI', 'WARN', 'CRITICAL'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                filterLevel === lvl
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
            placeholder="Search log audit stream..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-stone-50 rounded-md border border-stone-200 text-xs focus:outline-none focus:border-stone-500"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
        </div>
      </div>

      {/* Terminal Console Box */}
      <div className="rounded-lg bg-stone-950 text-stone-200 p-4 font-mono text-xs border border-stone-800 shadow-2xs min-h-[480px] max-h-[580px] overflow-y-auto space-y-1.5">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[10px] text-stone-500">
          <span>PARALLAX ARM TELEMETRY LOG</span>
          <span>{filteredLogs.length} ENTRIES</span>
        </div>

        {filteredLogs.map((log) => {
          const badge = levelBadges[log.level] || levelBadges.INFO;
          return (
            <div
              key={log.id}
              className="flex items-start gap-2 py-0.5 hover:bg-white/5 rounded px-1 transition-colors"
            >
              <span className="text-stone-500 shrink-0 text-[10px]">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${badge.bg} ${badge.text}`}>
                {log.level}
              </span>
              {log.farmId != null && (
                <span className="text-[10px] text-stone-500 shrink-0">
                  SEC-0{log.farmId}
                </span>
              )}
              <span className="text-stone-300 break-words flex-1">
                {log.message}
              </span>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            No log entries match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Search, Plus, RefreshCw, AlertTriangle } from 'lucide-react';

interface TopBarProps {
  godMode: boolean;
  onToggleGodMode: () => void;
  onReset: () => void;
  onTriggerCrisis?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddTask?: () => void;
}

export default function TopBar({
  godMode,
  onToggleGodMode,
  onReset,
  onTriggerCrisis,
  searchQuery,
  onSearchChange,
  onOpenAddTask,
}: TopBarProps) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    await onReset();
    setResetting(false);
  };

  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-stone-200 bg-white sticky top-0 z-30 select-none">
      {/* Left: Search Bar */}
      <div className="relative w-80">
        <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
          <Search className="w-3.5 h-3.5" />
        </span>
        <input
          type="text"
          placeholder="Search farm sector, fleet asset, work order..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-12 py-1.5 bg-stone-50 hover:bg-white focus:bg-white text-xs font-medium text-stone-900 placeholder-stone-400 rounded-md border border-stone-300 focus:border-stone-500 focus:outline-none transition-colors"
        />
        <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-stone-400 bg-white border border-stone-200 rounded">
            Cmd+F
          </kbd>
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Quick Add Task */}
        {onOpenAddTask && (
          <button
            onClick={onOpenAddTask}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Work Order</span>
          </button>
        )}

        {/* Quick Incident Simulation */}
        <button
          onClick={onTriggerCrisis}
          className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone-300 hover:bg-stone-100 text-stone-800 transition-colors flex items-center gap-1.5"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Simulate Weather Anomaly</span>
        </button>

        {/* Reset State Button */}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Data'}</span>
        </button>

        {/* Simulation Mode Toggle */}
        <button
          onClick={onToggleGodMode}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
            godMode
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
          }`}
        >
          Simulation: {godMode ? 'Active' : 'Standby'}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
          <div className="w-7 h-7 rounded-full bg-stone-800 text-white font-bold text-xs flex items-center justify-center">
            VK
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-stone-900 leading-none">Operations Lead</div>
            <div className="text-[10px] text-stone-400 font-mono mt-0.5">Farm Central Station</div>
          </div>
        </div>
      </div>
    </header>
  );
}

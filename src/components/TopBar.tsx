'use client';

import React, { useState } from 'react';

interface TopBarProps {
  godMode: boolean;
  onToggleGodMode: () => void;
  onReset: () => void;
  onTriggerCrisis?: () => void;
}

export default function TopBar({
  godMode,
  onToggleGodMode,
  onReset,
  onTriggerCrisis,
}: TopBarProps) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    await onReset();
    setResetting(false);
  };

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-gray-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
      {/* Left: Search Bar */}
      <div className="relative w-80">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search farm, asset, ticket..."
          className="w-full pl-9 pr-12 py-2 bg-gray-100/80 hover:bg-gray-100 focus:bg-white text-xs font-medium text-gray-800 placeholder-gray-400 rounded-xl border border-transparent focus:border-emerald-600 focus:outline-none transition-all"
        />
        <span className="absolute inset-y-0 right-2.5 flex items-center">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white border border-gray-200 rounded-md shadow-xs">
            ⌘F
          </kbd>
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Trigger Button */}
        <button
          onClick={onTriggerCrisis}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all flex items-center gap-1.5"
        >
          <span>⚡</span>
          <span>Chaos Injector</span>
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {resetting ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-gray-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Resetting...</span>
            </>
          ) : (
            <>
              <span>↺</span>
              <span>Reset Demo</span>
            </>
          )}
        </button>

        {/* God Mode Toggle */}
        <button
          onClick={onToggleGodMode}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
            godMode
              ? 'bg-[#134E35] border-[#134E35] text-white shadow-sm'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          God Mode: {godMode ? 'ON' : 'OFF'}
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Notifications */}
        <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 relative">
          <span>🔔</span>
          <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* User Profile (matches inspiration Totok Michael avatar badge) */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            VK
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-gray-900 leading-tight">Vicky Kumar</div>
            <div className="text-[10px] text-gray-400 font-medium">connect.vickykumar@gmail.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}

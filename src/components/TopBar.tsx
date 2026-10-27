'use client';

import { useState } from 'react';

interface TopBarProps {
  godMode: boolean;
  onToggleGodMode: () => void;
  onReset: () => void;
}

export default function TopBar({ godMode, onToggleGodMode, onReset }: TopBarProps) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    await onReset();
    setResetting(false);
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08]">
      {/* Left: Logo & Status */}
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="pulse-live absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-medium tracking-[0.2em] text-emerald-400 uppercase">Live</span>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <h1 className="text-xs font-semibold tracking-[0.25em] text-gray-200 uppercase">
          Parallax ARM <span className="text-gray-500">//</span> Autonomous Farm Operations
        </h1>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase rounded-md
                     border border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20
                     transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {resetting ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Resetting...
            </span>
          ) : (
            'Reset Demo'
          )}
        </button>
        <button
          onClick={onToggleGodMode}
          className={`px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase rounded-md
                      border transition-all duration-200 ${
                        godMode
                          ? 'border-amber-500/50 text-amber-400 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                          : 'border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'
                      }`}
        >
          ⚡ God Mode
        </button>
      </div>
    </header>
  );
}

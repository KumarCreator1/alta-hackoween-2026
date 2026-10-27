'use client';

import React from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  godMode: boolean;
  onToggleGodMode: () => void;
  incidentCount: number;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  godMode,
  onToggleGodMode,
  incidentCount,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦', count: null },
    { id: 'sectors', label: 'Sectors & Farms', icon: '🌾', count: '2' },
    { id: 'map', label: 'Tactical Map', icon: '🗺️', count: null },
    { id: 'fleet', label: 'Machinery Fleet', icon: '🚜', count: '6' },
    { id: 'crew', label: 'Field Agronomists', icon: '👷', count: null },
  ];

  const crisisItems = [
    { id: 'chaos', label: 'Chaos Injector', icon: '⚡', highlight: godMode },
    { id: 'incidents', label: 'HITL Incident Diff', icon: '⚠️', count: incidentCount > 0 ? `${incidentCount}` : null },
    { id: 'terminal', label: 'Telemetry Log', icon: '📟', count: null },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between shrink-0 p-5 min-h-screen select-none">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-[#134E35] flex items-center justify-center text-white text-lg shadow-sm">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-gray-900">PARALLAX</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
            </div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              ARM Command Center
            </p>
          </div>
        </div>

        {/* Section: MENU */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase px-3 block mb-2">
            Menu
          </span>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#134E35] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.count && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: CRISIS & AI */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase px-3 block mb-2">
            Crisis & AI Operations
          </span>
          <nav className="space-y-1">
            {crisisItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#134E35] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.count && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: GENERAL */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase px-3 block mb-2">
            General
          </span>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-gray-600">
              <span className="flex items-center gap-2">
                <span className="text-sm">🗄️</span> Supabase Cloud
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
              </span>
            </div>
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-gray-600">
              <span className="flex items-center gap-2">
                <span className="text-sm">🤖</span> Gemini 3.8 AI
              </span>
              <span className="text-[10px] text-cyan-600 font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Promo Card (Inspired by Donezo Mobile App card) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#134E35] to-[#0A291C] text-white p-4 shadow-md">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs">
            📱
          </div>
          <span className="text-xs font-bold tracking-tight">Field Worker App</span>
        </div>
        <p className="text-[11px] text-emerald-200/80 mb-3 leading-relaxed">
          Edge telemetry viewport synced to active shifts.
        </p>
        <button
          onClick={() => onTabChange('worker')}
          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs rounded-xl transition-colors"
        >
          View Field Mobile
        </button>
      </div>
    </aside>
  );
}


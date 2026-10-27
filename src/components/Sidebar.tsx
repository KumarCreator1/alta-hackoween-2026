'use client';

import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Map,
  Tractor,
  Users,
  AlertTriangle,
  Terminal,
  Smartphone,
  Database,
  Cpu,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  godMode: boolean;
  onToggleGodMode: () => void;
  incidentCount: number;
  taskCount?: number;
  farmCount?: number;
  fleetCount?: number;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  incidentCount,
  taskCount,
  farmCount,
  fleetCount,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
    { id: 'tasks', label: 'Work Orders', icon: ClipboardList, count: taskCount != null ? `${taskCount}` : null },
    { id: 'sectors', label: 'Sectors & Farms', icon: MapPin, count: farmCount != null ? `${farmCount}` : null },
    { id: 'map', label: 'Tactical Map', icon: Map, count: null },
    { id: 'fleet', label: 'Machinery Fleet', icon: Tractor, count: fleetCount != null ? `${fleetCount}` : null },
    { id: 'crew', label: 'Field Agronomists', icon: Users, count: null },
  ];

  const operationsItems = [
    { id: 'chaos', label: 'Risk & Weather Sim', icon: AlertTriangle, count: null },
    { id: 'incidents', label: 'Incident Queue', icon: Layers, count: incidentCount > 0 ? `${incidentCount}` : null },
    { id: 'terminal', label: 'Audit Trail', icon: Terminal, count: null },
  ];

  return (
    <aside className="w-64 bg-white border-r border-stone-200 flex flex-col justify-between shrink-0 p-5 min-h-screen select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            ARM
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-stone-900">PARALLAX</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
              Operations Center
            </p>
          </div>
        </div>

        {/* Section: MENU */}
        <div>
          <span className="text-[10px] font-bold text-stone-400 tracking-[0.15em] uppercase px-3 block mb-2">
            Operations
          </span>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
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

        {/* Section: CONTINGENCY & AUDIT */}
        <div>
          <span className="text-[10px] font-bold text-stone-400 tracking-[0.15em] uppercase px-3 block mb-2">
            Incident Control
          </span>
          <nav className="space-y-1">
            {operationsItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: SYSTEM HEALTH */}
        <div>
          <span className="text-[10px] font-bold text-stone-400 tracking-[0.15em] uppercase px-3 block mb-2">
            Infrastructure
          </span>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-stone-600 bg-stone-50 border border-stone-200">
              <span className="flex items-center gap-2 font-medium">
                <Database className="w-3.5 h-3.5 text-stone-500" /> Supabase Pooler
              </span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> OK
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-stone-600 bg-stone-50 border border-stone-200">
              <span className="flex items-center gap-2 font-medium">
                <Cpu className="w-3.5 h-3.5 text-stone-500" /> Gemini Reasoning
              </span>
              <span className="text-[10px] text-stone-700 font-bold">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Field Worker Mobile Navigation Card */}
      <div className="rounded-xl border border-stone-300 bg-stone-50 p-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-stone-700" />
          <span className="text-xs font-bold text-stone-900 tracking-tight">Field Worker Viewport</span>
        </div>
        <p className="text-[11px] text-stone-500 leading-snug">
          Mobile emulator for agronomists and operators on active field shifts.
        </p>
        <button
          onClick={() => onTabChange('worker')}
          className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-md transition-colors"
        >
          Open Mobile Viewport
        </button>
      </div>
    </aside>
  );
}

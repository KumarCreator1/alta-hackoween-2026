'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { Farm, Resource, Task, IncidentTicket, EventLog } from '@/db/schema';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import TacticalMap from '@/components/TacticalMap';
import TicketQueue from '@/components/TicketQueue';
import CrisisCard from '@/components/CrisisCard';
import TeamCollaboration from '@/components/TeamCollaboration';
import FleetGauge from '@/components/FleetGauge';
import EdgeTrackerCard from '@/components/EdgeTrackerCard';

export default function ARMCommandCenter() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<IncidentTicket[]>([]);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [godMode, setGodMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch full system state from Supabase
  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Failed to fetch state');
      const data = await res.json();
      setFarms(data.farms || []);
      setResources(data.resources || []);
      setTasks(data.tasks || []);
      setTickets(data.tickets || []);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('State refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
    // Refresh telemetry every 3.5s
    const interval = setInterval(refreshState, 3500);
    return () => clearInterval(interval);
  }, [refreshState]);

  // Handle Demo Reset
  const handleReset = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFarms(data.farms || []);
        setResources(data.resources || []);
        setTasks(data.tasks || []);
        setTickets(data.tickets || []);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // Handle Ticket Approval
  const handleApprove = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setFarms(data.farms || []);
        setResources(data.resources || []);
        setTasks(data.tasks || []);
        setTickets(data.tickets || []);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  // Handle Ticket Override / Rejection
  const handleReject = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reject`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setFarms(data.farms || []);
        setResources(data.resources || []);
        setTasks(data.tasks || []);
        setTickets(data.tickets || []);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  // Handle Chaos Crisis Injection
  const handleTriggerCrisis = async (type: string, farmId: number, payload: Record<string, unknown> = {}) => {
    try {
      const res = await fetch('/api/events/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, farmId, payload }),
      });
      if (res.ok) {
        await refreshState();
      }
    } catch (err) {
      console.error('Chaos injection error:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F5F7] select-none">
      {/* 1. Left Sidebar Navigation (Donezo aesthetic) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'chaos') setGodMode(true);
        }}
        godMode={godMode}
        onToggleGodMode={() => setGodMode(!godMode)}
        incidentCount={tickets.filter((t) => t.status !== 'RESOLVED').length}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <TopBar
          godMode={godMode}
          onToggleGodMode={() => setGodMode(!godMode)}
          onReset={handleReset}
          onTriggerCrisis={() => handleTriggerCrisis('WEATHER_WEBHOOK', 1, { condition: 'HEAVY_RAIN_WARNING' })}
        />

        {/* Dashboard Body */}
        <main className="p-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Hero Row: Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Operations Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Plan, prioritize, and accomplish multi-farm resource reallocation with real-time AI triage.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleTriggerCrisis('WEATHER_WEBHOOK', 1, { condition: 'HEAVY_RAIN_WARNING' })
                }
                className="btn-primary px-4 py-2 text-xs flex items-center gap-2 shadow-sm"
              >
                <span>+</span>
                <span>Trigger Crisis Event</span>
              </button>
              <button
                onClick={handleReset}
                className="btn-outline px-4 py-2 text-xs flex items-center gap-2"
              >
                <span>↺</span>
                <span>Reset Demo State</span>
              </button>
            </div>
          </div>

          {/* Stat Cards (Exact Donezo 4-column metric row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Hero Accent Green Card */}
            <div className="bg-[#134E35] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-emerald-200">Total Sectors</span>
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white group-hover:scale-110 transition-transform">
                  ↗
                </span>
              </div>
              <div className="my-3">
                <div className="text-3xl font-bold tracking-tight">2 Farms</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300">
                    Alpha & Beta
                  </span>
                  <span className="text-[11px] text-emerald-200/80">100% Online</span>
                </div>
              </div>
            </div>

            {/* Card 2: Connected Assets */}
            <div className="donezo-card p-5 flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-gray-500">Connected Fleet</span>
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 group-hover:scale-110 transition-transform">
                  ↗
                </span>
              </div>
              <div className="my-3">
                <div className="text-3xl font-bold tracking-tight text-gray-900">
                  {resources.length || 6} Units
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Tractors & Drones
                  </span>
                  <span className="text-[11px] text-gray-500">2 Crew Active</span>
                </div>
              </div>
            </div>

            {/* Card 3: Scheduled Operations */}
            <div className="donezo-card p-5 flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-gray-500">Scheduled Tasks</span>
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 group-hover:scale-110 transition-transform">
                  ↗
                </span>
              </div>
              <div className="my-3">
                <div className="text-3xl font-bold tracking-tight text-gray-900">
                  {tasks.length || 12}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    Multi-Sector
                  </span>
                  <span className="text-[11px] text-gray-500">Optimized Slots</span>
                </div>
              </div>
            </div>

            {/* Card 4: Active Incidents */}
            <div className="donezo-card p-5 flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-gray-500">Pending Incidents</span>
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 group-hover:scale-110 transition-transform">
                  ↗
                </span>
              </div>
              <div className="my-3">
                <div className="text-3xl font-bold tracking-tight text-gray-900">
                  {tickets.filter((t) => t.status !== 'RESOLVED').length}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      tickets.filter((t) => t.status !== 'RESOLVED').length > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tickets.filter((t) => t.status !== 'RESOLVED').length > 0
                      ? 'HITL Review Req'
                      : 'Zero Conflicts'}
                  </span>
                  <span className="text-[11px] text-gray-500">Autonomous</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Tactical Center Grid (8 Columns Left + 4 Columns Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Center Left (Col 8): 2D Vector Map & HITL Incident Diff Queue */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: 2D Tactical Multi-Farm Schematic Map */}
              <div className="donezo-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Tactical Vector Schematic Map
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Real-time cross-farm transit corridor & machinery movement
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                    TRANSIT HIGHWAY ACTIVE
                  </span>
                </div>

                <TacticalMap
                  farms={farms}
                  resources={resources}
                  activeTickets={tickets}
                />
              </div>

              {/* Card 2: HITL Incident Diff Queue */}
              <div className="donezo-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      HITL Incident Diff Queue (The CRM Layer)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Deterministic AI transaction proposals awaiting 1-click human execution
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">
                    {tickets.filter((t) => t.status !== 'RESOLVED').length} Active
                  </span>
                </div>

                <TicketQueue
                  tickets={tickets}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </div>
            </div>

            {/* Center Right (Col 4): Crisis Operations & Multimodal Leaf CV */}
            <div className="lg:col-span-4">
              <div className="donezo-card p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">
                      Crisis Operations & AI
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                      Interactive Dock
                    </span>
                  </div>

                  <CrisisCard
                    farms={farms}
                    tasks={tasks}
                    onTriggerCrisis={handleTriggerCrisis}
                    onRefresh={refreshState}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Bottom Operations Grid (Col 5 + Col 3 + Col 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bottom Left (Col 5): Team & Asset Collaboration */}
            <div className="lg:col-span-5 donezo-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Team & Fleet Collaboration
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Field agronomists and active machinery status
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-medium">6 Registered</span>
              </div>
              <TeamCollaboration resources={resources} tasks={tasks} />
            </div>

            {/* Bottom Center (Col 3): Fleet Health Radial Gauge */}
            <div className="lg:col-span-3 donezo-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900">
                  Fleet Readiness
                </h3>
                <span className="text-xs text-emerald-600 font-bold">Optimal</span>
              </div>
              <FleetGauge resources={resources} farms={farms} />
            </div>

            {/* Bottom Right (Col 4): Edge Worker Phone & Live Telemetry Feed */}
            <div className="lg:col-span-4">
              <EdgeTrackerCard
                resources={resources}
                tasks={tasks}
                logs={logs}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

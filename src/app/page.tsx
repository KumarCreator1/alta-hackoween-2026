'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Farm, Resource, Task, IncidentTicket, EventLog } from '@/db/schema';
import TopBar from '@/components/TopBar';
import TelemetryPane from '@/components/TelemetryPane';
import TacticalMap from '@/components/TacticalMap';
import TicketQueue from '@/components/TicketQueue';
import WorkerPhone from '@/components/WorkerPhone';
import LiveTerminal from '@/components/LiveTerminal';

export default function ARMCommandCenter() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<IncidentTicket[]>([]);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [godMode, setGodMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch full system state
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
    // Fast telemetry refresh every 2.5 seconds
    const interval = setInterval(refreshState, 2500);
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090A0F] text-gray-200 overflow-hidden select-none font-sans">
      {/* Top Bar Header */}
      <TopBar
        godMode={godMode}
        onToggleGodMode={() => setGodMode(!godMode)}
        onReset={handleReset}
      />

      {loading && farms.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono">
              Booting Parallax ARM Core...
            </span>
          </div>
        </div>
      ) : (
        <main className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
          {/* PANE 1: Farm Telemetry & Chaos Injector (Left 3 cols / 25%) */}
          <section className="col-span-3 flex flex-col h-full overflow-hidden glass-card p-3">
            <TelemetryPane
              farms={farms}
              resources={resources}
              godMode={godMode}
              onRefresh={refreshState}
            />
          </section>

          {/* PANE 2: Cross-Farm Command Center (Center 6 cols / 50%) */}
          <section className="col-span-6 flex flex-col gap-3 h-full overflow-hidden">
            {/* 2D Tactical Vector Map */}
            <div className="flex-1 glass-card p-2 flex flex-col overflow-hidden min-h-[300px]">
              <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/5">
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400">
                  🗺️ 2D Tactical Multi-Farm Schematic
                </span>
                <span className="text-[9px] font-mono text-emerald-400/80">
                  SECTORS CONNECTED: 2
                </span>
              </div>
              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                <TacticalMap
                  farms={farms}
                  resources={resources}
                  activeTickets={tickets}
                />
              </div>
            </div>

            {/* HITL Incident Diff Queue */}
            <div className="h-64 glass-card p-3 flex flex-col overflow-hidden">
              <TicketQueue
                tickets={tickets}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </div>
          </section>

          {/* PANE 3: Edge Worker Phone Viewport & Live Terminal (Right 3 cols / 25%) */}
          <section className="col-span-3 flex flex-col gap-3 h-full overflow-hidden">
            {/* Field Worker Phone Viewport */}
            <div className="flex-1 glass-card p-3 flex flex-col overflow-hidden min-h-[280px]">
              <WorkerPhone resources={resources} tasks={tasks} />
            </div>

            {/* Live Terminal Telemetry Log */}
            <div className="h-56 glass-card p-3 flex flex-col overflow-hidden">
              <LiveTerminal
                logs={logs}
                onNewLogs={(newLogs) => setLogs(newLogs)}
              />
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

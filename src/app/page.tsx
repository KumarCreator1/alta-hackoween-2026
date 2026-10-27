'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { Farm, Resource, Task, IncidentTicket, EventLog } from '@/db/schema';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import TacticalMap from '@/components/TacticalMap';
import TicketQueue from '@/components/TicketQueue';
import CrisisCard from '@/components/CrisisCard';
import TeamCollaboration from '@/components/TeamCollaboration';
import FleetGauge from '@/components/FleetGauge';
import EdgeTrackerCard from '@/components/EdgeTrackerCard';
import AddTaskModal from '@/components/AddTaskModal';

// Dedicated Full-Page Views
import TasksView from '@/components/views/TasksView';
import SectorsView from '@/components/views/SectorsView';
import TacticalMapView from '@/components/views/TacticalMapView';
import FleetView from '@/components/views/FleetView';
import CrewView from '@/components/views/CrewView';
import ChaosView from '@/components/views/ChaosView';
import IncidentsView from '@/components/views/IncidentsView';
import TerminalView from '@/components/views/TerminalView';
import WorkerView from '@/components/views/WorkerView';

export default function ARMCommandCenter() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<IncidentTicket[]>([]);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [godMode, setGodMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
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
    // Fast polling telemetry every 3.5s
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

  // Handle Crisis Event Ingestion
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
      console.error('Crisis trigger error:', err);
    }
  };

  // Handle Adding Task
  const handleAddTask = async (data: {
    title: string;
    farmId: number;
    assignedResourceId?: number | null;
    priority: number;
    scheduledSlot: string;
    category: string;
  }) => {
    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(updated.tasks || []);
        setLogs(updated.logs || []);
      }
    } catch (err) {
      console.error('Create task error:', err);
    }
  };

  // Handle Updating Task Status
  const handleUpdateTaskStatus = async (
    taskId: number,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED' | 'PAUSED_BY_AI' | 'CANCELLED',
    metadata?: Record<string, unknown>
  ) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(metadata || {}) }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(updated.tasks || []);
        setLogs(updated.logs || []);
      }
    } catch (err) {
      console.error('Update task error:', err);
    }
  };

  // Handle Adding Resource
  const handleAddResource = async (data: {
    name: string;
    type: string;
    currentFarmId: number;
    fuelOrBattery: number;
    model: string;
  }) => {
    try {
      const res = await fetch('/api/resources/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setResources(updated.resources || []);
        setLogs(updated.logs || []);
      }
    } catch (err) {
      console.error('Create resource error:', err);
    }
  };

  // Handle Updating Resource
  const handleUpdateResource = async (
    resourceId: number,
    data: {
      status?: 'IDLE' | 'BUSY' | 'MAINTENANCE' | 'EN_ROUTE';
      currentFarmId?: number;
      fuelOrBattery?: number;
      implementStatus?: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/resources/${resourceId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setResources(updated.resources || []);
        setLogs(updated.logs || []);
      }
    } catch (err) {
      console.error('Update resource error:', err);
    }
  };

  // Handle Deleting Resource
  const handleDeleteResource = async (resourceId: number) => {
    try {
      const res = await fetch(`/api/resources/${resourceId}/delete`, { method: 'POST' });
      if (res.ok) {
        await refreshState();
      }
    } catch (err) {
      console.error('Delete resource error:', err);
    }
  };

  // Handle Deleting Task
  const handleDeleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/delete`, { method: 'POST' });
      if (res.ok) {
        await refreshState();
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  // Handle Updating Task Full Details
  const handleUpdateTaskDetails = async (
    taskId: number,
    data: Record<string, unknown>
  ) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await refreshState();
      }
    } catch (err) {
      console.error('Update task details error:', err);
    }
  };

  // Handle Updating Farm Conditions
  const handleUpdateFarm = async (
    farmId: number,
    data: { soilMoisture?: number; weatherStatus?: string }
  ) => {
    try {
      const res = await fetch(`/api/farms/${farmId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setFarms(updated.farms || []);
        setLogs(updated.logs || []);
      }
    } catch (err) {
      console.error('Update farm error:', err);
    }
  };

  // Global search filtering
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.scheduledSlot.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!searchQuery) return resources;
    const q = searchQuery.toLowerCase();
    return resources.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [resources, searchQuery]);

  return (
    <div className="flex min-h-screen bg-[#F4F5F7] select-none">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'chaos') setGodMode(true);
        }}
        godMode={godMode}
        onToggleGodMode={() => setGodMode(!godMode)}
        incidentCount={tickets.filter((t) => t.status !== 'RESOLVED').length}
        taskCount={tasks.length}
        farmCount={farms.length}
        fleetCount={resources.length}
      />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <TopBar
          godMode={godMode}
          onToggleGodMode={() => setGodMode(!godMode)}
          onReset={handleReset}
          onTriggerCrisis={() =>
            handleTriggerCrisis('WEATHER_WEBHOOK', 1, { condition: 'HEAVY_RAIN_WARNING' })
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddTask={() => setIsAddTaskOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="p-8 space-y-6 max-w-[1440px] w-full mx-auto">
          {/* TAB: DASHBOARD (The Main Command Center) */}
          {activeTab === 'dashboard' && (
            <>
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
                    onClick={() => setIsAddTaskOpen(true)}
                    className="btn-primary px-4 py-2 text-xs flex items-center gap-2 shadow-sm"
                  >
                    <span>+</span>
                    <span>Add Task</span>
                  </button>
                  <button
                    onClick={() =>
                      handleTriggerCrisis('WEATHER_WEBHOOK', 1, { condition: 'HEAVY_RAIN_WARNING' })
                    }
                    className="btn-outline px-4 py-2 text-xs flex items-center gap-2 bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
                  >
                    <span>⚡</span>
                    <span>Trigger Crisis</span>
                  </button>
                </div>
              </div>

              {/* 4 Donezo Stat Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Hero Accent Green Card */}
                <div
                  onClick={() => setActiveTab('sectors')}
                  className="bg-[#134E35] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-emerald-200">Active Sectors</span>
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white group-hover:scale-110 transition-transform">
                      ↗
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl font-bold tracking-tight">{farms.length} Sectors</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 truncate max-w-[200px]">
                        {farms.map((f) => f.code || f.name.split(' - ')[0]).join(' • ')}
                      </span>
                      <span className="text-[11px] text-emerald-200/80">Online</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Connected Assets */}
                <div
                  onClick={() => setActiveTab('fleet')}
                  className="donezo-card p-5 flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-gray-500">Connected Fleet</span>
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 group-hover:scale-110 transition-transform">
                      ↗
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">
                      {resources.length} Units
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Tractors & Drones
                      </span>
                      <span className="text-[11px] text-gray-500">Telematics Active</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Scheduled Operations */}
                <div
                  onClick={() => setActiveTab('tasks')}
                  className="donezo-card p-5 flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-gray-500">Work Orders</span>
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 group-hover:scale-110 transition-transform">
                      ↗
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">
                      {tasks.length}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        Multi-Sector
                      </span>
                      <span className="text-[11px] text-gray-500">ACID Stored</span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Active Incidents */}
                <div
                  onClick={() => setActiveTab('incidents')}
                  className="donezo-card p-5 flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-gray-500">Active Incidents</span>
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
                      <span className="text-[11px] text-gray-500">Gemini Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Tactical Center Grid (8 Cols Left + 4 Cols Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  {/* Tactical Vector Map Card */}
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
                      <button
                        onClick={() => setActiveTab('map')}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        Full Map View ↗
                      </button>
                    </div>

                    <TacticalMap
                      farms={farms}
                      resources={resources}
                      activeTickets={tickets}
                    />
                  </div>

                  {/* HITL Incident Diff Queue */}
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

                {/* Right: Crisis Operations Dock & Disease AI */}
                <div className="lg:col-span-4">
                  <div className="donezo-card p-6 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900">
                          Crisis Operations & AI
                        </h3>
                        <button
                          onClick={() => setActiveTab('chaos')}
                          className="text-[10px] font-bold text-amber-700 hover:underline"
                        >
                          Open Lab ↗
                        </button>
                      </div>

                      <CrisisCard
                        farms={farms}
                        tasks={filteredTasks}
                        onTriggerCrisis={handleTriggerCrisis}
                        onRefresh={refreshState}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Bottom Operations Grid (Col 5 + Col 3 + Col 4) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Team & Asset Collaboration */}
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
                    <button
                      onClick={() => setActiveTab('crew')}
                      className="text-xs text-emerald-700 hover:underline font-semibold"
                    >
                      View Crew ↗
                    </button>
                  </div>
                  <TeamCollaboration resources={filteredResources} tasks={tasks} />
                </div>

                {/* Fleet Readiness Gauge */}
                <div className="lg:col-span-3 donezo-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      Fleet Readiness
                    </h3>
                    <span className="text-xs text-emerald-600 font-bold">Optimal</span>
                  </div>
                  <FleetGauge resources={resources} farms={farms} />
                </div>

                {/* Edge Worker Phone & Live Telemetry Feed */}
                <div className="lg:col-span-4">
                  <EdgeTrackerCard
                    resources={resources}
                    tasks={tasks}
                    logs={logs}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB: WORK ORDERS & TASKS */}
          {activeTab === 'tasks' && (
            <TasksView
              tasks={filteredTasks}
              farms={farms}
              resources={resources}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              onUpdateTask={handleUpdateTaskDetails}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {/* TAB: SECTORS */}
          {activeTab === 'sectors' && (
            <SectorsView
              farms={farms}
              resources={resources}
              tasks={filteredTasks}
              onUpdateFarm={handleUpdateFarm}
              onTriggerCrisis={handleTriggerCrisis}
              onRefresh={refreshState}
            />
          )}

          {/* TAB: TACTICAL MAP */}
          {activeTab === 'map' && (
            <TacticalMapView
              farms={farms}
              resources={filteredResources}
              activeTickets={tickets}
              onTriggerCrisis={handleTriggerCrisis}
            />
          )}

          {/* TAB: FLEET */}
          {activeTab === 'fleet' && (
            <FleetView
              resources={filteredResources}
              farms={farms}
              tasks={tasks}
              onUpdateResource={handleUpdateResource}
              onAddResource={handleAddResource}
              onDeleteResource={handleDeleteResource}
            />
          )}

          {/* TAB: CREW */}
          {activeTab === 'crew' && (
            <CrewView
              resources={resources}
              tasks={filteredTasks}
              farms={farms}
              onUpdateResource={handleUpdateResource}
              onAddResource={handleAddResource}
              onDeleteResource={handleDeleteResource}
            />
          )}

          {/* TAB: CHAOS LAB */}
          {activeTab === 'chaos' && (
            <ChaosView
              farms={farms}
              resources={resources}
              activeTickets={tickets}
              onTriggerCrisis={handleTriggerCrisis}
              onApproveTicket={handleApprove}
              onRejectTicket={handleReject}
            />
          )}

          {/* TAB: INCIDENT DIFF QUEUE */}
          {activeTab === 'incidents' && (
            <IncidentsView
              tickets={tickets}
              onApproveTicket={handleApprove}
              onRejectTicket={handleReject}
              onTriggerCrisis={handleTriggerCrisis}
            />
          )}

          {/* TAB: TERMINAL LOGS */}
          {activeTab === 'terminal' && <TerminalView logs={logs} />}

          {/* TAB: WORKER MOBILE VIEW */}
          {activeTab === 'worker' && (
            <WorkerView
              resources={resources}
              tasks={filteredTasks}
              farms={farms}
              onUpdateTaskStatus={handleUpdateTaskStatus}
            />
          )}
        </main>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        farms={farms}
        resources={resources}
        onAddTask={handleAddTask}
      />
    </div>
  );
}

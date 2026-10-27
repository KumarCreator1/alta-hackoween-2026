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
import SimpleDashboard from '@/components/SimpleDashboard';

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
      if (!res.ok) {
        console.warn('Temporary state fetch blip (HTTP ' + res.status + ') - will retry on next poll');
        return;
      }
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
            <SimpleDashboard
              farms={farms}
              resources={resources}
              tasks={tasks}
              tickets={tickets}
              onUpdateTask={handleUpdateTaskDetails}
              onTriggerCrisis={handleTriggerCrisis}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              onRefresh={refreshState}
            />
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
              farms={farms}
              resources={resources}
              onApproveTicket={handleApprove}
              onRejectTicket={handleReject}
              onTriggerCrisis={handleTriggerCrisis}
            />
          )}

          {/* TAB: TERMINAL LOGS */}
          {activeTab === 'terminal' && <TerminalView logs={logs} onRefresh={refreshState} />}

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

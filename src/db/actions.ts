'use server';

import { eq, desc, ne } from 'drizzle-orm';
import { db } from './index';
import {
  farms,
  resources,
  tasks,
  incidentTickets,
  eventLogs,
  type Farm,
  type Resource,
  type Task,
  type IncidentTicket,
  type EventLog,
  type ProposedMutation,
} from './schema';
import { seedDatabase } from './seed';

// ── Types ──────────────────────────────────────────────────────────────────────

export type FullState = {
  farms: Farm[];
  resources: Resource[];
  tasks: Task[];
  tickets: IncidentTicket[];
  logs: EventLog[];
};

// ── Query Functions ────────────────────────────────────────────────────────────

export async function getAllFarms(): Promise<Farm[]> {
  return db.select().from(farms);
}

export async function getAllResources(): Promise<Resource[]> {
  return db.select().from(resources);
}

export async function getAllTasks(): Promise<Task[]> {
  return db.select().from(tasks).orderBy(tasks.priority);
}

export async function getActiveTickets(): Promise<IncidentTicket[]> {
  return db
    .select()
    .from(incidentTickets)
    .where(ne(incidentTickets.status, 'RESOLVED'))
    .orderBy(desc(incidentTickets.createdAt));
}

export async function getEventLogs(limit: number = 50): Promise<EventLog[]> {
  return db
    .select()
    .from(eventLogs)
    .orderBy(desc(eventLogs.timestamp))
    .limit(limit);
}

// ── Composite Query ────────────────────────────────────────────────────────────

export async function getFullState(): Promise<FullState> {
  const [allFarms, allResources, allTasks, activeTickets, logs] = await Promise.all([
    getAllFarms(),
    getAllResources(),
    getAllTasks(),
    getActiveTickets(),
    getEventLogs(),
  ]);

  return {
    farms: allFarms,
    resources: allResources,
    tasks: allTasks,
    tickets: activeTickets,
    logs,
  };
}

// ── Mutation Functions ─────────────────────────────────────────────────────────

export async function createTicket(data: {
  farmId: number;
  triggerEvent: string;
  severity: string;
  summary: string;
  proposedMutations: ProposedMutation[];
}): Promise<IncidentTicket> {
  const [ticket] = await db
    .insert(incidentTickets)
    .values({
      triggerType: data.triggerEvent,
      severity: data.severity,
      affectedFarmId: data.farmId,
      executiveSummary: data.summary,
      proposedMutations: data.proposedMutations,
      status: 'AWAITING_APPROVAL',
    })
    .returning();
  return ticket;
}

export async function addEventLog(
  level: string,
  emoji: string,
  message: string,
  relatedTicketId?: number | null,
): Promise<EventLog> {
  const [log] = await db
    .insert(eventLogs)
    .values({
      level,
      emoji,
      message,
      relatedTicketId: relatedTicketId ?? null,
    })
    .returning();
  return log;
}

export async function createTask(data: {
  title: string;
  farmId: number;
  assignedResourceId?: number | null;
  priority?: number;
  scheduledSlot: string;
  category?: string;
  aiReasoning?: string;
}): Promise<FullState> {
  const [newTask] = await db
    .insert(tasks)
    .values({
      title: data.title,
      farmId: data.farmId,
      assignedResourceId: data.assignedResourceId ?? null,
      priority: data.priority ?? 3,
      scheduledSlot: data.scheduledSlot,
      category: data.category ?? 'FIELD_OPS',
      aiReasoning: data.aiReasoning ?? null,
      status: 'SCHEDULED',
      progressPercent: 0,
    })
    .returning();

  await addEventLog(
    'INFO',
    '📋',
    `Task created: "${newTask.title}" for Sector #${data.farmId} [Slot: ${data.scheduledSlot}]`
  );

  return getFullState();
}

export async function updateTaskStatus(
  taskId: number,
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED_BY_AI' | 'COMPLETED' | 'CANCELLED',
  progressPercent?: number
): Promise<FullState> {
  const updateData: Record<string, unknown> = { status };
  if (progressPercent !== undefined) {
    updateData.progressPercent = progressPercent;
  }

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, taskId))
    .returning();

  await addEventLog(
    'DISPATCH',
    status === 'COMPLETED' ? '✅' : status === 'IN_PROGRESS' ? '🚜' : '⏸️',
    `Task #${taskId} "${updated?.title || ''}" updated to ${status} (${progressPercent ?? updated?.progressPercent ?? 0}%)`
  );

  return getFullState();
}

export async function createResource(data: {
  name: string;
  type: string;
  currentFarmId: number;
  fuelOrBattery?: number;
  model?: string;
}): Promise<FullState> {
  const [newRes] = await db
    .insert(resources)
    .values({
      name: data.name,
      type: data.type,
      currentFarmId: data.currentFarmId,
      fuelOrBattery: data.fuelOrBattery ?? 100,
      model: data.model ?? 'Standard Implement',
      status: 'IDLE',
      speedKmh: 0,
      implementStatus: 'Standby',
      engineHours: 0,
    })
    .returning();

  await addEventLog(
    'INFO',
    '🚜',
    `Resource added: "${newRes.name}" (${newRes.type}) assigned to Sector #${data.currentFarmId}`
  );

  return getFullState();
}

export async function updateResource(
  resourceId: number,
  data: {
    status?: 'IDLE' | 'BUSY' | 'MAINTENANCE' | 'EN_ROUTE';
    currentFarmId?: number;
    fuelOrBattery?: number;
    speedKmh?: number;
    implementStatus?: string;
  }
): Promise<FullState> {
  const [updated] = await db
    .update(resources)
    .set(data)
    .where(eq(resources.id, resourceId))
    .returning();

  await addEventLog(
    'DISPATCH',
    data.status === 'EN_ROUTE' ? '🔀' : '🔧',
    `Asset #${resourceId} "${updated?.name}" updated: Status=${updated?.status}, Farm=#${updated?.currentFarmId}`
  );

  return getFullState();
}

export async function updateFarmConditions(
  farmId: number,
  data: {
    soilMoisture?: number;
    weatherStatus?: string;
    tempCelsius?: number;
    windSpeedKmh?: number;
  }
): Promise<FullState> {
  const [updated] = await db
    .update(farms)
    .set(data)
    .where(eq(farms.id, farmId))
    .returning();

  await addEventLog(
    'INFO',
    '📡',
    `Sector #${farmId} telemetry adjusted: Moisture=${updated?.soilMoisture}%, Weather="${updated?.weatherStatus}"`
  );

  return getFullState();
}

export async function resetDemoState(): Promise<FullState> {
  await seedDatabase();
  return getFullState();
}

// ── Approve Ticket (the crucial mutation) ──────────────────────────────────────

export async function approveTicket(ticketId: number): Promise<FullState> {
  // 1. Fetch the ticket
  const [ticket] = await db
    .select()
    .from(incidentTickets)
    .where(eq(incidentTickets.id, ticketId));

  if (!ticket) {
    throw new Error(`Ticket #${ticketId} not found`);
  }

  // 2. Update ticket status to DISPATCHED
  await db
    .update(incidentTickets)
    .set({ status: 'DISPATCHED' })
    .where(eq(incidentTickets.id, ticketId));

  await addEventLog(
    'DISPATCH',
    '✅',
    `Ticket #${ticketId} approved by operator. Executing ${ticket.proposedMutations.length} mutation(s)...`,
    ticketId,
  );

  // 3. Execute each proposed mutation
  const mutations = ticket.proposedMutations as ProposedMutation[];

  for (const mutation of mutations) {
    switch (mutation.action) {
      case 'PAUSE_TASK': {
        if (mutation.targetId == null) break;
        await db
          .update(tasks)
          .set({ status: 'PAUSED_BY_AI' })
          .where(eq(tasks.id, mutation.targetId));

        await addEventLog(
          'AI',
          '⏸️',
          `Task #${mutation.targetId} paused by AI. Reason: ${mutation.reason}`,
          ticketId,
        );
        break;
      }

      case 'CREATE_TASK': {
        if (!mutation.newTaskTitle || mutation.toFarmId == null) break;
        const [newTask] = await db
          .insert(tasks)
          .values({
            title: mutation.newTaskTitle,
            farmId: mutation.toFarmId,
            assignedResourceId: mutation.resourceId ?? null,
            status: 'SCHEDULED',
            priority: 1,
            scheduledSlot: 'URGENT',
            aiReasoning: mutation.reason,
          })
          .returning();

        await addEventLog(
          'AI',
          '📋',
          `New emergency task created: "${newTask.title}" at Farm #${mutation.toFarmId}. Reason: ${mutation.reason}`,
          ticketId,
        );
        break;
      }

      case 'REASSIGN_RESOURCE': {
        if (mutation.resourceId == null || mutation.toFarmId == null) break;

        // Update resource's farm and set status to EN_ROUTE
        await db
          .update(resources)
          .set({
            currentFarmId: mutation.toFarmId,
            status: 'EN_ROUTE',
          })
          .where(eq(resources.id, mutation.resourceId));

        // If there's an associated task, update its assignedResourceId
        if (mutation.targetId != null) {
          await db
            .update(tasks)
            .set({ assignedResourceId: mutation.resourceId })
            .where(eq(tasks.id, mutation.targetId));
        }

        // Fetch resource name for log
        const [resource] = await db
          .select()
          .from(resources)
          .where(eq(resources.id, mutation.resourceId));

        await addEventLog(
          'DISPATCH',
          '🔀',
          `Resource "${resource?.name ?? `#${mutation.resourceId}`}" reassigned to Farm #${mutation.toFarmId} (EN_ROUTE). Reason: ${mutation.reason}`,
          ticketId,
        );
        break;
      }
    }
  }

  await addEventLog(
    'INFO',
    '🏁',
    `All mutations for Ticket #${ticketId} executed successfully.`,
    ticketId,
  );

  // 5. Return updated full state
  return getFullState();
}

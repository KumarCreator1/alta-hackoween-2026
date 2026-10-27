import { pgTable, serial, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────────────────────
export const resourceStatusEnum = pgEnum('resource_status', ['IDLE', 'BUSY', 'MAINTENANCE', 'EN_ROUTE']);
export const taskStatusEnum = pgEnum('task_status', ['SCHEDULED', 'IN_PROGRESS', 'PAUSED_BY_AI', 'COMPLETED', 'CANCELLED']);
export const ticketStatusEnum = pgEnum('ticket_status', ['AI_TRIAGE', 'AWAITING_APPROVAL', 'DISPATCHED', 'RESOLVED']);

// ── Farms ──────────────────────────────────────────────────────────────────────
export const farms = pgTable('farms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  soilMoisture: integer('soil_moisture').notNull(),
  weatherStatus: text('weather_status').notNull(),
  coordinates: jsonb('coordinates').$type<{ x: number; y: number }>().notNull(),
});

// ── Resources (tractors, drones, workers) ──────────────────────────────────────
export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: resourceStatusEnum('status').default('IDLE').notNull(),
  currentFarmId: integer('current_farm_id').references(() => farms.id).notNull(),
  fuelOrBattery: integer('fuel_or_battery').default(100).notNull(),
});

// ── Tasks ──────────────────────────────────────────────────────────────────────
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  farmId: integer('farm_id').references(() => farms.id).notNull(),
  assignedResourceId: integer('assigned_resource_id').references(() => resources.id),
  status: taskStatusEnum('status').default('SCHEDULED').notNull(),
  priority: integer('priority').default(3).notNull(),
  scheduledSlot: text('scheduled_slot').notNull(),
  aiReasoning: text('ai_reasoning'),
});

// ── Incident Tickets ───────────────────────────────────────────────────────────
export type ProposedMutation = {
  action: 'PAUSE_TASK' | 'CREATE_TASK' | 'REASSIGN_RESOURCE';
  targetId?: number;
  resourceId?: number;
  fromFarmId?: number;
  toFarmId?: number;
  newTaskTitle?: string;
  reason: string;
};

export const incidentTickets = pgTable('incident_tickets', {
  id: serial('id').primaryKey(),
  triggerType: text('trigger_type').notNull(),
  severity: text('severity').notNull(),
  affectedFarmId: integer('affected_farm_id').references(() => farms.id).notNull(),
  executiveSummary: text('executive_summary').notNull(),
  proposedMutations: jsonb('proposed_mutations').$type<ProposedMutation[]>().notNull(),
  status: ticketStatusEnum('status').default('AWAITING_APPROVAL').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Event Logs (telemetry terminal) ────────────────────────────────────────────
export const eventLogs = pgTable('event_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  level: text('level').notNull(), // 'INFO' | 'WARN' | 'CRITICAL' | 'AI' | 'DISPATCH'
  emoji: text('emoji').notNull(),
  message: text('message').notNull(),
  relatedTicketId: integer('related_ticket_id').references(() => incidentTickets.id),
});

// ── Inferred types ─────────────────────────────────────────────────────────────
export type Farm = typeof farms.$inferSelect;
export type NewFarm = typeof farms.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type IncidentTicket = typeof incidentTickets.$inferSelect;
export type NewIncidentTicket = typeof incidentTickets.$inferInsert;
export type EventLog = typeof eventLogs.$inferSelect;
export type NewEventLog = typeof eventLogs.$inferInsert;

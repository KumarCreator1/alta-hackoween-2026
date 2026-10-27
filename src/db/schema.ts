import { pgTable, serial, text, timestamp, integer, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────────────────────
export const resourceStatusEnum = pgEnum('resource_status', ['IDLE', 'BUSY', 'MAINTENANCE', 'EN_ROUTE']);
export const taskStatusEnum = pgEnum('task_status', ['SCHEDULED', 'IN_PROGRESS', 'PAUSED_BY_AI', 'COMPLETED', 'CANCELLED']);
export const ticketStatusEnum = pgEnum('ticket_status', ['AI_TRIAGE', 'AWAITING_APPROVAL', 'DISPATCHED', 'RESOLVED']);

// ── Centralized Multi-Farm Table ───────────────────────────────────────────────
export const farms = pgTable('farms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').default('SEC-01').notNull(),
  region: text('region').default('Central Valley, CA').notNull(),
  soilMoisture: integer('soil_moisture').notNull(),
  targetMoistureMin: integer('target_moisture_min').default(40).notNull(),
  targetMoistureMax: integer('target_moisture_max').default(65).notNull(),
  soilType: text('soil_type').default('Clay Loam').notNull(),
  soilPh: text('soil_ph').default('6.8').notNull(),
  weatherStatus: text('weather_status').notNull(),
  coordinates: jsonb('coordinates').$type<{ x: number; y: number }>().notNull(),
  acreage: integer('acreage').default(500).notNull(),
  cropType: text('crop_type').default('Wheat & Soybeans').notNull(),
  tempCelsius: integer('temp_celsius').default(28).notNull(),
  windSpeedKmh: integer('wind_speed_kmh').default(14).notNull(),
  irrigationType: text('irrigation_type').default('CENTER_PIVOT').notNull(),
  healthScore: integer('health_score').default(95).notNull(),
});

// ── Machinery Fleet & Workforce (Tractors, Drones, Sprayers, Workers) ─────────
export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'TRACTOR' | 'HARVESTER' | 'DRONE' | 'WORKER'
  status: resourceStatusEnum('status').default('IDLE').notNull(),
  currentFarmId: integer('current_farm_id').references(() => farms.id, { onDelete: 'cascade' }).notNull(),
  fuelOrBattery: integer('fuel_or_battery').default(100).notNull(),
  model: text('model').default('Standard Implement').notNull(),
  serialNumber: text('serial_number').default('SN-2026-001').notNull(),
  speedKmh: integer('speed_kmh').default(0).notNull(),
  implementStatus: text('implement_status').default('Standby').notNull(),
  engineHours: integer('engine_hours').default(450).notNull(),
  maxPayloadKg: integer('max_payload_kg').default(1200).notNull(),
});

// ── Work Orders & Task Missions ────────────────────────────────────────────────
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  farmId: integer('farm_id').references(() => farms.id, { onDelete: 'cascade' }).notNull(),
  assignedResourceId: integer('assigned_resource_id').references(() => resources.id, { onDelete: 'set null' }),
  status: taskStatusEnum('status').default('SCHEDULED').notNull(),
  priority: integer('priority').default(3).notNull(),
  scheduledSlot: text('scheduled_slot').notNull(),
  aiReasoning: text('ai_reasoning'),
  category: text('category').default('FIELD_OPS').notNull(),
  progressPercent: integer('progress_percent').default(0).notNull(),
  fieldSection: text('field_section').default('Section A').notNull(),
  targetHectares: integer('target_hectares').default(25).notNull(),
  workerCompletedAt: text('worker_completed_at'),
  verifiedByOwner: boolean('verified_by_owner').default(false).notNull(),
  verificationNotes: text('verification_notes'),
});

// ── Incident Tickets & HITL Decision Queue (CRM Layer) ─────────────────────────
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
  affectedFarmId: integer('affected_farm_id').references(() => farms.id, { onDelete: 'cascade' }).notNull(),
  executiveSummary: text('executive_summary').notNull(),
  proposedMutations: jsonb('proposed_mutations').$type<ProposedMutation[]>().notNull(),
  status: ticketStatusEnum('status').default('AWAITING_APPROVAL').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Telemetry Event Logs (NASA/SpaceX Feed) ───────────────────────────────────
export const eventLogs = pgTable('event_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  level: text('level').notNull(), // 'INFO' | 'WARN' | 'CRITICAL' | 'AI' | 'DISPATCH'
  emoji: text('emoji').notNull(),
  message: text('message').notNull(),
  farmId: integer('farm_id'),
  relatedTicketId: integer('related_ticket_id').references(() => incidentTickets.id, { onDelete: 'set null' }),
});

// ── Inferred Types ─────────────────────────────────────────────────────────────
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

export type Ticket = IncidentTicket;

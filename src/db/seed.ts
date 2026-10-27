import { db } from './index';
import { farms, resources, tasks, incidentTickets, eventLogs } from './schema';
import type { NewFarm, NewResource, NewTask, NewEventLog } from './schema';

// ── Seed Data ──────────────────────────────────────────────────────────────────

const seedFarms: NewFarm[] = [
  {
    name: 'Sector Alpha - North Valley',
    soilMoisture: 42,
    weatherStatus: 'Partly Cloudy, 28°C',
    coordinates: { x: 150, y: 200 },
  },
  {
    name: 'Sector Beta - High Plains',
    soilMoisture: 67,
    weatherStatus: 'Clear Skies, 32°C',
    coordinates: { x: 650, y: 200 },
  },
];

const seedResources: Omit<NewResource, 'currentFarmId'>[] = [
  // Farm 1 resources
  { name: 'John Deere 8R - Unit 01', type: 'TRACTOR', status: 'BUSY', fuelOrBattery: 72 },
  { name: 'Kubota Sprayer Rig 02', type: 'HARVESTER', status: 'IDLE', fuelOrBattery: 95 },
  { name: 'Rohan (Lead Agronomist)', type: 'WORKER', status: 'BUSY', fuelOrBattery: 100 },
  // Farm 2 resources
  { name: 'John Deere 8R - Unit 04', type: 'TRACTOR', status: 'IDLE', fuelOrBattery: 88 },
  { name: 'DJI Agras T30 - Drone 01', type: 'DRONE', status: 'BUSY', fuelOrBattery: 54 },
  { name: 'Priya (Field Technician)', type: 'WORKER', status: 'IDLE', fuelOrBattery: 100 },
];

const seedTasks: Omit<NewTask, 'farmId' | 'assignedResourceId'>[] = [
  // Farm 1 tasks
  { title: 'Till North Field - Section A3', status: 'IN_PROGRESS', priority: 1, scheduledSlot: '06:00 - 08:00', aiReasoning: 'Soil moisture optimal for tilling at dawn' },
  { title: 'Spray Herbicide - Perimeter Zone', status: 'SCHEDULED', priority: 2, scheduledSlot: '08:30 - 10:00', aiReasoning: 'Wind speed below threshold until 10:00' },
  { title: 'Soil Sampling - Grid B2-B4', status: 'SCHEDULED', priority: 3, scheduledSlot: '10:30 - 12:00', aiReasoning: null },
  { title: 'Irrigate Sector A - East Pivot', status: 'SCHEDULED', priority: 2, scheduledSlot: '13:00 - 15:00', aiReasoning: 'Soil moisture dropping below 40% threshold' },
  { title: 'Fence Repair - South Boundary', status: 'SCHEDULED', priority: 4, scheduledSlot: '15:00 - 17:00', aiReasoning: null },
  { title: 'Equipment Maintenance - Unit 01', status: 'SCHEDULED', priority: 5, scheduledSlot: '17:30 - 18:30', aiReasoning: 'Routine 200-hr service interval reached' },

  // Farm 2 tasks
  { title: 'Aerial Survey - Crop Health Scan', status: 'IN_PROGRESS', priority: 1, scheduledSlot: '06:30 - 08:30', aiReasoning: 'NDVI analysis scheduled for morning light' },
  { title: 'Precision Fertilize - Zone C1', status: 'SCHEDULED', priority: 2, scheduledSlot: '09:00 - 11:00', aiReasoning: 'Nitrogen deficiency detected in Zone C1' },
  { title: 'Harvest Wheat - Section D2', status: 'SCHEDULED', priority: 1, scheduledSlot: '11:30 - 14:00', aiReasoning: 'Grain moisture at 13.5%, optimal for harvest' },
  { title: 'Water Quality Test - Reservoir B', status: 'SCHEDULED', priority: 3, scheduledSlot: '14:30 - 15:30', aiReasoning: null },
  { title: 'Replant Cover Crop - Strip E1', status: 'SCHEDULED', priority: 4, scheduledSlot: '16:00 - 17:30', aiReasoning: 'Post-harvest cover to prevent erosion' },
  { title: 'Drone Battery Swap & Calibration', status: 'SCHEDULED', priority: 3, scheduledSlot: '17:30 - 18:00', aiReasoning: 'Battery below 30% after survey completion' },
];

const seedEventLogs: NewEventLog[] = [
  { level: 'INFO', emoji: '🟢', message: 'ARM Command Center v1.0 — System Online', relatedTicketId: null },
  { level: 'INFO', emoji: '📡', message: 'Telemetry uplink established. All sensors nominal.', relatedTicketId: null },
  { level: 'INFO', emoji: '🌾', message: 'Farm "Sector Alpha - North Valley" connected. 3 resources online.', relatedTicketId: null },
  { level: 'INFO', emoji: '🌾', message: 'Farm "Sector Beta - High Plains" connected. 3 resources online.', relatedTicketId: null },
  { level: 'DISPATCH', emoji: '🚜', message: 'Task "Till North Field - Section A3" dispatched to John Deere 8R - Unit 01.', relatedTicketId: null },
  { level: 'DISPATCH', emoji: '🛸', message: 'Task "Aerial Survey - Crop Health Scan" dispatched to DJI Agras T30 - Drone 01.', relatedTicketId: null },
  { level: 'AI', emoji: '🤖', message: 'Gemini AI module initialized. Monitoring environmental triggers.', relatedTicketId: null },
  { level: 'INFO', emoji: '⏱️', message: 'Daily schedule loaded: 12 tasks across 2 sectors.', relatedTicketId: null },
];

// ── Seed Function ──────────────────────────────────────────────────────────────

export async function seedDatabase(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Clear tables in reverse FK order
  await db.delete(eventLogs);
  await db.delete(incidentTickets);
  await db.delete(tasks);
  await db.delete(resources);
  await db.delete(farms);

  console.log('  ✓ Cleared existing data');

  // Insert farms
  const insertedFarms = await db.insert(farms).values(seedFarms).returning();
  const farm1Id = insertedFarms[0].id;
  const farm2Id = insertedFarms[1].id;
  console.log(`  ✓ Seeded ${insertedFarms.length} farms`);

  // Insert resources with farm assignments
  const resourcesWithFarms: NewResource[] = seedResources.map((r, i) => ({
    ...r,
    currentFarmId: i < 3 ? farm1Id : farm2Id,
  }));
  const insertedResources = await db.insert(resources).values(resourcesWithFarms).returning();
  console.log(`  ✓ Seeded ${insertedResources.length} resources`);

  // Insert tasks with farm and resource assignments
  const tasksWithAssignments: NewTask[] = seedTasks.map((t, i) => {
    const isFarm1 = i < 6;
    const farmId = isFarm1 ? farm1Id : farm2Id;

    // Assign resources to in-progress tasks
    let assignedResourceId: number | null = null;
    if (i === 0) assignedResourceId = insertedResources[0].id; // Tractor on tilling
    if (i === 6) assignedResourceId = insertedResources[4].id; // Drone on survey

    return { ...t, farmId, assignedResourceId };
  });
  const insertedTasks = await db.insert(tasks).values(tasksWithAssignments).returning();
  console.log(`  ✓ Seeded ${insertedTasks.length} tasks`);

  // Insert event logs
  const insertedLogs = await db.insert(eventLogs).values(seedEventLogs).returning();
  console.log(`  ✓ Seeded ${insertedLogs.length} event log entries`);

  console.log('🌱 Seed complete!');
}

// ── Standalone execution ───────────────────────────────────────────────────────
if (typeof require !== 'undefined' && require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Database seeded successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}

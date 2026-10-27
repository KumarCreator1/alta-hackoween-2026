import { db } from './index';
import { farms, resources, tasks, incidentTickets, eventLogs } from './schema';
import type { NewFarm, NewResource, NewTask, NewEventLog } from './schema';

// ── Multi-Farm Plain-Language Seed Data ───────────────────────────────────────

const seedFarms: NewFarm[] = [
  {
    name: 'North Valley Farm',
    code: 'North Farm',
    region: 'Sacramento, CA',
    soilMoisture: 42,
    targetMoistureMin: 40,
    targetMoistureMax: 65,
    soilType: 'Rich Loam',
    soilPh: '6.7',
    weatherStatus: 'Partly Cloudy, 28°C',
    coordinates: { x: 120, y: 150 },
    acreage: 450,
    cropType: 'Wheat & Soybeans',
    tempCelsius: 28,
    windSpeedKmh: 12,
    irrigationType: 'Center Pivot Sprinkler',
    healthScore: 94,
  },
  {
    name: 'High Plains Farm',
    code: 'Plains Farm',
    region: 'Amarillo, TX',
    soilMoisture: 64,
    targetMoistureMin: 45,
    targetMoistureMax: 70,
    soilType: 'Sandy Soil',
    soilPh: '7.1',
    weatherStatus: 'Clear Skies, 32°C',
    coordinates: { x: 380, y: 100 },
    acreage: 720,
    cropType: 'Corn & Sorghum',
    tempCelsius: 32,
    windSpeedKmh: 18,
    irrigationType: 'Drip Pipe Lines',
    healthScore: 91,
  },
  {
    name: 'Delta River Farm',
    code: 'Delta Farm',
    region: 'Mississippi Delta, MS',
    soilMoisture: 52,
    targetMoistureMin: 50,
    targetMoistureMax: 75,
    soilType: 'Clay Soil',
    soilPh: '6.4',
    weatherStatus: 'Humid, 29°C',
    coordinates: { x: 620, y: 160 },
    acreage: 580,
    cropType: 'Cotton & Rice',
    tempCelsius: 29,
    windSpeedKmh: 8,
    irrigationType: 'Flood Canal Gates',
    healthScore: 96,
  },
  {
    name: 'Highland Orchard',
    code: 'Orchard Farm',
    region: 'Yakima Valley, WA',
    soilMoisture: 75,
    targetMoistureMin: 55,
    targetMoistureMax: 80,
    soilType: 'Ash Soil',
    soilPh: '6.2',
    weatherStatus: 'Cool Breeze, 22°C',
    coordinates: { x: 420, y: 240 },
    acreage: 320,
    cropType: 'Apples & Cherries',
    tempCelsius: 22,
    windSpeedKmh: 15,
    irrigationType: 'Drone Spraying',
    healthScore: 98,
  },
];

export async function seedDatabase(): Promise<void> {
  console.log('[LOG] Seeding clean human-friendly farm database...');

  // 1. Clear tables
  await db.delete(eventLogs);
  await db.delete(incidentTickets);
  await db.delete(tasks);
  await db.delete(resources);
  await db.delete(farms);

  // 2. Insert Farms
  const insertedFarms = await db.insert(farms).values(seedFarms).returning();
  const [farm1, farm2, farm3, farm4] = insertedFarms;

  // 3. Insert Simple Human Equipment & Workers
  const enterpriseResources: NewResource[] = [
    // North Farm
    { name: 'Tractor 1 (Plow)', type: 'TRACTOR', status: 'BUSY', currentFarmId: farm1.id, fuelOrBattery: 78, model: 'Main Field Tractor', serialNumber: 'TR-01', speedKmh: 14, implementStatus: 'Plow Hooked Up', engineHours: 1240, maxPayloadKg: 4500 },
    { name: 'Field Sprayer', type: 'HARVESTER', status: 'IDLE', currentFarmId: farm1.id, fuelOrBattery: 95, model: 'Boom Sprayer Rig', serialNumber: 'SP-01', speedKmh: 0, implementStatus: 'Boom Folded & Clean', engineHours: 680, maxPayloadKg: 3200 },
    { name: 'Rohan (Manager)', type: 'WORKER', status: 'BUSY', currentFarmId: farm1.id, fuelOrBattery: 100, model: 'Field Operator', serialNumber: 'W-01', speedKmh: 5, implementStatus: 'Field Check Kit', engineHours: 320, maxPayloadKg: 80 },

    // Plains Farm
    { name: 'Tractor 2 (Planter)', type: 'TRACTOR', status: 'IDLE', currentFarmId: farm2.id, fuelOrBattery: 88, model: 'Seed Planting Tractor', serialNumber: 'TR-02', speedKmh: 0, implementStatus: 'Seed Planter Standby', engineHours: 890, maxPayloadKg: 4500 },
    { name: 'Drone 1 (Camera)', type: 'DRONE', status: 'BUSY', currentFarmId: farm2.id, fuelOrBattery: 62, model: 'Field Scouting Drone', serialNumber: 'DR-01', speedKmh: 24, implementStatus: 'Camera Scanning Crops', engineHours: 190, maxPayloadKg: 40 },
    { name: 'Priya (Worker)', type: 'WORKER', status: 'IDLE', currentFarmId: farm2.id, fuelOrBattery: 100, model: 'Crop Scout', serialNumber: 'W-02', speedKmh: 0, implementStatus: 'Soil Testing Kit', engineHours: 210, maxPayloadKg: 80 },

    // Delta Farm
    { name: 'Big Tractor (Leveler)', type: 'TRACTOR', status: 'BUSY', currentFarmId: farm3.id, fuelOrBattery: 85, model: 'Heavy Track Tractor', serialNumber: 'TR-03', speedKmh: 11, implementStatus: 'Dirt Leveler Attached', engineHours: 1560, maxPayloadKg: 6000 },
    { name: 'High Sprayer', type: 'HARVESTER', status: 'IDLE', currentFarmId: farm3.id, fuelOrBattery: 92, model: 'Tall Crop Sprayer', serialNumber: 'SP-02', speedKmh: 0, implementStatus: 'Clean Water in Tank', engineHours: 410, maxPayloadKg: 6200 },
    { name: 'Marcus (Water Tech)', type: 'WORKER', status: 'BUSY', currentFarmId: farm3.id, fuelOrBattery: 95, model: 'Irrigation Lead', serialNumber: 'W-03', speedKmh: 8, implementStatus: 'Water Gate Keys', engineHours: 440, maxPayloadKg: 80 },

    // Orchard Farm
    { name: 'Orchard Tractor', type: 'TRACTOR', status: 'IDLE', currentFarmId: farm4.id, fuelOrBattery: 90, model: 'Narrow Tree Tractor', serialNumber: 'TR-04', speedKmh: 0, implementStatus: 'Grass Mower Attached', engineHours: 730, maxPayloadKg: 4800 },
    { name: 'Drone 2 (Sprayer)', type: 'DRONE', status: 'IDLE', currentFarmId: farm4.id, fuelOrBattery: 100, model: 'Tree Spraying Drone', serialNumber: 'DR-02', speedKmh: 0, implementStatus: 'Fungicide Loaded', engineHours: 85, maxPayloadKg: 50 },
    { name: 'Elena (Inspector)', type: 'WORKER', status: 'IDLE', currentFarmId: farm4.id, fuelOrBattery: 100, model: 'Tree Inspector', serialNumber: 'W-04', speedKmh: 0, implementStatus: 'Magnifying Scope', engineHours: 180, maxPayloadKg: 80 },
  ];

  const insertedResources = await db.insert(resources).values(enterpriseResources).returning();

  // 4. Insert Simple Human Tasks
  const enterpriseTasks: NewTask[] = [
    // North Farm Tasks
    { title: 'Plow North Field', farmId: farm1.id, assignedResourceId: insertedResources[0].id, status: 'IN_PROGRESS', priority: 1, scheduledSlot: '06:00 - 08:30', aiReasoning: 'Ground is dry enough to plow without packing the mud.', category: 'Plowing', progressPercent: 65, fieldSection: 'Field A', targetHectares: 35 },
    { title: 'Spray Weeds around Fences', farmId: farm1.id, assignedResourceId: insertedResources[1].id, status: 'SCHEDULED', priority: 2, scheduledSlot: '09:00 - 11:00', aiReasoning: 'Wind is calm right now. Good time to spray before it gets windy.', category: 'Spraying', progressPercent: 0, fieldSection: 'West Fence', targetHectares: 18 },
    { title: 'Check Water Pipes & Drip Lines', farmId: farm1.id, assignedResourceId: insertedResources[2].id, status: 'IN_PROGRESS', priority: 3, scheduledSlot: '08:00 - 10:30', aiReasoning: 'Scheduled routine check on sprinkler nozzles.', category: 'Watering', progressPercent: 40, fieldSection: 'Sprinkler Line 1', targetHectares: 50 },

    // Plains Farm Tasks
    { title: 'Drone Check for Crop Disease', farmId: farm2.id, assignedResourceId: insertedResources[4].id, status: 'IN_PROGRESS', priority: 1, scheduledSlot: '07:00 - 09:30', aiReasoning: 'Clear morning sunlight gives good drone photos of the crop.', category: 'Drone Scouting', progressPercent: 80, fieldSection: 'Corn Block B', targetHectares: 90 },
    { title: 'Fertilize Corn Field', farmId: farm2.id, assignedResourceId: insertedResources[3].id, status: 'SCHEDULED', priority: 2, scheduledSlot: '10:00 - 13:00', aiReasoning: 'Drone photos showed pale patches that need extra plant food.', category: 'Fertilizing', progressPercent: 0, fieldSection: 'East Corn Patch', targetHectares: 45 },

    // Delta Farm Tasks
    { title: 'Level Mud in Rice Field', farmId: farm3.id, assignedResourceId: insertedResources[6].id, status: 'IN_PROGRESS', priority: 1, scheduledSlot: '06:30 - 11:00', aiReasoning: 'Ground needs to be flat so water spreads evenly across the crop.', category: 'Plowing', progressPercent: 50, fieldSection: 'Rice Paddy 4', targetHectares: 60 },
    { title: 'Spray Liquid Plant Vitamins', farmId: farm3.id, assignedResourceId: insertedResources[7].id, status: 'SCHEDULED', priority: 2, scheduledSlot: '13:30 - 16:30', aiReasoning: 'High humidity helps the leaves soak up the fertilizer.', category: 'Spraying', progressPercent: 0, fieldSection: 'Cotton Block 2', targetHectares: 40 },

    // Orchard Farm Tasks
    { title: 'Check Apple Trees for Fungus', farmId: farm4.id, assignedResourceId: insertedResources[11].id, status: 'SCHEDULED', priority: 2, scheduledSlot: '09:30 - 12:00', aiReasoning: 'Weekly walk through the rows to look for white mold on leaves.', category: 'Inspecting', progressPercent: 0, fieldSection: 'Honeycrisp Hill', targetHectares: 25 },
    { title: 'Spray Insect Protection on Apples', farmId: farm4.id, assignedResourceId: insertedResources[10].id, status: 'SCHEDULED', priority: 3, scheduledSlot: '14:00 - 15:30', aiReasoning: 'Drone flight path mapped between the tree rows.', category: 'Spraying', progressPercent: 0, fieldSection: 'Orchard Row 3', targetHectares: 15 },
  ];

  await db.insert(tasks).values(enterpriseTasks);

  // 5. Initial Log Stream
  const initialLogs: NewEventLog[] = [
    { level: 'INFO', emoji: '[SYSTEM]', message: 'Farm Operations Online — 4 Farms Connected (North, Plains, Delta, Orchard)', farmId: null, relatedTicketId: null },
    { level: 'DISPATCH', emoji: '[DISPATCH]', message: 'Tractor 1 started plowing Field A (North Farm)', farmId: farm1.id, relatedTicketId: null },
    { level: 'DISPATCH', emoji: '[DISPATCH]', message: 'Drone 1 flying over Corn Block B taking crop health photos', farmId: farm2.id, relatedTicketId: null },
    { level: 'INFO', emoji: '[WEATHER]', message: 'Weather clear across all farms. Soil conditions ready for field work.', farmId: null, relatedTicketId: null },
  ];

  await db.insert(eventLogs).values(initialLogs);
  console.log('[LOG] Database successfully seeded with human-readable farm names!');
}

if (typeof require !== 'undefined' && require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Standalone seed finished');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

import { db } from './index';
import { farms, resources, tasks, incidentTickets, eventLogs } from './schema';
import type { NewFarm, NewResource, NewTask, NewEventLog } from './schema';

// ── Multi-Farm Enterprise Seed Data ───────────────────────────────────────────

const seedFarms: NewFarm[] = [
  {
    name: 'Sector Alpha - North Valley',
    code: 'SEC-01',
    region: 'Sacramento Basin, CA',
    soilMoisture: 42,
    targetMoistureMin: 40,
    targetMoistureMax: 65,
    soilType: 'Silt Loam',
    soilPh: '6.7',
    weatherStatus: 'Partly Cloudy, 28°C',
    coordinates: { x: 120, y: 150 },
    acreage: 450,
    cropType: 'Winter Wheat & Soybeans',
    tempCelsius: 28,
    windSpeedKmh: 12,
    irrigationType: 'CENTER_PIVOT',
    healthScore: 94,
  },
  {
    name: 'Sector Beta - High Plains',
    code: 'SEC-02',
    region: 'Amarillo Region, TX',
    soilMoisture: 64,
    targetMoistureMin: 45,
    targetMoistureMax: 70,
    soilType: 'Sandy Loam',
    soilPh: '7.1',
    weatherStatus: 'Clear Skies, 32°C',
    coordinates: { x: 380, y: 100 },
    acreage: 720,
    cropType: 'Sweet Corn & Sorghum',
    tempCelsius: 32,
    windSpeedKmh: 18,
    irrigationType: 'DRIP_MICRO',
    healthScore: 91,
  },
  {
    name: 'Sector Gamma - Delta Basin',
    code: 'SEC-03',
    region: 'Mississippi Delta, MS',
    soilMoisture: 52,
    targetMoistureMin: 50,
    targetMoistureMax: 75,
    soilType: 'Clay Loam',
    soilPh: '6.4',
    weatherStatus: 'Humid, 29°C',
    coordinates: { x: 620, y: 160 },
    acreage: 580,
    cropType: 'Organic Cotton & Rice',
    tempCelsius: 29,
    windSpeedKmh: 8,
    irrigationType: 'FLOOD_GATE',
    healthScore: 96,
  },
  {
    name: 'Sector Delta - Highland Orchards',
    code: 'SEC-04',
    region: 'Yakima Valley, WA',
    soilMoisture: 75,
    targetMoistureMin: 55,
    targetMoistureMax: 80,
    soilType: 'Volcanic Ash Loam',
    soilPh: '6.2',
    weatherStatus: 'Cool Breeze, 22°C',
    coordinates: { x: 420, y: 240 },
    acreage: 320,
    cropType: 'Honeycrisp Apples & Cherries',
    tempCelsius: 22,
    windSpeedKmh: 15,
    irrigationType: 'DRONE_AERIAL',
    healthScore: 98,
  },
];

export async function seedDatabase(): Promise<void> {
  console.log('[LOG][LOG] Seeding centralized multi-farm enterprise database...');

  // 1. Clear tables in reverse FK order
  await db.delete(eventLogs);
  await db.delete(incidentTickets);
  await db.delete(tasks);
  await db.delete(resources);
  await db.delete(farms);

  console.log('  [LOG] Cleared legacy demo data');

  // 2. Insert Centralized Farms
  const insertedFarms = await db.insert(farms).values(seedFarms).returning();
  const [farm1, farm2, farm3, farm4] = insertedFarms;
  console.log(`  [LOG] Seeded ${insertedFarms.length} enterprise farms across 4 regions`);

  // 3. Insert Appointed Machinery & Agronomic Employees
  const enterpriseResources: NewResource[] = [
    // Sector Alpha
    { name: 'John Deere 8R - Unit 01', type: 'TRACTOR', status: 'BUSY', currentFarmId: farm1.id, fuelOrBattery: 78, model: '8R 410 HP RTK Guidance', serialNumber: 'JD-8R-9901', speedKmh: 14, implementStatus: '12-Row Tiller Active', engineHours: 1240, maxPayloadKg: 4500 },
    { name: 'Kubota Sprayer Rig 02', type: 'HARVESTER', status: 'IDLE', currentFarmId: farm1.id, fuelOrBattery: 95, model: 'M7-172 Premium KVT', serialNumber: 'KB-SP-4402', speedKmh: 0, implementStatus: '24m Boom Folded', engineHours: 680, maxPayloadKg: 3200 },
    { name: 'Rohan Verma', type: 'WORKER', status: 'BUSY', currentFarmId: farm1.id, fuelOrBattery: 100, model: 'Lead Operations Agronomist', serialNumber: 'EMP-014', speedKmh: 5, implementStatus: 'Digital Crop Scout Rig', engineHours: 320, maxPayloadKg: 80 },

    // Sector Beta
    { name: 'John Deere 8R - Unit 04', type: 'TRACTOR', status: 'IDLE', currentFarmId: farm2.id, fuelOrBattery: 88, model: '8R 370 HP Variable Rate', serialNumber: 'JD-8R-9904', speedKmh: 0, implementStatus: 'Precision Planter Standby', engineHours: 890, maxPayloadKg: 4500 },
    { name: 'DJI Agras T30 - Drone 01', type: 'DRONE', status: 'BUSY', currentFarmId: farm2.id, fuelOrBattery: 62, model: 'Agras T30 Hexacopter RTK', serialNumber: 'DJI-T30-01', speedKmh: 24, implementStatus: 'NDVI Multispectral Scanning', engineHours: 190, maxPayloadKg: 40 },
    { name: 'Priya Sharma', type: 'WORKER', status: 'IDLE', currentFarmId: farm2.id, fuelOrBattery: 100, model: 'Field Sensor Specialist', serialNumber: 'EMP-022', speedKmh: 0, implementStatus: 'Soil Core Probe Kit', engineHours: 210, maxPayloadKg: 80 },

    // Sector Gamma
    { name: 'Case IH Steiger 620', type: 'TRACTOR', status: 'BUSY', currentFarmId: farm3.id, fuelOrBattery: 85, model: 'Steiger Quadtrac 620', serialNumber: 'CIH-620-77', speedKmh: 11, implementStatus: 'Laser Land Leveler Active', engineHours: 1560, maxPayloadKg: 6000 },
    { name: 'Hagie STS16 Sprayer', type: 'HARVESTER', status: 'IDLE', currentFarmId: farm3.id, fuelOrBattery: 92, model: 'STS16 High-Clearance 120ft', serialNumber: 'HAG-16-08', speedKmh: 0, implementStatus: 'Spray Tanks Cleaned', engineHours: 410, maxPayloadKg: 6200 },
    { name: 'Marcus Vance', type: 'WORKER', status: 'BUSY', currentFarmId: farm3.id, fuelOrBattery: 95, model: 'Irrigation & Drainage Supervisor', serialNumber: 'EMP-031', speedKmh: 8, implementStatus: 'Flood Gate Automation Rig', engineHours: 440, maxPayloadKg: 80 },

    // Sector Delta
    { name: 'Fendt 1050 Vario', type: 'TRACTOR', status: 'IDLE', currentFarmId: farm4.id, fuelOrBattery: 90, model: '1050 Vario Orchard Edition', serialNumber: 'FND-1050-2', speedKmh: 0, implementStatus: 'Orchard Flail Mower Standby', engineHours: 730, maxPayloadKg: 4800 },
    { name: 'XAG P100 Pro Drone', type: 'DRONE', status: 'IDLE', currentFarmId: farm4.id, fuelOrBattery: 100, model: 'P100 Pro Agricultural Quadcopter', serialNumber: 'XAG-P100-3', speedKmh: 0, implementStatus: 'Bio-Fungicide Payload Ready', engineHours: 85, maxPayloadKg: 50 },
    { name: 'Elena Rostova', type: 'WORKER', status: 'IDLE', currentFarmId: farm4.id, fuelOrBattery: 100, model: 'Plant Pathology Director', serialNumber: 'EMP-045', speedKmh: 0, implementStatus: 'Microscopic Disease Assay', engineHours: 180, maxPayloadKg: 80 },
  ];

  const insertedResources = await db.insert(resources).values(enterpriseResources).returning();
  console.log(`  [LOG] Seeded ${insertedResources.length} appointed machinery and field personnel`);

  // 4. Insert Work Orders across all 4 locations
  const enterpriseTasks: NewTask[] = [
    // Sector Alpha Tasks
    { title: 'Till North Field - Section A3', farmId: farm1.id, assignedResourceId: insertedResources[0].id, status: 'IN_PROGRESS', priority: 1, scheduledSlot: '06:00 - 08:30', aiReasoning: 'Soil moisture optimal for minimum compaction tilling at dawn', category: 'TILLAGE', progressPercent: 65, fieldSection: 'Section A3', targetHectares: 35 },
    { title: 'Spray Herbicide - Perimeter Zone', farmId: farm1.id, assignedResourceId: insertedResources[1].id, status: 'SCHEDULED', priority: 2, scheduledSlot: '09:00 - 11:00', aiReasoning: 'Wind speed below 15 km/h threshold until 11:00', category: 'SPRAYING', progressPercent: 0, fieldSection: 'Perimeter West', targetHectares: 18 },
    { title: 'Inspect Drip Emitters & Soil Tension', farmId: farm1.id, assignedResourceId: insertedResources[2].id, status: 'IN_PROGRESS', priority: 3, scheduledSlot: '08:00 - 10:30', aiReasoning: 'Scheduled moisture sensor calibration verification', category: 'IRRIGATION', progressPercent: 40, fieldSection: 'Pivot Zone 1', targetHectares: 50 },

    // Sector Beta Tasks
    { title: 'Aerial NDVI Crop Health Scan', farmId: farm2.id, assignedResourceId: insertedResources[4].id, status: 'IN_PROGRESS', priority: 1, scheduledSlot: '07:00 - 09:30', aiReasoning: 'Sun angle optimal for multispectral NDVI reflection indices', category: 'SURVEY', progressPercent: 80, fieldSection: 'Grid B1-B8', targetHectares: 90 },
    { title: 'Variable-Rate Nitrogen Application', farmId: farm2.id, assignedResourceId: insertedResources[3].id, status: 'SCHEDULED', priority: 2, scheduledSlot: '10:00 - 13:00', aiReasoning: 'Zone C2 nitrogen deficiency flagged by previous drone pass', category: 'SPRAYING', progressPercent: 0, fieldSection: 'Zone C2', targetHectares: 45 },

    // Sector Gamma Tasks
    { title: 'Laser Land Leveling - Paddy C4', farmId: farm3.id, assignedResourceId: insertedResources[6].id, status: 'IN_PROGRESS', priority: 1, scheduledSlot: '06:30 - 11:00', aiReasoning: 'Grading precision required before seasonal flood irrigation', category: 'TILLAGE', progressPercent: 50, fieldSection: 'Paddy C4', targetHectares: 60 },
    { title: 'Foliar Bio-Stimulant Spraying', farmId: farm3.id, assignedResourceId: insertedResources[7].id, status: 'SCHEDULED', priority: 2, scheduledSlot: '13:30 - 16:30', aiReasoning: 'High humidity window enhances cuticular absorption', category: 'SPRAYING', progressPercent: 0, fieldSection: 'Paddy Delta 2', targetHectares: 40 },

    // Sector Delta Tasks
    { title: 'Canopy Disease Scout & Soil Sampling', farmId: farm4.id, assignedResourceId: insertedResources[11].id, status: 'SCHEDULED', priority: 2, scheduledSlot: '09:30 - 12:00', aiReasoning: 'Weekly inspection for early powdery mildew fungal spore development', category: 'SURVEY', progressPercent: 0, fieldSection: 'Orchard Ridge 3', targetHectares: 25 },
    { title: 'Targeted Orchard Micro-Spraying', farmId: farm4.id, assignedResourceId: insertedResources[10].id, status: 'SCHEDULED', priority: 3, scheduledSlot: '14:00 - 15:30', aiReasoning: 'Autonomous drone flight path calibrated for orchard spacing', category: 'SPRAYING', progressPercent: 0, fieldSection: 'Orchard Block A', targetHectares: 15 },
  ];

  const insertedTasks = await db.insert(tasks).values(enterpriseTasks).returning();
  console.log(`  [LOG] Seeded ${insertedTasks.length} active field operations`);

  // 5. Insert Initial Telemetry Stream
  const initialLogs: NewEventLog[] = [
    { level: 'INFO', emoji: '[LOG][LOG]', message: 'PARALLAX ARM Enterprise Command Center — 4 Sectors Online', farmId: null, relatedTicketId: null },
    { level: 'INFO', emoji: '[LOG][LOG]', message: 'Connected 4 geographically distributed farming hubs (CA, TX, MS, WA)', farmId: null, relatedTicketId: null },
    { level: 'DISPATCH', emoji: '[LOG][LOG]', message: 'Tractor 8R Unit 01 engaged in Section A3 (Tillage 65% complete)', farmId: farm1.id, relatedTicketId: null },
    { level: 'DISPATCH', emoji: '[LOG][LOG]', message: 'DJI Agras T30 airborne over Sector Beta (NDVI scan 80% complete)', farmId: farm2.id, relatedTicketId: null },
    { level: 'DISPATCH', emoji: '[LOG][LOG]', message: 'Case IH Steiger 620 laser leveling Paddy C4 (Sector Gamma)', farmId: farm3.id, relatedTicketId: null },
    { level: 'AI', emoji: '[LOG][LOG]', message: 'Gemini 3.8 Flash multi-farm reasoning online. Telemetry monitoring nominal.', farmId: null, relatedTicketId: null },
  ];

  await db.insert(eventLogs).values(initialLogs);
  console.log('  [LOG] Seeded enterprise telemetry event stream');
  console.log('[LOG][LOG] Enterprise Multi-Farm Database Successfully Initialized!');
}

if (typeof require !== 'undefined' && require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[LOG] Standalone seed complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[LOG] Seed failed:', err);
      process.exit(1);
    });
}

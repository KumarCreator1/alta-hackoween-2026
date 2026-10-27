const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.SUPA_DATABASE_URL;

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL / SUPA_DATABASE_URL in environment');
  process.exit(1);
}

const isRemote = connectionString.includes('supabase.co') || connectionString.includes('sslmode=require');

const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  console.log('🔄 Connecting to Supabase database...');
  const client = await pool.connect();
  console.log('✅ Connected successfully!');

  try {
    console.log('📋 Creating enums and tables if not exist...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE resource_status AS ENUM ('IDLE', 'BUSY', 'MAINTENANCE', 'EN_ROUTE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE task_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'PAUSED_BY_AI', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE ticket_status AS ENUM ('AI_TRIAGE', 'AWAITING_APPROVAL', 'DISPATCHED', 'RESOLVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS farms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        soil_moisture INTEGER NOT NULL,
        weather_status TEXT NOT NULL,
        coordinates JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status resource_status DEFAULT 'IDLE' NOT NULL,
        current_farm_id INTEGER REFERENCES farms(id) NOT NULL,
        fuel_or_battery INTEGER DEFAULT 100 NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        farm_id INTEGER REFERENCES farms(id) NOT NULL,
        assigned_resource_id INTEGER REFERENCES resources(id),
        status task_status DEFAULT 'SCHEDULED' NOT NULL,
        priority INTEGER DEFAULT 3 NOT NULL,
        scheduled_slot TEXT NOT NULL,
        ai_reasoning TEXT
      );

      CREATE TABLE IF NOT EXISTS incident_tickets (
        id SERIAL PRIMARY KEY,
        trigger_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        affected_farm_id INTEGER REFERENCES farms(id) NOT NULL,
        executive_summary TEXT NOT NULL,
        proposed_mutations JSONB NOT NULL,
        status ticket_status DEFAULT 'AWAITING_APPROVAL' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS event_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        level TEXT NOT NULL,
        emoji TEXT NOT NULL,
        message TEXT NOT NULL,
        related_ticket_id INTEGER REFERENCES incident_tickets(id)
      );
    `);
    console.log('✅ Tables and Enums verified!');

    console.log('🌱 Seeding demo baseline data...');
    // Clear existing
    await client.query('DELETE FROM event_logs;');
    await client.query('DELETE FROM incident_tickets;');
    await client.query('DELETE FROM tasks;');
    await client.query('DELETE FROM resources;');
    await client.query('DELETE FROM farms;');

    // Insert Farms
    const farmAlpha = await client.query(`
      INSERT INTO farms (name, soil_moisture, weather_status, coordinates)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `, ['Sector Alpha - North Valley', 42, 'Partly Cloudy, 28°C', JSON.stringify({ x: 150, y: 200 })]);
    const farmAlphaId = farmAlpha.rows[0].id;

    const farmBeta = await client.query(`
      INSERT INTO farms (name, soil_moisture, weather_status, coordinates)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `, ['Sector Beta - High Plains', 67, 'Clear Skies, 32°C', JSON.stringify({ x: 650, y: 200 })]);
    const farmBetaId = farmBeta.rows[0].id;

    console.log(`  ✓ Inserted Farms (Alpha #${farmAlphaId}, Beta #${farmBetaId})`);

    // Insert Resources
    const r1 = await client.query(`
      INSERT INTO resources (name, type, status, current_farm_id, fuel_or_battery)
      VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `, ['John Deere 8R - Unit 01', 'TRACTOR', 'BUSY', farmAlphaId, 72]);
    const r1Id = r1.rows[0].id;

    await client.query(`
      INSERT INTO resources (name, type, status, current_farm_id, fuel_or_battery)
      VALUES ($1, $2, $3, $4, $5);
    `, ['Kubota Sprayer Rig 02', 'HARVESTER', 'IDLE', farmAlphaId, 95]);

    await client.query(`
      INSERT INTO resources (name, type, status, current_farm_id, fuel_or_battery)
      VALUES ($1, $2, $3, $4, $5);
    `, ['Rohan (Lead Agronomist)', 'WORKER', 'BUSY', farmAlphaId, 100]);

    await client.query(`
      INSERT INTO resources (name, type, status, current_farm_id, fuel_or_battery)
      VALUES ($1, $2, $3, $4, $5);
    `, ['John Deere 8R - Unit 04', 'TRACTOR', 'IDLE', farmBetaId, 88]);

    const r5 = await client.query(`
      INSERT INTO resources (name, type, status, current_farm_id, fuel_or_battery)
      VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `, ['DJI Agras T30 - Drone 01', 'DRONE', 'BUSY', farmBetaId, 54]);
    const r5Id = r5.rows[0].id;

    await client.query(`
      INSERT INTO resources (name, type, status, current_farm_id, fuel_or_battery)
      VALUES ($1, $2, $3, $4, $5);
    `, ['Priya (Field Technician)', 'WORKER', 'IDLE', farmBetaId, 100]);

    console.log('  ✓ Inserted 6 Resources');

    // Insert Tasks
    const tasks = [
      { title: 'Till North Field - Section A3', farmId: farmAlphaId, resourceId: r1Id, status: 'IN_PROGRESS', priority: 1, slot: '06:00 - 08:00', reason: 'Soil moisture optimal for tilling at dawn' },
      { title: 'Spray Herbicide - Perimeter Zone', farmId: farmAlphaId, resourceId: null, status: 'SCHEDULED', priority: 2, slot: '08:30 - 10:00', reason: 'Wind speed below threshold until 10:00' },
      { title: 'Soil Sampling - Grid B2-B4', farmId: farmAlphaId, resourceId: null, status: 'SCHEDULED', priority: 3, slot: '10:30 - 12:00', reason: null },
      { title: 'Irrigate Sector A - East Pivot', farmId: farmAlphaId, resourceId: null, status: 'SCHEDULED', priority: 2, slot: '13:00 - 15:00', reason: 'Soil moisture dropping below 40% threshold' },
      { title: 'Fence Repair - South Boundary', farmId: farmAlphaId, resourceId: null, status: 'SCHEDULED', priority: 4, slot: '15:00 - 17:00', reason: null },
      { title: 'Equipment Maintenance - Unit 01', farmId: farmAlphaId, resourceId: null, status: 'SCHEDULED', priority: 5, slot: '17:30 - 18:30', reason: 'Routine 200-hr service interval reached' },
      { title: 'Aerial Survey - Crop Health Scan', farmId: farmBetaId, resourceId: r5Id, status: 'IN_PROGRESS', priority: 1, slot: '06:30 - 08:30', reason: 'NDVI analysis scheduled for morning light' },
      { title: 'Precision Fertilize - Zone C1', farmId: farmBetaId, resourceId: null, status: 'SCHEDULED', priority: 2, slot: '09:00 - 11:00', reason: 'Nitrogen deficiency detected in Zone C1' },
      { title: 'Harvest Wheat - Section D2', farmId: farmBetaId, resourceId: null, status: 'SCHEDULED', priority: 1, slot: '11:30 - 14:00', reason: 'Grain moisture at 13.5%, optimal for harvest' },
      { title: 'Water Quality Test - Reservoir B', farmId: farmBetaId, resourceId: null, status: 'SCHEDULED', priority: 3, slot: '14:30 - 15:30', reason: null },
      { title: 'Replant Cover Crop - Strip E1', farmId: farmBetaId, resourceId: null, status: 'SCHEDULED', priority: 4, slot: '16:00 - 17:30', reason: 'Post-harvest cover to prevent erosion' },
      { title: 'Drone Battery Swap & Calibration', farmId: farmBetaId, resourceId: null, status: 'SCHEDULED', priority: 3, slot: '17:30 - 18:00', reason: 'Battery below 30% after survey completion' },
    ];

    for (const t of tasks) {
      await client.query(`
        INSERT INTO tasks (title, farm_id, assigned_resource_id, status, priority, scheduled_slot, ai_reasoning)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [t.title, t.farmId, t.resourceId, t.status, t.priority, t.slot, t.reason]);
    }
    console.log(`  ✓ Inserted ${tasks.length} baseline tasks`);

    // Insert Initial Telemetry Logs
    const logs = [
      ['INFO', '🟢', 'ARM Command Center v1.0 — System Online (Supabase Link Established)'],
      ['INFO', '📡', 'Telemetry uplink established. All sensors nominal across sectors.'],
      ['INFO', '🌾', 'Farm "Sector Alpha - North Valley" connected. 3 resources active.'],
      ['INFO', '🌾', 'Farm "Sector Beta - High Plains" connected. 3 resources active.'],
      ['DISPATCH', '🚜', 'Task "Till North Field - Section A3" dispatched to John Deere 8R - Unit 01.'],
      ['DISPATCH', '🛸', 'Task "Aerial Survey - Crop Health Scan" dispatched to DJI Agras T30 - Drone 01.'],
      ['AI', '🤖', 'Gemini AI reasoning module online. Real-time crisis triage active.'],
      ['INFO', '⏱️', 'Baseline schedules synchronized. Ready for operation.'],
    ];

    for (const [level, emoji, message] of logs) {
      await client.query(`
        INSERT INTO event_logs (level, emoji, message)
        VALUES ($1, $2, $3);
      `, [level, emoji, message]);
    }
    console.log(`  ✓ Inserted ${logs.length} initial event logs`);

    console.log('🎉 Supabase Database successfully initialized and seeded!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

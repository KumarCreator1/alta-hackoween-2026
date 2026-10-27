import { pool } from './index';
import { seedDatabase } from './seed';

export async function migrateAndSeed() {
  console.log('🔄 Running database schema migration on Supabase...');

  const client = await pool.connect();
  try {
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
    console.log('✅ Schema migration completed successfully!');
  } finally {
    client.release();
  }

  // Seed baseline data
  await seedDatabase();
}

if (typeof require !== 'undefined' && require.main === module) {
  migrateAndSeed()
    .then(() => {
      console.log('🎉 Supabase setup complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

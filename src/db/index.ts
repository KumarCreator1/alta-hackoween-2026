import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || process.env.SUPA_DATABASE_URL;

// Supabase and remote PostgreSQL endpoints require SSL
const isRemote =
  connectionString?.includes('supabase') ||
  connectionString?.includes('pooler') ||
  connectionString?.includes('sslmode=require') ||
  !connectionString?.includes('localhost');

const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.warn('Supabase PostgreSQL pool idle client warning:', err.message);
});

export const db = drizzle(pool, { schema });
export { pool };

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || process.env.SUPA_DATABASE_URL;

// Supabase and remote PostgreSQL endpoints require SSL
const isRemote = connectionString?.includes('supabase.co') || connectionString?.includes('sslmode=require');

const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });
export { pool };

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let connectionString = process.env.DATABASE_URL || process.env.SUPA_DATABASE_URL || '';

// Supabase and remote PostgreSQL endpoints require SSL
const isRemote =
  connectionString.includes('supabase') ||
  connectionString.includes('pooler') ||
  connectionString.includes('sslmode=require') ||
  (!connectionString.includes('localhost') && connectionString.length > 0);

// CRITICAL FOR SERVERLESS / VERCEL:
// Port 5432 on Supabase pooler is Session mode (limited to pool_size: 15, fails with EMAXCONNSESSION).
// Port 6543 on Supabase pooler is Transaction mode (supports thousands of concurrent serverless requests).
if (connectionString.includes('pooler.supabase.com:5432')) {
  connectionString = connectionString.replace(':5432', ':6543');
}

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

pool.on('error', (err) => {
  console.warn('Supabase PostgreSQL pool warning:', err.message);
});

export const db = drizzle(pool, { schema });

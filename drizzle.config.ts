const connectionString = process.env.DATABASE_URL || process.env.SUPA_DATABASE_URL || '';

const config = {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql' as const,
  dbCredentials: {
    url: connectionString,
    ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  },
};

export default config;

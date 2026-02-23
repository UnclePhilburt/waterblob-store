import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (pool) return pool;

  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    // Database connection pool initialized
  } else {
    // No DATABASE_URL found - running without database
  }

  return pool;
}

/** Convenience: get pool or throw if not configured */
export function requirePool(): Pool {
  const p = getPool();
  if (!p) {
    throw new Error('Database not configured');
  }
  return p;
}

let poolPromise;
export async function checkDatabase() {
  if (!process.env.DATABASE_URL) return { available: false, reason: 'DATABASE_URL missing' };
  try {
    if (!poolPromise) poolPromise = import('pg').then(({ default: pg }) => new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000, max: 4, idleTimeoutMillis: 15000 }));
    const pool = await poolPromise;
    await pool.query('SELECT 1');
    return { available: true };
  } catch {
    return { available: false, reason: 'database unreachable' };
  }
}

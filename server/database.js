import pg from 'pg';

const pool = new pg.Pool({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xrsfqktxavdrjoduclma',
  password: process.env.DB_PASSWORD || 'Sheetspark2026',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000
});

const convertSql = (sql) => {
  let count = 1;
  return sql.replace(/\?/g, () => '$' + (count++));
};

class AsyncDatabaseWrapper {
  async query(sql, params = []) {
    const pgSql = convertSql(sql);
    const result = await pool.query(pgSql, params);
    return result.rows;
  }

  async queryOne(sql, params = []) {
    const pgSql = convertSql(sql);
    const result = await pool.query(pgSql, params);
    return result.rows[0];
  }

  async execute(sql, params = []) {
    const pgSql = convertSql(sql);
    const result = await pool.query(pgSql, params);
    return { changes: result.rowCount };
  }
}

const db = new AsyncDatabaseWrapper();

export async function initDatabase() {
  // Test connection on startup
  try {
    const client = await pool.connect();
    console.log('Connected to Supabase PostgreSQL successfully!');
    client.release();
  } catch (err) {
    console.error('Failed to connect to Supabase:', err.message);
  }
  return db;
}

export function getDb() {
  return db;
}

export default { initDatabase, getDb };

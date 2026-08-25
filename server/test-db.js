import pg from 'pg';
const testConnection = async () => {
  const pool = new pg.Pool({
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.xrsfqktxavdrjoduclma',
    password: process.env.DB_PASSWORD || 'Sheetspark2026',
    ssl: { rejectUnauthorized: false }
  });
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log(res.rows.map(r => r.table_name));
  process.exit(0);
};
testConnection();

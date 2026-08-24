import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import pg from 'pg';

const dbPath = path.join(process.cwd(), 'server/crm.db');

const pool = new pg.Pool({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.thlsmxbenxovnfjqgnyq',
  password: 'Marcela@2026#2026',
  ssl: { rejectUnauthorized: false }
});

const tables = [
  'usuarios',
  'empreendimentos',
  'blocos',
  'unidades',
  'leads',
  'reservas',
  'propostas',
  'lead_historico',
  'configuracoes',
  'rodizio_estado',
  'metas'
];

async function migrate() {
  console.log('Loading SQLite local database...');
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const sqliteDb = new SQL.Database(fileBuffer);
  
  const client = await pool.connect();
  console.log('Connected to Supabase PostgreSQL!');

  try {
    for (const table of tables) {
      console.log('Migrating table: ' + table);
      
      const res = sqliteDb.exec('SELECT * FROM ' + table);
      if (res.length === 0) {
        console.log('Table ' + table + ' is empty in SQLite. Skipping.');
        continue;
      }

      const columns = res[0].columns;
      const values = res[0].values;
      console.log('Found ' + values.length + ' rows to migrate.');

      for (const row of values) {
        const insertCols = columns.join(', ');
        let placeholders = [];
        for (let i = 1; i <= columns.length; i++) {
            placeholders.push('$' + i);
        }
        const query = 'INSERT INTO ' + table + ' (' + insertCols + ') VALUES (' + placeholders.join(', ') + ') ON CONFLICT DO NOTHING';
        
        await client.query(query, row);
      }
      console.log('Finished migrating ' + table + '.');
    }
    
    console.log('\nMigration complete! Your local data is now in Supabase!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    sqliteDb.close();
    process.exit(0);
  }
}

migrate();


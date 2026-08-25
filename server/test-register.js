import pg from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const client = new pg.Client({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xrsfqktxavdrjoduclma',
  password: 'Sheetspark2026',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  await client.connect();
  try {
    const email = 'lukinhask03@gmail.com';
    const existing = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    console.log('Existing users with this email:', existing.rows);
    
    const id = uuidv4();
    const hash = bcrypt.hashSync('1234', 10);
    const res = await client.query(`
      INSERT INTO usuarios (id, nome, email, senha_hash, role, disponivel_rodizio)
      VALUES ($1, $2, $3, $4, $5, 0)
    `, [id, 'LUCAS TEST', email, hash, 'corretor']);
    console.log('Insert success!', res.rowCount);
    
    // Clean up
    await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
  } catch(e) {
    console.error('Error during insert:', e.message);
  } finally {
    await client.end();
  }
}
test();

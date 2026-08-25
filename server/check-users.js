import pg from 'pg';
import bcrypt from 'bcryptjs';

const client = new pg.Client({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xrsfqktxavdrjoduclma',
  password: 'Sheetspark2026',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();
  const res = await client.query('SELECT id, nome, email, role, ativo, senha_hash FROM usuarios');
  console.log('Usuarios cadastrados:', res.rows.map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role,
    ativo: u.ativo,
    passTestAdmin123: bcrypt.compareSync('admin123', u.senha_hash),
    passTestSheetsPark2026: bcrypt.compareSync('Sheetspark2026', u.senha_hash)
  })));
  await client.end();
}

check();

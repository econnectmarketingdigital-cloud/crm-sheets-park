import pg from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, getDb } from './database.js';

const connectionString = 'postgresql://postgres:Marcela%402026%232026@db.thlsmxbenxovnfjqgnyq.supabase.co:5432/postgres';

async function addAdmins() {
  const admins = [
    { nome: 'Marcela Lopes', email: 'marcelalopesf@gmail.com' },
    { nome: 'Agência eConnect', email: 'econnectmarketingdigital@gmail.com' },
    { nome: 'Agência iConnect', email: 'iconnectmarketingdigital@gmail.com' },
    { nome: 'Agência eConnect Curta', email: 'econnect@gmail.com' },
    { nome: 'Agência iConnect Curta', email: 'iconnect@gmail.com' },
    { nome: 'Gestor Marcela Lopes', email: 'gestor@marcelaloopes.com.br' }
  ];

  // 1. Update Supabase
  try {
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    for (const a of admins) {
      const senhaHash = bcrypt.hashSync('admin123', 10);
      const id = uuidv4();
      await client.query(`
        INSERT INTO usuarios (id, nome, email, senha_hash, role, ativo, disponivel_rodizio)
        VALUES ($1, $2, $3, $4, 'gestor', 1, 0)
        ON CONFLICT (email) DO UPDATE SET role = 'gestor', ativo = 1;
      `, [id, a.nome, a.email.toLowerCase().trim(), senhaHash]);
      console.log(`✅ [Supabase] Admin cadastrado: ${a.nome} (${a.email})`);
    }
    await client.end();
  } catch (err) {
    console.error('Erro no Supabase:', err.message);
  }

  // 2. Update Local SQLite Database
  try {
    await initDatabase();
    const db = getDb();
    for (const a of admins) {
      const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(a.email.toLowerCase().trim());
      if (existing) {
        db.prepare("UPDATE usuarios SET role = 'gestor', ativo = 1 WHERE id = ?").run(existing.id);
      } else {
        const senhaHash = bcrypt.hashSync('admin123', 10);
        db.prepare(`
          INSERT INTO usuarios (id, nome, email, senha_hash, role, ativo, disponivel_rodizio)
          VALUES (?, ?, ?, ?, 'gestor', 1, 0)
        `).run(uuidv4(), a.nome, a.email.toLowerCase().trim(), senhaHash);
      }
      console.log(`✅ [Local] Admin cadastrado: ${a.nome} (${a.email})`);
    }
  } catch (err) {
    console.error('Erro no banco local:', err.message);
  }
}

addAdmins();

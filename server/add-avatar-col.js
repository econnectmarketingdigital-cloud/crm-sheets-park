import pg from 'pg';

const client = new pg.Client({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xrsfqktxavdrjoduclma',
  password: 'Sheetspark2026',
  ssl: { rejectUnauthorized: false }
});

async function addAvatarColumn() {
  await client.connect();
  console.log('⚡ Conectado para adicionar coluna avatar_url...');
  try {
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
    console.log('✅ Coluna avatar_url verificada/adicionada com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}

addAvatarColumn();

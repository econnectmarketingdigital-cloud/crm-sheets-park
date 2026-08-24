import { initDatabase } from './database.js';

async function zerar() {
  const db = await initDatabase();
  try {
    await db.execute('DELETE FROM lead_historico');
    await db.execute('DELETE FROM propostas');
    await db.execute('DELETE FROM reservas');
    await db.execute('DELETE FROM leads');
    console.log('Dashboard zerado com sucesso!');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
zerar();

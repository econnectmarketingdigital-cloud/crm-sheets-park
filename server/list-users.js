import { initDatabase } from './database.js';
async function listUsers() {
  const db = await initDatabase();
  try {
    const users = await db.query("SELECT id, nome, email, role, ativo FROM usuarios");
    console.log(JSON.stringify(users, null, 2));
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
}
listUsers();

import { initDatabase } from './database.js';
async function cleanUsers() {
  const db = await initDatabase();
  try {
    await db.execute("DELETE FROM usuarios WHERE email NOT IN ('marcelalopesf@gmail.com', 'econnectmarketingdigital@gmail.com')");
    await db.execute("UPDATE usuarios SET nome = 'Marcela Lopes', role = 'gestor', ativo = 1 WHERE email = 'marcelalopesf@gmail.com'");
    await db.execute("UPDATE usuarios SET nome = 'Econnect Marketing', role = 'gestor', ativo = 1 WHERE email = 'econnectmarketingdigital@gmail.com'");
    console.log('Cleaned users successfully!');
    const users = await db.query("SELECT id, nome, email, role, ativo FROM usuarios");
    console.log(JSON.stringify(users, null, 2));
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
}
cleanUsers();

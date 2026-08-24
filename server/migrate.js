import { getDb, initDatabase } from './database.js';

async function migrate() {
  const db = await initDatabase();
  try {
    await db.execute('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS wallpaper_url TEXT;');
    console.log('Column added!');
  } catch(e) {
    console.log(e);
  }
  process.exit(0);
}
migrate();

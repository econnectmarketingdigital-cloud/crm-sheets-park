import { initDatabase } from './database.js';
async function addCol() {
  const db = await initDatabase();
  try {
    await db.execute("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS wallpaper_position TEXT DEFAULT 'center center';");
    console.log('Column wallpaper_position added!');
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
}
addCol();

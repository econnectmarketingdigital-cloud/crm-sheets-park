import { initDatabase } from './database.js';
async function clearAllWallpapers() {
  const db = await initDatabase();
  try {
    await db.execute("UPDATE usuarios SET wallpaper_url = NULL, wallpaper_position = NULL");
    console.log('Wallpapers cleared in database!');
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
}
clearAllWallpapers();

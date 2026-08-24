import { initDatabase } from './database.js';

async function createBucketAndPolicies() {
  const db = await initDatabase();
  try {
    await db.execute("INSERT INTO storage.buckets (id, name, public) VALUES ('wallpapers', 'wallpapers', true) ON CONFLICT (id) DO UPDATE SET public = true");
    
    try {
      await db.execute('DROP POLICY IF EXISTS "Allow All Wallpaper Uploads" ON storage.objects;');
      await db.execute('DROP POLICY IF EXISTS "Allow All Wallpaper Select" ON storage.objects;');
      await db.execute('DROP POLICY IF EXISTS "Allow All Wallpaper Update" ON storage.objects;');
    } catch(err) {}

    await db.execute("CREATE POLICY \"Allow All Wallpaper Uploads\" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'wallpapers');");
    await db.execute("CREATE POLICY \"Allow All Wallpaper Select\" ON storage.objects FOR SELECT TO public USING (bucket_id = 'wallpapers');");
    await db.execute("CREATE POLICY \"Allow All Wallpaper Update\" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'wallpapers');");

    console.log('Bucket & RLS Policies configured!');
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
createBucketAndPolicies();


import express from 'express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { getDb } from '../database.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Supabase Configuration
const supabaseUrl = 'https://xrsfqktxavdrjoduclma.supabase.co';
// Usando a service_role key que você forneceu para garantir permissão total no backend
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyc2Zxa3R4YXZkcmpvZHVjbG1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzUzOTcyNiwiZXhwIjoyMTAzMTE1NzI2fQ.zqbyYv3iPqmX6FpxYTx3J2S7wqZZOJ5jd9Od8B1pdQE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'uploads';

// Garante que o bucket 'uploads' existe (cria automaticamente se não existir)
async function ensureBucket() {
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
    if (error && error.message.includes('not found')) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });
      console.log(`[Upload] ✅ Bucket '${BUCKET_NAME}' criado no Supabase!`);
    } else if (!error) {
      console.log(`[Upload] ✅ Bucket '${BUCKET_NAME}' já existe no Supabase.`);
    }
  } catch (err) {
    console.error('[Upload] ❌ Erro ao verificar bucket:', err.message);
  }
}
ensureBucket();

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  try {
    const { image, type = 'wallpaper' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem fornecida' });
    }

    // Extrai o buffer do base64
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const filename = `${type}-${req.user.id}-${Date.now()}.webp`;
    let processedBuffer;

    if (type === 'avatar') {
      // Processa avatar (400x400)
      processedBuffer = await sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      // Processa wallpaper (máx 1920 largura)
      processedBuffer = await sharp(buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    }

    // 1. Faz o upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, processedBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('[Upload] Supabase upload error:', uploadError);
      return res.status(500).json({ success: false, error: 'Erro no Storage: ' + uploadError.message });
    }

    // 2. Pega a URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;
    console.log(`[Upload] ✅ Imagem salva no Supabase: ${publicUrl}`);

    // 3. Atualiza o banco de dados
    if (type === 'avatar') {
      await db.execute('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [publicUrl, req.user.id]);
    } else {
      await db.execute('UPDATE usuarios SET wallpaper_url = ? WHERE id = ?', [publicUrl, req.user.id]);
    }

    return res.json({ success: true, url: publicUrl, data: { url: publicUrl } });
  } catch (error) {
    console.error('[Upload] Erro geral:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao processar imagem: ' + error.message });
  }
});

export default router;

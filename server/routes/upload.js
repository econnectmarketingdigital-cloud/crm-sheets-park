import express from 'express';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { getDb } from '../database.js';

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Build the full public base URL for uploaded files
function getBaseUrl() {
  // In production (Render), use the public URL
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  // Fallback: manual env var or localhost
  return process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
}

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  try {
    const { image, type = 'wallpaper' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem fornecida' });
    }

    // Extract base64
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const filename = `${type}-${req.user.id}-${Date.now()}.webp`;
    const outputPath = path.join(uploadDir, filename);

    if (type === 'avatar') {
      // Process circular-ready avatar (400x400)
      await sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(outputPath);
    } else {
      // Process wallpaper (max 1920 width)
      await sharp(buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);
    }

    // Build FULL public URL (so it works from Vercel frontend too)
    const baseUrl = getBaseUrl();
    const publicUrl = `${baseUrl}/uploads/${filename}`;
    console.log(`[Upload] File saved: ${publicUrl}`);

    if (type === 'avatar') {
      await db.execute('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [publicUrl, req.user.id]);
    } else {
      await db.execute('UPDATE usuarios SET wallpaper_url = ? WHERE id = ?', [publicUrl, req.user.id]);
    }

    return res.json({ success: true, url: publicUrl, data: { url: publicUrl } });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar imagem: ' + error.message });
  }
});

export default router;

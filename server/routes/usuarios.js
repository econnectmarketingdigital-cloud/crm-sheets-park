import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const db = getDb();
  try {
    let query = "SELECT id, nome, email, telefone, role, COALESCE(sala, 'sao_luis') as sala, ativo, avatar_url, avatar_cor, disponivel_rodizio, pausado_rodizio, COALESCE(peso_salinas, 0) as peso_salinas, COALESCE(peso_santo_amaro, 1) as peso_santo_amaro FROM usuarios ORDER BY nome ASC";
    const usuarios = await db.query(query);
    res.json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  try {
    const user = await db.queryOne("SELECT id, nome, email, telefone, role, COALESCE(sala, 'sao_luis') as sala, ativo, avatar_url, avatar_cor FROM usuarios WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/sala', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { sala } = req.body;
  if (!['sao_luis', 'salinas', 'santo_amaro'].includes(sala)) {
    return res.status(400).json({ success: false, error: 'Sala inválida' });
  }
  try {
    await db.execute('UPDATE usuarios SET sala = ? WHERE id = ?', [sala, req.params.id]);
    res.json({ success: true, data: 'Sala atualizada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { nome, telefone, role, sala, wallpaper_url } = req.body;
  try {
    const userSala = ['sao_luis', 'salinas', 'santo_amaro'].includes(sala) ? sala : undefined;
    if (wallpaper_url !== undefined && userSala !== undefined) {
      await db.execute('UPDATE usuarios SET nome = ?, telefone = ?, role = ?, sala = ?, wallpaper_url = ? WHERE id = ?', [nome, telefone, role, userSala, wallpaper_url, req.params.id]);
    } else if (wallpaper_url !== undefined) {
      await db.execute('UPDATE usuarios SET nome = ?, telefone = ?, role = ?, wallpaper_url = ? WHERE id = ?', [nome, telefone, role, wallpaper_url, req.params.id]);
    } else if (userSala !== undefined) {
      await db.execute('UPDATE usuarios SET nome = ?, telefone = ?, role = ?, sala = ? WHERE id = ?', [nome, telefone, role, userSala, req.params.id]);
    } else {
      await db.execute('UPDATE usuarios SET nome = ?, telefone = ?, role = ? WHERE id = ?', [nome, telefone, role, req.params.id]);
    }
    res.json({ success: true, data: 'Atualizado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/ativo', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { ativo } = req.body; // true/false
  try {
    await db.execute('UPDATE usuarios SET ativo = ? WHERE id = ?', [ativo ? 1 : 0, req.params.id]);
    res.json({ success: true, data: 'Status atualizado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  try {
    await db.execute('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: 'Usuário excluído' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao excluir usuário: ' + error.message });
  }
});

export default router;

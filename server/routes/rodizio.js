import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', authenticateToken, async (req, res) => {
  const db = getDb();
  const configs = await db.query("SELECT * FROM configuracoes WHERE chave IN ('rodizio_ativo', 'rodizio_timeout_horas')");
  res.json({ success: true, data: configs });
});

router.put('/config', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { rodizio_ativo, rodizio_timeout_horas } = req.body;
  if (rodizio_ativo !== undefined) await db.execute("UPDATE configuracoes SET valor = ? WHERE chave = 'rodizio_ativo'", [(rodizio_ativo ? '1' : '0')]);
  if (rodizio_timeout_horas !== undefined) await db.execute("UPDATE configuracoes SET valor = ? WHERE chave = 'rodizio_timeout_horas'", [rodizio_timeout_horas.toString()]);
  res.json({ success: true, data: 'Atualizado' });
});

router.get('/corretores', authenticateToken, async (req, res) => {
  const db = getDb();
  const corretores = await db.query(`
    SELECT id, nome, email, role, disponivel_rodizio, pausado_rodizio, ativo,
           COALESCE(peso_salinas, 0) as peso_salinas,
           COALESCE(peso_santo_amaro, 1) as peso_santo_amaro
    FROM usuarios
    WHERE ativo = 1
    ORDER BY nome ASC
  `);
  res.json({ success: true, data: corretores });
});

router.put('/corretor/:id/pesos', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { peso_salinas, peso_santo_amaro } = req.body;
  if (peso_salinas !== undefined) {
    await db.execute("UPDATE usuarios SET peso_salinas = ? WHERE id = ?", [parseInt(peso_salinas, 10) || 0, req.params.id]);
  }
  if (peso_santo_amaro !== undefined) {
    await db.execute("UPDATE usuarios SET peso_santo_amaro = ? WHERE id = ?", [parseInt(peso_santo_amaro, 10) || 0, req.params.id]);
  }
  res.json({ success: true, data: 'Divisão de praças atualizada' });
});

router.put('/corretor/:id/pausar', authenticateToken, async (req, res) => {
  const db = getDb();
  const { pausar } = req.body; // true = offline, false = online
  // Corretor can change own status, Gestor can change anyone
  if (req.user.role !== 'gestor' && req.user.id !== req.params.id) {
    return res.status(403).json({ success: false, error: 'Sem permissÃ£o' });
  }
  await db.execute("UPDATE usuarios SET pausado_rodizio = ? WHERE id = ?",  [pausar ? 1 : 0, req.params.id]);
  res.json({ success: true, data: 'Status online atualizado' });
});

router.put('/corretor/:id/disponivel', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { disponivel } = req.body; // true = no plantÃ£o, false = fora do plantÃ£o
  await db.execute("UPDATE usuarios SET disponivel_rodizio = ? WHERE id = ?", [disponivel ? 1 : 0, req.params.id]);
  res.json({ success: true, data: 'PlantÃ£o atualizado' });
});

export default router;


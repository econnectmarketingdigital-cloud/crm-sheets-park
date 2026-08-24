import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const emp = await db.query(`
    SELECT e.*, 
      (SELECT COUNT(*) FROM unidades u WHERE u.empreendimento_id = e.id) as total_unidades_real,
      (SELECT COUNT(*) FROM unidades u WHERE u.empreendimento_id = e.id AND u.status = 'disponivel') as disponiveis,
      (SELECT COUNT(*) FROM unidades u WHERE u.empreendimento_id = e.id AND u.status = 'reservado') as reservadas,
      (SELECT COUNT(*) FROM unidades u WHERE u.empreendimento_id = e.id AND u.status = 'vendido') as vendidas
    FROM empreendimentos e
  `);
  res.json({ success: true, data: emp });
});

router.get('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const e = await db.query('SELECT * FROM empreendimentos WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ success: false, error: 'Não encontrado' });
  const blocos = await db.queryOne('SELECT * FROM blocos WHERE empreendimento_id = ?', [e.id]);
  res.json({ success: true, data: { ...e, blocos } });
});

router.post('/', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { nome, endereco, incorporadora, tipo, faixa_mcmv, valor_min, valor_max, comissao_percentual, descricao } = req.body;
  const id = uuidv4();
  await db.query(`
    INSERT INTO empreendimentos (id, nome, endereco, incorporadora, tipo, faixa_mcmv, valor_min, valor_max, comissao_percentual, descricao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, nome, endereco, incorporadora, tipo, faixa_mcmv, valor_min, valor_max, comissao_percentual, descricao);
  res.json({ success: true, data: { id } });
});

router.put('/:id', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { nome, endereco, incorporadora, tipo, faixa_mcmv, valor_min, valor_max, comissao_percentual, descricao } = req.body;
  await db.execute(`
    UPDATE empreendimentos SET nome=?, endereco=?, incorporadora=?, tipo=?, faixa_mcmv=?, valor_min=?, valor_max=?, comissao_percentual=?, descricao=?
    WHERE id=?
  `, [nome, endereco, incorporadora, tipo, faixa_mcmv, valor_min, valor_max, comissao_percentual, descricao, req.params.id]);
  res.json({ success: true, data: 'Atualizado' });
});

router.delete('/:id', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  await db.execute('DELETE FROM empreendimentos WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: 'Excluído' });
});

router.post('/:id/blocos', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const id = uuidv4();
  await db.execute('INSERT INTO blocos (id, empreendimento_id, nome) VALUES (?, ?, ?)', [id, req.params.id, req.body.nome]);
  res.json({ success: true, data: { id } });
});

router.get('/:id/unidades', authenticateToken, async (req, res) => {
  const db = getDb();
  const { status, bloco, tipologia } = req.query;
  let q = 'SELECT * FROM unidades WHERE empreendimento_id = ?';
  const params = [req.params.id];
  if (status) { q += ' AND status = ?'; params.push(status); }
  if (bloco) { q += ' AND bloco_id = ?'; params.push(bloco); }
  if (tipologia) { q += ' AND tipologia = ?'; params.push(tipologia); }
  
  const unidades = await db.execute(q, [...params]);
  res.json({ success: true, data: unidades });
});

// unidades routes directly exported or part of the same file since it's logical
router.post('/unidades', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { bloco_id, empreendimento_id, numero, tipologia, area_m2, valor, andar, posicao } = req.body;
  const id = uuidv4();
  await db.query(`
    INSERT INTO unidades (id, bloco_id, empreendimento_id, numero, tipologia, area_m2, valor, andar, posicao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, bloco_id, empreendimento_id, numero, tipologia, area_m2, valor, andar, posicao]);
  res.json({ success: true, data: { id } });
});

router.put('/unidades/:id', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { numero, tipologia, area_m2, valor, status, andar, posicao } = req.body;
  await db.execute(`
    UPDATE unidades SET numero=?, tipologia=?, area_m2=?, valor=?, status=?, andar=?, posicao=?
    WHERE id=?
  `, [numero, tipologia, area_m2, valor, status, andar, posicao, req.params.id]);
  res.json({ success: true, data: 'Atualizada' });
});

router.post('/unidades/:id/reservar', authenticateToken, async (req, res) => {
  const db = getDb();
  const { lead_id } = req.body;
  const unidade_id = req.params.id;
  const corretor_id = req.user.id;
  
  const u = await db.execute('SELECT status FROM unidades WHERE id = ?', [unidade_id]);
  if (!u || u.status !== 'disponivel') return res.status(400).json({ success: false, error: 'Unidade não disponível' });
  
  const config = await db.queryOne("SELECT valor FROM configuracoes WHERE chave = 'reserva_prazo_horas'");
  const horas = config ? parseInt(config.valor) : 48;
  
  const id = uuidv4();
  
  try {
    await db.execute('UPDATE unidades SET status = ? WHERE id = ?', ['reservado', unidade_id]);
    await db.execute(`
      INSERT INTO reservas (id, unidade_id, lead_id, corretor_id, status, prazo_expiracao)
      VALUES (?, ?, ?, ?, 'ativa', CURRENT_TIMESTAMP + INTERVAL '${horas} hours')
    `, [id, unidade_id, lead_id, corretor_id]);
    res.json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/unidades/:id/liberar', authenticateToken, async (req, res) => {
  const db = getDb();
  const unidade_id = req.params.id;
  try {
    await db.execute('UPDATE unidades SET status = ? WHERE id = ?', ['disponivel', unidade_id]);
    await db.execute("UPDATE reservas SET status = 'cancelada' WHERE unidade_id = ? AND status = 'ativa'", [unidade_id]);
    res.json({ success: true, data: 'Liberada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/unidades/matching', authenticateToken, async (req, res) => {
  const db = getDb();
  const { min, max, tipologia, empreendimento_id } = req.query;
  let q = "SELECT * FROM unidades WHERE status = 'disponivel'";
  const params = [];
  if (min) { q += ' AND valor >= ?'; params.push(min); }
  if (max) { q += ' AND valor <= ?'; params.push(max); }
  if (tipologia) { q += ' AND tipologia = ?'; params.push(tipologia); }
  if (empreendimento_id) { q += ' AND empreendimento_id = ?'; params.push(empreendimento_id); }
  
  const units = await db.query(q, params);
  res.json({ success: true, data: units });
});

export default router;

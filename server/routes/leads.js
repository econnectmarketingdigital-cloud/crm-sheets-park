import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { findExistingLead } from '../services/deduplicacao.js';
import { getNextCorretor } from '../services/rodizio.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const { etapa, origem, corretor_id, limit = 50, offset = 0 } = req.query;
  let query = `
    SELECT l.*, e.nome as empreendimento_nome, u.nome as corretor_nome
    FROM leads l
    LEFT JOIN empreendimentos e ON l.empreendimento_interesse_id = e.id
    LEFT JOIN usuarios u ON l.corretor_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'corretor') {
    query += ' AND l.corretor_id = ?';
    params.push(req.user.id);
  } else if (corretor_id) {
    query += ' AND l.corretor_id = ?';
    params.push(corretor_id);
  }

  if (etapa) { query += ' AND l.etapa = ?'; params.push(etapa); }
  if (origem) { query += ' AND l.origem = ?'; params.push(origem); }

  query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const leads = await db.query(query, [...params]);
  res.json({ success: true, data: leads });
});

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const { nome, telefone, email, origem = 'manual', campanha, anuncio, empreendimento_interesse_id, observacoes } = req.body;
  
  const existing = await findExistingLead(telefone, email);
  if (existing) {
    return res.status(400).json({ success: false, error: 'Lead jÃ¡ existe', data: existing });
  }

  const id = uuidv4();
  let corretorId = null;

  if (origem === 'manual') {
    corretorId = req.user.id;
  } else {
    corretorId = getNextCorretor(origem);
  }

  try {
    await db.query(`
      INSERT INTO leads (id, nome, telefone, email, origem, campanha, anuncio, corretor_id, empreendimento_interesse_id, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, nome, telefone, email, origem, campanha, anuncio, corretorId, empreendimento_interesse_id, observacoes);

    await db.queryOne(`INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, descricao) VALUES (?, ?, ?, 'criacao', 'Lead criado')`)
      .run(uuidv4(), id, corretorId);

    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const lead = await db.execute(`
    SELECT l.*, e.nome as empreendimento_nome, u.nome as corretor_nome 
    FROM leads l 
    LEFT JOIN empreendimentos e ON l.empreendimento_interesse_id = e.id 
    LEFT JOIN usuarios u ON l.corretor_id = u.id 
    WHERE l.id = ?
  `, [req.params.id]);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead nÃ£o encontrado' });
  
  if (req.user.role === 'corretor' && lead.corretor_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Acesso negado' });
  }
  
  res.json({ success: true, data: lead });
});

router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const lead = await db.queryOne('SELECT corretor_id FROM leads WHERE id = ?', [req.params.id]);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead nÃ£o encontrado' });
  if (req.user.role === 'corretor' && lead.corretor_id !== req.user.id) return res.status(403).json({ success: false, error: 'Acesso negado' });

  const { nome, telefone, email, observacoes } = req.body;
  try {
    await db.queryOne('UPDATE leads SET nome = ?, telefone = ?, email = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(nome, telefone, email, observacoes, req.params.id);
    res.json({ success: true, data: 'Atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/etapa', authenticateToken, async (req, res) => {
  const db = getDb();
  const lead = await db.queryOne('SELECT etapa, corretor_id FROM leads WHERE id = ?', [req.params.id]);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead nÃ£o encontrado' });
  if (req.user.role === 'corretor' && lead.corretor_id !== req.user.id) return res.status(403).json({ success: false, error: 'Acesso negado' });

  const { etapa, perdido_motivo } = req.body;
  if (etapa === 'perdido' && !perdido_motivo) return res.status(400).json({ success: false, error: 'Motivo de perda Ã© obrigatÃ³rio' });

  try {
    await db.execute('UPDATE leads SET etapa = ?, perdido_motivo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [etapa, perdido_motivo || null, req.params.id]);
    
    await db.execute(`INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, etapa_anterior, etapa_nova, descricao) VALUES (?, ?, ?, 'mudanca_etapa', ?, ?, 'Etapa alterada')`, [uuidv4(), req.params.id, req.user.id, lead.etapa, etapa]);
    
    res.json({ success: true, data: 'Etapa atualizada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/historico', authenticateToken, async (req, res) => {
  const db = getDb();
  const hist = await db.query('SELECT h.*, u.nome as corretor_nome FROM lead_historico h LEFT JOIN usuarios u ON h.corretor_id = u.id WHERE h.lead_id = ? ORDER BY h.created_at DESC', [req.params.id]);
  res.json({ success: true, data: hist });
});

router.post('/:id/notas', authenticateToken, async (req, res) => {
  const db = getDb();
  const { descricao } = req.body;
  try {
    await db.execute(`INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, descricao) VALUES (?, ?, ?, 'nota', ?)`, [uuidv4(), req.params.id, req.user.id, descricao]);
    res.json({ success: true, data: 'Nota adicionada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/venda', authenticateToken, async (req, res) => {
  const db = getDb();
  const { empreendimento_id, valor_venda } = req.body;
  const lead = await db.queryOne('SELECT corretor_id, etapa FROM leads WHERE id = ?', [req.params.id]);
  
  if (!lead) return res.status(404).json({ success: false, error: 'Lead nÃ£o encontrado' });
  if (req.user.role === 'corretor' && lead.corretor_id !== req.user.id) return res.status(403).json({ success: false, error: 'Acesso negado' });

  try {
    const unidadeId = uuidv4();
    await db.execute(`INSERT INTO unidades (id, empreendimento_id, numero, valor, status) VALUES (?, ?, 'N/D', ?, 'vendido')`, [unidadeId, empreendimento_id, valor_venda]);

    const propostaId = uuidv4();
    await db.execute(`INSERT INTO propostas (id, lead_id, unidade_id, corretor_id, valor_venda, status, data_fechamento) VALUES (?, ?, ?, ?, ?, 'aprovada', CURRENT_TIMESTAMP)`, [propostaId, req.params.id, unidadeId, lead.corretor_id, valor_venda]);

    await db.execute(`UPDATE leads SET etapa = 'fechado', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id]);

    const vgvFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor_venda);
    await db.execute(`INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, etapa_anterior, etapa_nova, descricao) VALUES (?, ?, ?, 'mudanca_etapa', ?, 'fechado', ?)`, [uuidv4(), req.params.id, req.user.id, lead.etapa, `Venda Registrada! VGV: ${vgvFormatado}`]);

    res.json({ success: true, data: 'Venda registrada com sucesso!' });
  } catch (error) {
    console.error('Erro na Venda:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;


import express from 'express';
import { getDb } from '../database.js';
import { findExistingLead } from '../services/deduplicacao.js';
import { getNextCorretor } from '../services/rodizio.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Meta Verification
router.get('/meta', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  // Hardcoded for now
  if (mode && token === 'my_verify_token') {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

const handleIncomingLead = (leadData, res) => {
  const db = getDb();
  const { nome, telefone, email, origem, campanha, empreendimento, faixa_renda, renda, observacoes } = leadData;
  const rendaFinal = faixa_renda || renda || null;
  
  // Acknowledge quickly
  res.status(200).json({ success: true });

  // Process async
  setTimeout(async () => {
    try {
      const existing = await findExistingLead(telefone, email);
      if (existing) {
        console.log(`Lead duplicado via webhook: ${telefone || email}`);
        return;
      }
      
      let empreendimentoId = null;
      if (empreendimento) {
        const emp = await db.queryOne('SELECT id FROM empreendimentos WHERE nome LIKE ?', [`%${empreendimento}%`]);
        if (emp) {
          empreendimentoId = emp.id;
        }
      }

      const corretorId = await getNextCorretor(origem) || null;
      const id = uuidv4();
      
      await db.execute(`
        INSERT INTO leads (id, nome, telefone, email, origem, campanha, faixa_renda, observacoes, corretor_id, empreendimento_interesse_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, nome, telefone, email, origem, campanha, rendaFinal, observacoes || null, corretorId, empreendimentoId]);
      
      await db.execute(`INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, descricao) VALUES (?, ?, ?, 'sistema', ?)`, [uuidv4(), id, corretorId, `Lead via Webhook ${origem}`]);
        
    } catch (e) {
      console.error('Webhook error:', e);
    }
  }, 0);
};

router.post('/meta', async (req, res) => {
  // Simplification: assume direct data for MVP
  const data = req.body;
  handleIncomingLead({ ...data, origem: 'meta_ads' }, res);
});

router.post('/google', async (req, res) => {
  const data = req.body;
  handleIncomingLead({ ...data, origem: 'google_ads' }, res);
});

router.post('/make', async (req, res) => {
  const data = req.body;
  handleIncomingLead({ ...data, origem: 'meta_ads' }, res);
});

export default router;

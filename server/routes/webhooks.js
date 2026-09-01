import express from 'express';
import { getDb } from '../database.js';
import { findExistingLead } from '../services/deduplicacao.js';
import { getNextCorretor } from '../services/rodizio.js';
import { notifyCorretorNewLead } from '../services/notification.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Meta Verification Token (configure em render ou use padrão)
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'sheetspark_meta_verify_2026';

// Meta Verification (GET)
router.get('/meta', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Meta Webhook] GET Verification Successful!');
    res.status(200).send(challenge);
  } else {
    console.error('[Meta Webhook] GET Verification Failed. Token:', token);
    res.sendStatus(403);
  }
});

const handleIncomingLead = async (leadData) => {
  const db = getDb();
  const { nome, telefone, email, origem, campanha, empreendimento, faixa_renda, renda, observacoes } = leadData;
  const rendaFinal = faixa_renda || renda || null;

  try {
    const existing = await findExistingLead(telefone, email);
    if (existing) {
      console.log(`[Webhook] Lead duplicado descartado: ${telefone || email}`);
      return;
    }
    
    let empreendimentoId = null;
    if (empreendimento) {
      // 1. Tenta match direto case-insensitive
      let emp = await db.queryOne('SELECT id FROM empreendimentos WHERE nome ILIKE ?', [`%${empreendimento}%`]);
      
      // 2. Se não achou, tenta por palavras-chave conhecidas (Residenciais, Comerciais, Beira-Rio)
      if (!emp) {
        const lower = empreendimento.toLowerCase();
        if (lower.includes('residencial') || lower.includes('residenciais')) {
          emp = await db.queryOne("SELECT id FROM empreendimentos WHERE nome ILIKE '%Residenciais%'");
        } else if (lower.includes('comercial') || lower.includes('comerciais')) {
          emp = await db.queryOne("SELECT id FROM empreendimentos WHERE nome ILIKE '%Comerciais%'");
        } else if (lower.includes('beira') || lower.includes('rio')) {
          emp = await db.queryOne("SELECT id FROM empreendimentos WHERE nome ILIKE '%Beira-Rio%'");
        }
      }

      if (emp) {
        empreendimentoId = emp.id;
      }
    }

    const corretorId = await getNextCorretor(origem) || null;
    const id = uuidv4();
    
    await db.execute(`
      INSERT INTO leads (id, nome, telefone, email, origem, campanha, faixa_renda, observacoes, corretor_id, empreendimento_interesse_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, nome, telefone, email, origem, campanha || 'Meta Ads', rendaFinal, observacoes || null, corretorId, empreendimentoId]);
    
    await db.execute(`INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, descricao) VALUES (?, ?, ?, 'sistema', ?)`, [uuidv4(), id, corretorId, `Lead via Webhook ${origem}`]);
    
    console.log(`[Webhook] ✅ Lead salvo no CRM com sucesso! (${nome} -> Corretor ID: ${corretorId})`);

    // Dispara notificação por e-mail para o corretor atribuído
    notifyCorretorNewLead(id).catch(err => console.error('[Webhook] Erro ao notificar corretor:', err));
      
  } catch (e) {
    console.error('[Webhook] Erro no processamento do lead:', e);
  }
};

// Função para buscar dados completos do lead direto na API do Graph do Facebook
async function fetchLeadFromGraphApi(leadgenId, pageToken) {
  try {
    const url = `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${pageToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('[Meta Graph API Error]:', data.error);
      return null;
    }

    let nome = 'Lead Meta Ads';
    let telefone = null;
    let email = null;
    let customObs = [];

    if (data.field_data && Array.isArray(data.field_data)) {
      for (const field of data.field_data) {
        const fieldName = field.name.toLowerCase();
        const value = field.values && field.values[0] ? field.values[0] : '';

        if (fieldName.includes('full_name') || fieldName.includes('nome')) {
          nome = value;
        } else if (fieldName.includes('phone') || fieldName.includes('whatsapp') || fieldName.includes('telefone')) {
          telefone = value;
        } else if (fieldName.includes('email')) {
          email = value;
        } else {
          customObs.push(`${field.name}: ${value}`);
        }
      }
    }

    // Tenta buscar informações do anúncio e campanha se ad_id estiver presente
    let campanha = 'Meta Lead Ads';
    let anuncio = null;

    if (data.ad_id && pageToken) {
      try {
        const adUrl = `https://graph.facebook.com/v20.0/${data.ad_id}?fields=name,campaign{name}&access_token=${pageToken}`;
        const adRes = await fetch(adUrl);
        const adData = await adRes.json();
        if (adData.name) anuncio = adData.name;
        if (adData.campaign && adData.campaign.name) campanha = adData.campaign.name;
      } catch (err) {
        // ignora falha secundária de busca de anúncio
      }
    }

    return {
      nome,
      telefone,
      email,
      campanha,
      empreendimento: anuncio || campanha,
      observacoes: customObs.length > 0 ? customObs.join(' | ') : null
    };
  } catch (err) {
    console.error('[Meta Graph API Fetch Exception]:', err.message);
    return null;
  }
}

// Meta Payload (POST) - Suporta tanto envio Direto do Meta quanto requisições simplificadas
router.post('/meta', async (req, res) => {
  const body = req.body;

  // Responde imediatamente com 200 OK para o Meta não considerar o servidor offline
  res.status(200).json({ success: true });

  // 1. Verificação se é um evento direto do Meta Webhook (payload oficial do Facebook)
  if (body.object === 'page' && Array.isArray(body.entry)) {
    console.log('[Meta Webhook] Recebido disparo direto do Meta!');

    const pageToken = process.env.META_PAGE_ACCESS_TOKEN;

    for (const entry of body.entry) {
      if (Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen' && change.value && change.value.leadgen_id) {
            const leadgenId = change.value.leadgen_id;
            console.log(`[Meta Webhook] Processando leadgen_id: ${leadgenId}`);

            if (pageToken) {
              const leadData = await fetchLeadFromGraphApi(leadgenId, pageToken);
              if (leadData) {
                await handleIncomingLead({ ...leadData, origem: 'meta_ads' });
              }
            } else {
              console.warn('[Meta Webhook] ⚠️ AVISO: META_PAGE_ACCESS_TOKEN não está configurado no Render. Não foi possível buscar o nome/telefone do lead via Graph API.');
            }
          }
        }
      }
    }
    return;
  }

  // 2. Se for payload formatado (do Make ou de um formulário simplificado)
  handleIncomingLead({ ...body, origem: 'meta_ads' });
});

router.post('/google', async (req, res) => {
  res.status(200).json({ success: true });
  handleIncomingLead({ ...req.body, origem: 'google_ads' });
});

router.post('/make', async (req, res) => {
  res.status(200).json({ success: true });
  handleIncomingLead({ ...req.body, origem: 'meta_ads' });
});

export default router;

import fs from 'fs';

function fixLeads() {
  let content = fs.readFileSync('routes/leads.js', 'utf8');
  content = content.replace(/await db\.queryOne\('UPDATE leads SET etapa = \?, perdido_motivo = \?, updated_at = CURRENT_TIMESTAMP WHERE id = \?'\)\s*\.run\(etapa, perdido_motivo \|\| null, req\.params\.id\);/, "await db.execute('UPDATE leads SET etapa = ?, perdido_motivo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [etapa, perdido_motivo || null, req.params.id]);");
  content = content.replace(/await db\.execute\(, \[\]\), req\.params\.id, req\.user\.id, lead\.etapa, etapa\]\);/, "await db.execute(\INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, etapa_anterior, etapa_nova, descricao) VALUES (?, ?, ?, 'mudanca_etapa', ?, ?, 'Etapa alterada')\, [uuidv4(), req.params.id, req.user.id, lead.etapa, etapa]);");
  content = content.replace(/await db\.execute\(, \[\]\), req\.params\.id, req\.user\.id, descricao\]\);/, "await db.execute(\INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, descricao) VALUES (?, ?, ?, 'nota', ?)\, [uuidv4(), req.params.id, req.user.id, descricao]);");
  content = content.replace(/await db\.execute\(, \[\]\), empreendimento_id, valor_venda\]\);/, "await db.execute(\INSERT INTO unidades (id, empreendimento_id, numero, valor, status) VALUES (?, ?, 'N/D', ?, 'vendido')\, [unidadeId, empreendimento_id, valor_venda]);");
  content = content.replace(/await db\.execute\(, \[\]\), req\.params\.id, unidadeId, lead\.corretor_id, valor_venda\]\);/, "await db.execute(\INSERT INTO propostas (id, lead_id, unidade_id, corretor_id, valor_venda, status, data_fechamento) VALUES (?, ?, ?, ?, ?, 'aprovada', CURRENT_TIMESTAMP)\, [propostaId, req.params.id, unidadeId, lead.corretor_id, valor_venda]);");
  content = content.replace(/await db\.execute\(, \[\]\), req\.params\.id, req\.user\.id, lead\.etapa, 'Venda Registrada! VGV: ' \+ vgvFormatado\]\);/, "await db.execute(\INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, etapa_anterior, etapa_nova, descricao) VALUES (?, ?, ?, 'mudanca_etapa', ?, 'fechado', ?)\, [uuidv4(), req.params.id, req.user.id, lead.etapa, 'Venda Registrada! VGV: ' + vgvFormatado]);");
  fs.writeFileSync('routes/leads.js', content, 'utf8');
}
fixLeads();

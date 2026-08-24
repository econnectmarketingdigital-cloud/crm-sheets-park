import fs from 'fs';

function fixLeads() {
  let content = fs.readFileSync('routes/leads.js', 'utf8');
  content = content.replace(/await db\.execute\(INSERT INTO lead_historico \(id, lead_id, corretor_id, tipo, descricao\) VALUES \(\?, \?, \?, 'nota', \?\),/g, "await db.execute(\INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, descricao) VALUES (?, ?, ?, 'nota', ?)\,");
  content = content.replace(/await db\.execute\(INSERT INTO unidades \(id, empreendimento_id, numero, valor, status\) VALUES \(\?, \?, 'N\/D', \?, 'vendido'\),/g, "await db.execute(\INSERT INTO unidades (id, empreendimento_id, numero, valor, status) VALUES (?, ?, 'N/D', ?, 'vendido')\,");
  content = content.replace(/await db\.execute\(INSERT INTO propostas \(id, lead_id, unidade_id, corretor_id, valor_venda, status, data_fechamento\) VALUES \(\?, \?, \?, \?, \?, 'aprovada', CURRENT_TIMESTAMP\),/g, "await db.execute(\INSERT INTO propostas (id, lead_id, unidade_id, corretor_id, valor_venda, status, data_fechamento) VALUES (?, ?, ?, ?, ?, 'aprovada', CURRENT_TIMESTAMP)\,");
  content = content.replace(/await db\.execute\(INSERT INTO lead_historico \(id, lead_id, corretor_id, tipo, etapa_anterior, etapa_nova, descricao\) VALUES \(\?, \?, \?, 'mudanca_etapa', \?, 'fechado', \?\),/g, "await db.execute(\INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, etapa_anterior, etapa_nova, descricao) VALUES (?, ?, ?, 'mudanca_etapa', ?, 'fechado', ?)\,");
  fs.writeFileSync('routes/leads.js', content, 'utf8');
}
fixLeads();

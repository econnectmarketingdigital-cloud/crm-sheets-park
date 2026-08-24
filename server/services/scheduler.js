import cron from 'node-cron';
import { getDb } from '../database.js';
import { getNextCorretor } from './rodizio.js';
import { v4 as uuidv4 } from 'uuid';

export const startScheduler = () => {
  cron.schedule('*/5 * * * *', async () => {
    const db = getDb();
    console.log('Running scheduled tasks...');
    try {
      const expiradas = await db.query(`
        SELECT r.id, r.unidade_id FROM reservas r
        WHERE r.status = 'ativa' AND r.prazo_expiracao <= CURRENT_TIMESTAMP
      `);

      for (const res of expiradas) {
        await db.execute("UPDATE reservas SET status = 'expirada' WHERE id = ?", [res.id]);
        await db.execute("UPDATE unidades SET status = 'disponivel' WHERE id = ?", [res.unidade_id]);
      }

      const slaConfig = await db.queryOne("SELECT valor FROM configuracoes WHERE chave = 'sla_redistribuicao_minutos'");
      const slaMinutos = slaConfig ? parseInt(slaConfig.valor, 10) : 30;

      const overdueLeads = await db.query(`
        SELECT id, origem, corretor_id FROM leads 
        WHERE etapa = 'novo' 
          AND origem != 'manual'
          AND created_at + (INTERVAL '1 minute' * ?) <= CURRENT_TIMESTAMP
      `, [slaMinutos]);

      for (const lead of overdueLeads) {
        await db.execute(`
          INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, descricao) 
          VALUES (?, ?, ?, 'sistema', ?)
        `, [uuidv4(), lead.id, lead.corretor_id, `Lead retirado por falta de atendimento no prazo de ${slaMinutos} min.`]);

        const newCorretorId = await getNextCorretor(lead.origem);
        
        if (newCorretorId && newCorretorId !== lead.corretor_id) {
          await db.execute(`
            UPDATE leads 
            SET corretor_id = ?, updated_at = CURRENT_TIMESTAMP, created_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newCorretorId, lead.id]);

          await db.execute(`
            INSERT INTO lead_historico (id, lead_id, corretor_id, tipo, descricao) 
            VALUES (?, ?, ?, 'sistema', 'Lead redistribuído automaticamente para novo corretor.')
          `, [uuidv4(), lead.id, newCorretorId]);
        }
      }
    } catch (error) {
      console.error('Error in scheduler:', error);
    }
  });
};

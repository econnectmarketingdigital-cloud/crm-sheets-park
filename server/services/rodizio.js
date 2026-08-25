import { getDb } from '../database.js';

export const isRodizioAtivo = async () => {
  const db = getDb();
  const config = await db.queryOne("SELECT valor FROM configuracoes WHERE chave = 'rodizio_ativo'");
  return config && config.valor === 'true';
};

export const getNextCorretor = async (origem) => {
  const db = getDb();
  if (!(await isRodizioAtivo())) return null;

  // Get active, available, not paused corretors
  const corretores = await db.query(`
    SELECT id FROM usuarios 
    WHERE ativo = 1 AND disponivel_rodizio = 1 AND pausado_rodizio = 0
    ORDER BY id
  `);

  if (corretores.length === 0) return null;

  const estado = await db.queryOne('SELECT ultimo_corretor_id FROM rodizio_estado WHERE origem = ?', [origem]);
  
  let nextCorretor = null;

  if (!estado || !estado.ultimo_corretor_id) {
    nextCorretor = corretores[0];
  } else {
    const currentIndex = corretores.findIndex(c => c.id === estado.ultimo_corretor_id);
    if (currentIndex === -1 || currentIndex === corretores.length - 1) {
      nextCorretor = corretores[0];
    } else {
      nextCorretor = corretores[currentIndex + 1];
    }
  }

  // Update pointer
  await db.execute(`
    INSERT INTO rodizio_estado (id, origem, ultimo_corretor_id, updated_at) 
    VALUES (gen_random_uuid(), ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(origem) DO UPDATE SET ultimo_corretor_id = ?, updated_at = CURRENT_TIMESTAMP
  `, [origem, nextCorretor.id, nextCorretor.id]);

  return nextCorretor.id;
};

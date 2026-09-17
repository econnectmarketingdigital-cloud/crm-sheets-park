import { getDb } from '../database.js';

export const isRodizioAtivo = async () => {
  const db = getDb();
  const config = await db.queryOne("SELECT valor FROM configuracoes WHERE chave = 'rodizio_ativo'");
  return config && (config.valor === 'true' || config.valor === '1');
};

export const getNextCorretor = async (origem) => {
  const db = getDb();
  if (!(await isRodizioAtivo())) return null;

  // Busca corretores ativos, disponíveis e não pausados com seus respectivos pesos
  const corretores = await db.query(`
    SELECT id, nome, COALESCE(peso_rodizio, 1) as peso FROM usuarios 
    WHERE ativo = 1 AND disponivel_rodizio = 1 AND pausado_rodizio = 0
    ORDER BY peso DESC, nome ASC
  `);

  if (corretores.length === 0) return null;

  // Monta fila balanceada intercalando por peso
  const maxPeso = Math.max(...corretores.map(c => c.peso));
  const fila = [];
  for (let round = 1; round <= maxPeso; round++) {
    for (const c of corretores) {
      if (c.peso >= round) {
        fila.push(c);
      }
    }
  }

  if (fila.length === 0) return null;

  const estado = await db.queryOne('SELECT posicao, ultimo_corretor_id FROM rodizio_estado WHERE origem = ?', [origem]);

  let nextIndex = 0;
  if (estado && estado.posicao !== undefined && estado.posicao !== null) {
    nextIndex = (estado.posicao + 1) % fila.length;
  }

  const nextCorretor = fila[nextIndex];

  // Atualiza ponteiro da posição e último corretor
  await db.execute(`
    INSERT INTO rodizio_estado (id, origem, ultimo_corretor_id, posicao, updated_at) 
    VALUES (gen_random_uuid(), ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(origem) DO UPDATE SET 
      ultimo_corretor_id = EXCLUDED.ultimo_corretor_id,
      posicao = EXCLUDED.posicao,
      updated_at = CURRENT_TIMESTAMP
  `, [origem, nextCorretor.id, nextIndex]);

  return nextCorretor.id;
};

import { getDb } from '../database.js';

export const isRodizioAtivo = async () => {
  const db = getDb();
  const config = await db.queryOne("SELECT valor FROM configuracoes WHERE chave = 'rodizio_ativo'");
  return config && (config.valor === 'true' || config.valor === '1');
};

export const getSalasAtivas = async () => {
  const db = getDb();
  const rows = await db.query("SELECT chave, valor FROM configuracoes WHERE chave IN ('sala_sao_luis_ativa', 'sala_salinas_ativa', 'sala_santo_amaro_ativa')");
  const map = {
    sao_luis: true,
    salinas: true,
    santo_amaro: true
  };
  for (const r of rows) {
    const isAtiva = r.valor === '1' || r.valor === 'true';
    if (r.chave === 'sala_sao_luis_ativa') map.sao_luis = isAtiva;
    if (r.chave === 'sala_salinas_ativa') map.salinas = isAtiva;
    if (r.chave === 'sala_santo_amaro_ativa') map.santo_amaro = isAtiva;
  }
  return Object.entries(map).filter(([, ativa]) => ativa).map(([sala]) => sala);
};

export const normalizeSala = (rawSala) => {
  if (!rawSala) return null;
  const s = String(rawSala).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes('salinas')) return 'salinas';
  if (s.includes('amaro')) return 'santo_amaro';
  if (s.includes('luis') || s.includes('luiz') || s.includes('slz')) return 'sao_luis';
  return null;
};

export const getNextCorretor = async (origem, campanha = '', salaExplicit = null) => {
  const db = getDb();
  if (!(await isRodizioAtivo())) return null;

  const isSalinas = (campanha || '').toLowerCase().includes('salinas');
  const produtoKey = isSalinas ? 'salinas' : 'santo_amaro';
  const pesoCol = isSalinas ? 'peso_salinas' : 'peso_santo_amaro';

  const targetSala = normalizeSala(salaExplicit);
  const salasAtivas = await getSalasAtivas();

  // Define quais salas podem receber o lead:
  // 1) Se o webhook informou explicitamente a sala ("sala": "salinas"), direciona para essa sala
  // 2) Caso contrário, direciona apenas para os corretores das salas que estão ATIVAS no painel de Rodízio
  const salasPermitidas = targetSala
    ? [targetSala]
    : (salasAtivas.length > 0 ? salasAtivas : ['sao_luis', 'salinas', 'santo_amaro']);

  // Se sao_luis estiver nas salas permitidas, inclui tambem usuarios com sala='todas' que participam do rodizio de Sao Luis
  const salasBusca = salasPermitidas.includes('sao_luis') && !targetSala
    ? [...salasPermitidas, 'todas']
    : (targetSala === 'sao_luis' ? ['sao_luis', 'todas'] : salasPermitidas);

  const placeholders = salasBusca.map(() => '?').join(', ');

  // Busca corretores ativos, disponíveis, não pausados, pertencentes às salas ativas e com peso > 0 no produto
  let corretores = await db.query(`
    SELECT id, nome, COALESCE(sala, 'sao_luis') as sala, COALESCE(${pesoCol}, 0) as peso
    FROM usuarios 
    WHERE ativo = 1 
      AND disponivel_rodizio = 1 
      AND pausado_rodizio = 0 
      AND COALESCE(sala, 'sao_luis') IN (${placeholders})
      AND COALESCE(${pesoCol}, 0) > 0
    ORDER BY peso DESC, nome ASC
  `, salasBusca);

  // Fallback 1: Corretores disponíveis nas salas permitidas mesmo que não tenham peso específico daquele produto configurado
  if (corretores.length === 0) {
    corretores = await db.query(`
      SELECT id, nome, COALESCE(sala, 'sao_luis') as sala, COALESCE(peso_rodizio, 1) as peso
      FROM usuarios 
      WHERE ativo = 1 
        AND disponivel_rodizio = 1 
        AND pausado_rodizio = 0
        AND COALESCE(sala, 'sao_luis') IN (${placeholders})
      ORDER BY peso DESC, nome ASC
    `, salasBusca);
  }

  // Fallback 2 de segurança:
  // Se o fluxo veio vinculado a uma Sala específica (targetSala), NUNCA envia para outra sala (busca qualquer corretor ativo dessa mesma sala).
  if (corretores.length === 0) {
    if (targetSala) {
      corretores = await db.query(`
        SELECT id, nome, COALESCE(sala, 'sao_luis') as sala, COALESCE(peso_rodizio, 1) as peso
        FROM usuarios 
        WHERE ativo = 1 AND COALESCE(sala, 'sao_luis') = ?
        ORDER BY disponivel_rodizio DESC, pausado_rodizio ASC, nome ASC
      `, [targetSala]);
    } else {
      corretores = await db.query(`
        SELECT id, nome, COALESCE(sala, 'sao_luis') as sala, COALESCE(peso_rodizio, 1) as peso
        FROM usuarios 
        WHERE ativo = 1 AND disponivel_rodizio = 1 AND pausado_rodizio = 0
        ORDER BY peso DESC, nome ASC
      `);
    }
  }

  if (corretores.length === 0) return null;

  // Monta fila balanceada intercalando por peso
  const maxPeso = Math.max(...corretores.map(c => Math.max(c.peso, 1)));
  const fila = [];
  for (let round = 1; round <= maxPeso; round++) {
    for (const c of corretores) {
      if (Math.max(c.peso, 1) >= round) {
        fila.push(c);
      }
    }
  }

  if (fila.length === 0) return null;

  const filaKey = targetSala ? `${targetSala}_${produtoKey}` : produtoKey;
  const estado = await db.queryOne('SELECT posicao, ultimo_corretor_id FROM rodizio_estado WHERE origem = ?', [filaKey]);

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
  `, [filaKey, nextCorretor.id, nextIndex]);

  console.log(`[Rodízio ${filaKey.toUpperCase()}] Lead distribuído para: ${nextCorretor.nome} [Sala: ${nextCorretor.sala}] (Posição ${nextIndex + 1}/${fila.length})`);
  return nextCorretor.id;
};

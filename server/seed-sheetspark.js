import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const dbPassword = process.env.DB_PASSWORD || 'Sheetspark2026';

async function seedThreeEmpreendimentos() {
  const client = new pg.Client({
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.xrsfqktxavdrjoduclma',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('⚡ Conectado ao Supabase para recriar os 3 Loteamentos separados...');

  try {
    // 1. Limpar unidades, blocos e empreendimentos anteriores
    await client.query('DELETE FROM unidades');
    await client.query('DELETE FROM blocos');
    await client.query('DELETE FROM empreendimentos');
    console.log('🧹 Tabelas limpas!');

    // 2. Empreendimento 1: Lotes Residenciais (R$ 20.000)
    const empResidencialId = uuidv4();
    await client.query(`
      INSERT INTO empreendimentos (id, nome, endereco, incorporadora, tipo, valor_min, valor_max, total_unidades, descricao)
      VALUES ($1, 'Lotes Residenciais - Sheets Park', 'Área Residencial do Loteamento Sheets Park', 'Sheets Park Urbanismo', 'Residencial', 20000, 20000, 20, 'Lotes residenciais ideais para construção da sua casa própria ou investimento seguro com infraestrutura completa.')
    `, [empResidencialId]);

    const blocoResA = uuidv4();
    const blocoResB = uuidv4();
    await client.query(`
      INSERT INTO blocos (id, empreendimento_id, nome) VALUES
      ($1, $2, 'Quadra Residencial A'),
      ($3, $2, 'Quadra Residencial B')
    `, [blocoResA, empResidencialId, blocoResB]);

    for (let i = 1; i <= 10; i++) {
      const num = `Lote A-${String(i).padStart(2, '0')}`;
      const status = i === 1 ? 'vendido' : i === 2 ? 'reservado' : 'disponivel';
      await client.query(`
        INSERT INTO unidades (id, bloco_id, empreendimento_id, numero, tipologia, area_m2, valor, status)
        VALUES ($1, $2, $3, $4, 'Residencial 200m²', 200, 20000, $5)
      `, [uuidv4(), blocoResA, empResidencialId, num, status]);
    }
    for (let i = 1; i <= 10; i++) {
      const num = `Lote B-${String(i).padStart(2, '0')}`;
      const status = i === 3 ? 'reservado' : 'disponivel';
      await client.query(`
        INSERT INTO unidades (id, bloco_id, empreendimento_id, numero, tipologia, area_m2, valor, status)
        VALUES ($1, $2, $3, $4, 'Residencial 200m²', 200, 20000, $5)
      `, [uuidv4(), blocoResB, empResidencialId, num, status]);
    }

    // 3. Empreendimento 2: Lotes Comerciais (R$ 25.000)
    const empComercialId = uuidv4();
    await client.query(`
      INSERT INTO empreendimentos (id, nome, endereco, incorporadora, tipo, valor_min, valor_max, total_unidades, descricao)
      VALUES ($1, 'Lotes Comerciais - Sheets Park', 'Avenida Principal do Loteamento Sheets Park', 'Sheets Park Urbanismo', 'Comercial', 25000, 25000, 10, 'Lotes comerciais em localização estratégica de alto fluxo, perfeitos para comércios, lojas, clínicas e serviços.')
    `, [empComercialId]);

    const blocoCom = uuidv4();
    await client.query(`
      INSERT INTO blocos (id, empreendimento_id, nome) VALUES ($1, $2, 'Quadra Comercial Central')
    `, [blocoCom, empComercialId]);

    for (let i = 1; i <= 10; i++) {
      const num = `Lote COM-${String(i).padStart(2, '0')}`;
      const status = i === 1 ? 'reservado' : 'disponivel';
      await client.query(`
        INSERT INTO unidades (id, bloco_id, empreendimento_id, numero, tipologia, area_m2, valor, status)
        VALUES ($1, $2, $3, $4, 'Comercial 250m²', 250, 25000, $5)
      `, [uuidv4(), blocoCom, empComercialId, num, status]);
    }

    // 4. Empreendimento 3: Lotes Beira-Rio (R$ 100.000)
    const empBeiraRioId = uuidv4();
    await client.query(`
      INSERT INTO empreendimentos (id, nome, endereco, incorporadora, tipo, valor_min, valor_max, total_unidades, descricao)
      VALUES ($1, 'Lotes Beira-Rio - Sheets Park', 'Orla e Margem do Rio - Sheets Park', 'Sheets Park Urbanismo', 'Beira-Rio', 100000, 100000, 10, 'Lotes nobres e exclusivos beira-rio com 500m², contato direto com a natureza, lazer aquático e vista privilegiada.')
    `, [empBeiraRioId]);

    const blocoBR = uuidv4();
    await client.query(`
      INSERT INTO blocos (id, empreendimento_id, nome) VALUES ($1, $2, 'Setor Beira-Rio Orla')
    `, [blocoBR, empBeiraRioId]);

    for (let i = 1; i <= 10; i++) {
      const num = `Lote BR-${String(i).padStart(2, '0')}`;
      const status = i === 1 ? 'vendido' : 'disponivel';
      await client.query(`
        INSERT INTO unidades (id, bloco_id, empreendimento_id, numero, tipologia, area_m2, valor, status)
        VALUES ($1, $2, $3, $4, 'Beira-Rio 500m²', 500, 100000, $5)
      `, [uuidv4(), blocoBR, empBeiraRioId, num, status]);
    }

    console.log('✅ 3 Empreendimentos criados com sucesso:');
    console.log('   1. Lotes Residenciais (R$ 20.000 - 20 lotes)');
    console.log('   2. Lotes Comerciais (R$ 25.000 - 10 lotes)');
    console.log('   3. Lotes Beira-Rio (R$ 100.000 - 10 lotes)');

  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    await client.end();
  }
}

seedThreeEmpreendimentos();

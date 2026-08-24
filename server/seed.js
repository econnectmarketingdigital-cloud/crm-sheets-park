import { initDatabase, getDb } from './database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seed = async () => {
  await initDatabase();
  const db = getDb();
  try {
    // Configuracoes
    const configs = [
      { chave: 'rodizio_ativo', valor: 'true' },
      { chave: 'rodizio_timeout_horas', valor: '2' },
      { chave: 'reserva_prazo_horas', valor: '48' },
      { chave: 'alerta_sem_contato_horas', valor: '2' },
      { chave: 'meta_vgv_equipe', valor: '10000000' }
    ];
    
    const stmtConfig = db.prepare('INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)');
    for (const c of configs) stmtConfig.run(c.chave, c.valor);

    // Usuarios
    const gestorId = uuidv4();
    db.prepare(`
      INSERT INTO usuarios (id, nome, email, senha_hash, role)
      VALUES (?, 'Marcela Lopes', 'gestor@marcelaloopes.com.br', ?, 'gestor')
    `).run(gestorId, bcrypt.hashSync('admin123', 10));

    const corretor1 = uuidv4();
    const corretor2 = uuidv4();
    const corretor3 = uuidv4();
    
    const stmtUser = db.prepare(`
      INSERT INTO usuarios (id, nome, email, senha_hash, role)
      VALUES (?, ?, ?, ?, 'corretor')
    `);
    stmtUser.run(corretor1, 'Ana Silva', 'ana@marcelaloopes.com.br', bcrypt.hashSync('corretor123', 10));
    stmtUser.run(corretor2, 'João Santos', 'joao@marcelaloopes.com.br', bcrypt.hashSync('corretor123', 10));
    stmtUser.run(corretor3, 'Maria Costa', 'maria@marcelaloopes.com.br', bcrypt.hashSync('corretor123', 10));

    // Empreendimentos Canops
    const empreendimentos = [
      {
        id: uuidv4(),
        nome: 'Village das Águas 2',
        endereco: 'Região da Forquilha / Maioba (São Luís / Paço do Lumiar)',
        incorporadora: 'Canops',
        tipo: 'mcmv',
        descricao: 'Apartamentos de 40m² com 2 quartos, sala de estar e jantar integradas, banheiro social e cozinha. Condomínio fechado com segurança e área de lazer completa, incluindo academia, churrasqueira, piscina e salão de festas. Enquadrado no programa Minha Casa Minha Vida.'
      },
      {
        id: uuidv4(),
        nome: 'Village Del Ville 2',
        endereco: 'Sede de Paço do Lumiar, próximo aos empreendimentos Plaza das Flores e Villa Adagio.',
        incorporadora: 'Canops',
        tipo: 'mcmv',
        descricao: 'Condomínio fechado de casas com quintal. A casa padrão possui terreno de 125m² e área construída de 41,81m², com 2 quartos e um projeto que permite ampliação para 3 quartos. Conta com lazer de clube (piscinas, campo gramado, quadra de beach tennis, coworking) e o grande diferencial de um Mini Market exclusivo 24 horas em estrutura de alvenaria.'
      },
      {
        id: uuidv4(),
        nome: 'Village Natureza 2',
        endereco: 'Maiobão (Paço do Lumiar), a 900 metros do Shopping Pátio Norte e 600 metros da MA-201.',
        incorporadora: 'Canops',
        tipo: 'mcmv',
        descricao: 'Apartamentos de 40m² com 2 quartos. O grande destaque são as unidades no térreo com opção de "Garden", uma área privativa adicional na varanda de 17m² estilo quintal. Área de lazer completa com piscina, petplay, horta, coworking e academia aberta.'
      },
      {
        id: uuidv4(),
        nome: 'Village Parque Ville',
        endereco: 'Entrada do Turiúba (São José de Ribamar).',
        incorporadora: 'Canops',
        tipo: 'mcmv',
        descricao: 'Novo condomínio fechado horizontal composto por 475 casas com quintal e garagem privativa. Focado em unir tranquilidade, mobilidade e segurança, oferecendo estrutura completa com parcelas acessíveis para quem busca sair do aluguel.'
      },
      {
        id: uuidv4(),
        nome: 'Village Prime Eldorado',
        endereco: 'Rua Eurípedes Bezerra, na divisa entre a Cohama e o Turu (São Luís).',
        incorporadora: 'Canops',
        tipo: 'planta',
        descricao: 'Projeto moderno composto por 5 torres residenciais (térreo + 9 andares) com 2 elevadores por torre. Apartamentos de 42,16m² a 43,50m² com 2 quartos e piso em porcelanato. Lazer super completo e diferenciado que inclui sauna, SPA, Car Wash e vaga com infraestrutura para carregamento de carro elétrico.'
      },
      {
        id: uuidv4(),
        nome: 'Village Reserva 2',
        endereco: 'Conjunto Maiobão / Região do Cohatrac (Paço do Lumiar), a 1.200 metros do Shopping Passeio e ao lado da Reserva do Itapiracó.',
        incorporadora: 'Canops',
        tipo: 'mcmv',
        descricao: 'Apartamentos de 40m² com 2 quartos. Ideal para clientes que buscam estar conectados à natureza sem perder a facilidade comercial da região, com condomínio fechado que dispõe de lazer completo e segurança.'
      },
      {
        id: uuidv4(),
        nome: 'Vila dos Ventos 2',
        endereco: 'Complexo Village dos Pássaros, a 600 metros da MA-201, próximo ao Wang Park.',
        incorporadora: 'Canops',
        tipo: 'mcmv',
        descricao: 'Apartamentos de 40m² com 2 quartos. Empreendimento econômico consolidado com foco no melhor custo-benefício, entregando 10 itens de lazer estilo clube em um ambiente de condomínio fechado e seguro.'
      },
      {
        id: uuidv4(),
        nome: 'Village Connect 1',
        endereco: 'Região estratégica entre o Turu e Araçagi / Jardim Eldorado.',
        incorporadora: 'Canops',
        tipo: 'planta',
        descricao: 'Um grande lançamento da construtora composto por 464 unidades. Apartamentos de 2 quartos em um condomínio com área de lazer completa. O projeto foi desenhado para conectar os moradores e facilitar o acesso rápido à casa própria com condições flexíveis.'
      },
      {
        id: uuidv4(),
        nome: 'Village das Estrelas',
        endereco: 'Região do Ubatuba / Laranjal (São José de Ribamar), a 400 metros da MA-201.',
        incorporadora: 'Canops',
        tipo: 'mcmv',
        descricao: 'Apartamentos de 40,94m² com 2 quartos. As torres contam com fachada moderna em platibanda (telhado não aparente). O condomínio clube possui guarita para controle de acesso, piscina, academia interna, campo de futebol, praça de piquenique, petplace e espaço para horta e pomar.'
      }
    ];

    const stmtEmp = db.prepare(`
      INSERT INTO empreendimentos (id, nome, endereco, incorporadora, tipo, descricao)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const emp of empreendimentos) {
      stmtEmp.run(emp.id, emp.nome, emp.endereco, emp.incorporadora, emp.tipo, emp.descricao);
    }

    // Units
    const stmtUnidade = db.prepare(`
      INSERT INTO unidades (id, bloco_id, empreendimento_id, numero, tipologia, area_m2, valor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Add a dummy unit for the first empreendimento so proposals can be created
    const firstUnitId = uuidv4();
    const firstEmpId = empreendimentos[0].id;
    stmtUnidade.run(firstUnitId, null, firstEmpId, '101', '2 quartos', 40, 180000);

    // Leads
    const stmtLead = db.prepare(`
      INSERT INTO leads (id, nome, telefone, email, etapa, corretor_id, origem, empreendimento_interesse_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const corretores = [corretor1, corretor2, corretor3];
    const etapas = ['novo', 'contato_feito', 'visita_agendada', 'proposta', 'documentacao', 'fechado', 'perdido'];
    
    let leadIds = [];
    for (let i = 1; i <= 15; i++) {
      const lId = uuidv4();
      leadIds.push(lId);
      const cId = corretores[i % 3];
      const etapa = etapas[i % 7];
      stmtLead.run(lId, `Lead Teste ${i}`, `119999900${i < 10 ? '0'+i : i}`, `lead${i}@teste.com`, etapa, cId, 'meta_ads', empreendimentos[i % empreendimentos.length].id);
    }
    
    // Propostas and Historico
    const propId = uuidv4();
    db.prepare(`
      INSERT INTO propostas (id, lead_id, unidade_id, corretor_id, valor_venda, status, data_fechamento)
      VALUES (?, ?, ?, ?, ?, 'aprovada', CURRENT_TIMESTAMP)
    `).run(propId, leadIds[5], firstUnitId, corretores[2], 180000);

    // Metas
    db.prepare(`
      INSERT INTO metas (id, tipo, valor_meta, mes, ano)
      VALUES (?, 'vgv', 10000000, cast(strftime('%m', 'now') as integer), cast(strftime('%Y', 'now') as integer))
    `).run(uuidv4());

    console.log('Seed executado com sucesso!');
  } catch (error) {
    console.error('Erro no seed:', error);
  }
};

seed();

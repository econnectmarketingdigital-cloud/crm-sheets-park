import pg from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const { Client } = pg;
const dbPassword = process.env.DB_PASSWORD || 'Sheetspark2026';
const connectionString = `postgresql://postgres:${dbPassword}@db.xrsfqktxavdrjoduclma.supabase.co:5432/postgres`;

async function migrate() {
  const client = new Client({
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.xrsfqktxavdrjoduclma',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('⚡ Conectado ao Supabase para migração...');

  try {
    // 1. Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave VARCHAR(100) PRIMARY KEY,
        valor TEXT
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(50) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        telefone VARCHAR(50),
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'corretor',
        ativo INT DEFAULT 1,
        disponivel_rodizio INT DEFAULT 1,
        pausado_rodizio INT DEFAULT 0,
        meta_vgv_pessoal NUMERIC DEFAULT 0,
        avatar_cor VARCHAR(50),
        wallpaper_url TEXT,
        wallpaper_position TEXT DEFAULT 'center center',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS empreendimentos (
        id VARCHAR(50) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        endereco TEXT,
        incorporadora VARCHAR(255),
        tipo VARCHAR(50) NOT NULL,
        faixa_mcmv VARCHAR(50),
        valor_min NUMERIC,
        valor_max NUMERIC,
        comissao_percentual NUMERIC DEFAULT 5.0,
        total_unidades INT DEFAULT 0,
        descricao TEXT,
        ativo INT DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS blocos (
        id VARCHAR(50) PRIMARY KEY,
        empreendimento_id VARCHAR(50) REFERENCES empreendimentos(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS unidades (
        id VARCHAR(50) PRIMARY KEY,
        bloco_id VARCHAR(50) REFERENCES blocos(id) ON DELETE SET NULL,
        empreendimento_id VARCHAR(50) REFERENCES empreendimentos(id) ON DELETE CASCADE,
        numero VARCHAR(50) NOT NULL,
        tipologia VARCHAR(100),
        area_m2 NUMERIC,
        valor NUMERIC,
        status VARCHAR(50) DEFAULT 'disponivel',
        andar INT,
        posicao VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(50) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(50),
        email VARCHAR(255),
        origem VARCHAR(50) DEFAULT 'manual',
        campanha VARCHAR(255),
        anuncio VARCHAR(255),
        corretor_id VARCHAR(50) REFERENCES usuarios(id) ON DELETE SET NULL,
        etapa VARCHAR(50) DEFAULT 'novo',
        empreendimento_interesse_id VARCHAR(50) REFERENCES empreendimentos(id) ON DELETE SET NULL,
        observacoes TEXT,
        ultimo_contato TIMESTAMP WITH TIME ZONE,
        proximo_followup TIMESTAMP WITH TIME ZONE,
        perdido_motivo TEXT,
        faixa_renda VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lead_historico (
        id VARCHAR(50) PRIMARY KEY,
        lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE,
        corretor_id VARCHAR(50) REFERENCES usuarios(id) ON DELETE SET NULL,
        tipo VARCHAR(50),
        descricao TEXT,
        etapa_anterior VARCHAR(50),
        etapa_nova VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reservas (
        id VARCHAR(50) PRIMARY KEY,
        unidade_id VARCHAR(50) REFERENCES unidades(id) ON DELETE CASCADE,
        lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE,
        corretor_id VARCHAR(50) REFERENCES usuarios(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'ativa',
        prazo_expiracao TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS propostas (
        id VARCHAR(50) PRIMARY KEY,
        lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE,
        unidade_id VARCHAR(50) REFERENCES unidades(id) ON DELETE SET NULL,
        corretor_id VARCHAR(50) REFERENCES usuarios(id) ON DELETE SET NULL,
        valor_venda NUMERIC,
        comissao_valor NUMERIC,
        status VARCHAR(50) DEFAULT 'em_analise',
        data_proposta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data_fechamento TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS rodizio_estado (
        id VARCHAR(50) PRIMARY KEY,
        origem VARCHAR(50) UNIQUE NOT NULL,
        ultimo_corretor_id VARCHAR(50) REFERENCES usuarios(id) ON DELETE SET NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS metas (
        id VARCHAR(50) PRIMARY KEY,
        corretor_id VARCHAR(50) REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(50) DEFAULT 'vgv',
        valor_meta NUMERIC NOT NULL,
        mes INT NOT NULL,
        ano INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Todas as tabelas criadas no Supabase com sucesso!');

    // 2. Insert Default Configurations
    const configs = [
      ['rodizio_ativo', 'true'],
      ['rodizio_timeout_horas', '2'],
      ['reserva_prazo_horas', '48'],
      ['sla_redistribuicao_minutos', '30'],
      ['meta_vgv_equipe', '10000000']
    ];
    for (const [chave, valor] of configs) {
      await client.query(
        'INSERT INTO configuracoes (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO NOTHING',
        [chave, valor]
      );
    }

    // 3. Insert Users (Gestores & Admins)
    const defaultUsers = [
      { nome: 'Administrador Sheets Park', email: 'admin@sheetspark.com.br', role: 'gestor', pass: 'admin123' },
      { nome: 'Gestor Sheets Park', email: 'gestor@sheetspark.com.br', role: 'gestor', pass: 'admin123' },
      { nome: 'Gabriel Lucas', email: 'ogabriellucaz08@gmail.com', role: 'gestor', pass: 'admin123' },
      { nome: 'Marcela Lopes', email: 'marcelalopesf@gmail.com', role: 'gestor', pass: 'admin123' },
      { nome: 'Agência eConnect', email: 'econnectmarketingdigital@gmail.com', role: 'gestor', pass: 'admin123' },
      { nome: 'Agência iConnect', email: 'iconnectmarketingdigital@gmail.com', role: 'gestor', pass: 'admin123' },
      { nome: 'Ana Silva', email: 'ana@sheetspark.com.br', role: 'corretor', pass: 'corretor123' },
      { nome: 'João Santos', email: 'joao@sheetspark.com.br', role: 'corretor', pass: 'corretor123' },
      { nome: 'Maria Costa', email: 'maria@sheetspark.com.br', role: 'corretor', pass: 'corretor123' }
    ];

    for (const u of defaultUsers) {
      await client.query(`
        INSERT INTO usuarios (id, nome, email, senha_hash, role, ativo, disponivel_rodizio)
        VALUES ($1, $2, $3, $4, $5, 1, $6)
        ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, ativo = 1;
      `, [uuidv4(), u.nome, u.email.toLowerCase().trim(), bcrypt.hashSync(u.pass, 10), u.role, u.role === 'corretor' ? 1 : 0]);
    }

    // 4. Insert Canops Developments
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

    for (const emp of empreendimentos) {
      await client.query(`
        INSERT INTO empreendimentos (id, nome, endereco, incorporadora, tipo, descricao)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [emp.id, emp.nome, emp.endereco, emp.incorporadora, emp.tipo, emp.descricao]);
    }
    console.log('✅ 9 Empreendimentos Canops cadastrados no Supabase!');

    console.log('🚀 Migração para o Supabase concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração:', err);
  } finally {
    await client.end();
  }
}

migrate();

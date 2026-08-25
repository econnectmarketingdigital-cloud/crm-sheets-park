import nodemailer from 'nodemailer';
import dns from 'dns';
import { getDb } from '../database.js';

/**
 * Sends an email notification to the assigned broker for a new lead.
 */
export async function notifyCorretorNewLead(leadId) {
  const db = getDb();
  try {
    // 1. Fetch lead details with assigned broker info
    const lead = await db.queryOne(`
      SELECT l.*, e.nome as empreendimento_nome, u.nome as corretor_nome, u.email as corretor_email
      FROM leads l
      LEFT JOIN empreendimentos e ON l.empreendimento_interesse_id = e.id
      LEFT JOIN usuarios u ON l.corretor_id = u.id
      WHERE l.id = ?
    `, [leadId]);

    if (!lead || !lead.corretor_email) {
      console.log(`[Notification] Skip email. Lead ${leadId} has no assigned broker or broker has no email.`);
      return;
    }

    const {
      nome,
      telefone,
      email = 'Não informado',
      origem = 'meta_ads',
      empreendimento_nome = 'Ainda não definido / Aberto',
      corretor_nome,
      corretor_email
    } = lead;

    const origemLabel = origem === 'meta_ads' ? 'Meta Ads' : origem === 'google_ads' ? 'Google Ads' : 'Manual';

    console.log(`[Notification] Preparing email for ${corretor_nome} (${corretor_email}) regarding lead: ${nome}`);

    // 2. Read SMTP environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || 'Sheets Park CRM <noreply@sheetspark.com.br>';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d10; color: #f3f4f6; margin: 0; padding: 20px; }
          .card { background-color: #121418; border: 1px solid rgba(0, 245, 160, 0.25); border-radius: 16px; padding: 25px; max-width: 550px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .logo { text-align: center; margin-bottom: 20px; font-weight: bold; color: #00F5A0; font-size: 24px; letter-spacing: -0.5px; }
          .title { color: #00F5A0; font-size: 20px; font-weight: 800; margin-bottom: 15px; text-transform: uppercase; letter-spacing: -0.5px; }
          .lead-info { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
          .info-row:last-child { border-bottom: none; }
          .label { color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .val { color: #ffffff; font-weight: 600; font-size: 14px; text-align: right; }
          .btn { display: block; text-align: center; background: linear-gradient(135deg, #00F5A0, #00D68B); color: #061912 !important; font-weight: 800; text-decoration: none; padding: 12px 20px; border-radius: 10px; margin-top: 20px; box-shadow: 0 5px 15px rgba(0,245,160,0.35); text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🍀 Sheets Park CRM</div>
          <div class="title">🔥 Atenção Corretor! Novo Lead no CRM</div>
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            Olá, <strong>${corretor_nome}</strong>. Um novo lead de interesse em loteamentos foi distribuído para a sua carteira. Faça o primeiro contato o mais rápido possível!
          </p>
          
          <div class="lead-info">
            <div class="info-row">
              <span class="label">Nome</span>
              <span class="val">${nome}</span>
            </div>
            <div class="info-row">
              <span class="label">WhatsApp / Tel</span>
              <span class="val">${telefone}</span>
            </div>
            <div class="info-row">
              <span class="label">E-mail</span>
              <span class="val">${email || 'Não informado'}</span>
            </div>
            <div class="info-row">
              <span class="label">Origem</span>
              <span class="val">${origemLabel}</span>
            </div>
            <div class="info-row">
              <span class="label">Interesse</span>
              <span class="val">${empreendimento_nome}</span>
            </div>
          </div>

          <a href="https://crm-sheets-park.vercel.app/leads/${leadId}" class="btn">Visualizar Lead no CRM</a>
        </div>
      </body>
      </html>
    `;

    // 3. Fallback to console log if SMTP is not configured
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('----------------------------------------------------');
      console.log('📢 [E-mail Simulado - SMTP Não Configurado]');
      console.log(`De: ${smtpFrom}`);
      console.log(`Para: ${corretor_email}`);
      console.log(`Assunto: 🔥 Novo Lead no CRM: ${nome}`);
      console.log(`Dados: Tel=${telefone}, Interesse=${empreendimento_nome}`);
      console.log('----------------------------------------------------');
      return;
    }

    // 4. Send real email using nodemailer
    console.log(`[Notification] Connecting to SMTP ${smtpHost}:${smtpPort}...`);
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      // Force DNS lookup to use IPv4 only to bypass Render's broken IPv6 network routes
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, callback);
      },
      family: 4, // Force IPv4
      connectionTimeout: 8000, // 8 seconds timeout
      greetingTimeout: 8000,
      socketTimeout: 8000,
      tls: {
        rejectUnauthorized: false // Avoid SSL certificate issues on some environments
      }
    });

    console.log(`[Notification] Sending email to ${corretor_email}...`);
    await transporter.sendMail({
      from: smtpFrom,
      to: corretor_email,
      subject: `🔥 Atenção: Novo Lead no CRM - ${nome}`,
      html: htmlBody
    });

    console.log(`[Notification] Email sent successfully to ${corretor_email}`);
  } catch (err) {
    console.error('[Notification] Failed to send email:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

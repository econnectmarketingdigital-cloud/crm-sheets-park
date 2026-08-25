import nodemailer from 'nodemailer';

async function testGmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'econnectmarketingdigital@gmail.com',
      pass: 'ugnomiyklplcxiaa'
    }
  });

  try {
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection is verified! Sending test email...');
    
    await transporter.sendMail({
      from: 'Sheets Park CRM <econnectmarketingdigital@gmail.com>',
      to: 'ogabriellucaz08@gmail.com',
      subject: 'Teste Conexão SMTP',
      text: 'Se você recebeu isso, a conexão SMTP do Gmail está funcionando perfeitamente!'
    });
    console.log('Email sent successfully!');
  } catch (err) {
    console.error('SMTP Error:', err.message);
    if (err.stack) console.error(err.stack);
  }
}
testGmail();

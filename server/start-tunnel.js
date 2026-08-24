import localtunnel from 'localtunnel';

async function start() {
  try {
    const tunnel = await localtunnel({ port: 3001, subdomain: 'marcela-crm-test' });
    console.log('Tunnel rodando em:', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel fechado, reconectando em 3s...');
      setTimeout(start, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Erro no tunnel:', err);
      setTimeout(start, 3000);
    });
  } catch (err) {
    console.error('Falha ao iniciar tunnel:', err);
    setTimeout(start, 3000);
  }
}

start();

import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.error('Erro ao verificar inscrição push existente:', err);
    return null;
  }
}

export async function subscribeUserToPush() {
  if (!isPushSupported()) {
    throw new Error('Notificações Push não são suportadas neste navegador/dispositivo.');
  }

  // 1. Solicita permissão do navegador
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Permissão para notificações foi bloqueada no navegador. Habilite nas configurações do site.'
        : 'Permissão para notificações não foi concedida.'
    );
  }

  // 2. Aguarda o Service Worker estar pronto
  const registration = await navigator.serviceWorker.ready;

  // 3. Busca a chave pública VAPID do backend
  const { publicKey } = await api.push.getPublicKey();
  if (!publicKey) {
    throw new Error('Chave pública VAPID não configurada no servidor.');
  }

  const convertedVapidKey = urlBase64ToUint8Array(publicKey);

  // 4. Inscreve o navegador no Push Manager
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
  }

  // 5. Envia a inscrição para o backend salvar no banco
  await api.push.subscribe(subscription);

  return subscription;
}

export async function unsubscribeUserFromPush() {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await api.push.unsubscribe(subscription.endpoint).catch(() => {});
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.error('Erro ao desinscrever do push:', err);
    throw err;
  }
}

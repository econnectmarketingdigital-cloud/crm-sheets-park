import React, { useState, useEffect } from 'react';
import { FiBell, FiBellOff, FiCheck, FiSend, FiSmartphone } from 'react-icons/fi';
import { isPushSupported, getPushPermission, subscribeUserToPush, unsubscribeUserFromPush, getExistingSubscription } from '../services/pushNotification';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function PushNotificationManager({ mode = 'banner' }) {
  const [supported, setSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const isSup = isPushSupported();
    setSupported(isSup);
    if (isSup) {
      checkStatus();
    }
  }, []);

  const checkStatus = async () => {
    try {
      const sub = await getExistingSubscription();
      setIsSubscribed(!!sub);
    } catch (e) {
      console.error('Erro ao checar inscrição:', e);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      await subscribeUserToPush();
      setIsSubscribed(true);
      addToast('🔔 Notificações ativadas com sucesso neste aparelho!', 'success');
      
      // Envia notificação de boas-vindas/teste imediatamente
      setTimeout(async () => {
        try {
          await api.push.testPush();
        } catch (e) {
          console.log('Push teste disparado.');
        }
      }, 500);
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Erro ao ativar notificações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setLoading(true);
      await unsubscribeUserFromPush();
      setIsSubscribed(false);
      addToast('Notificações desativadas neste aparelho.', 'info');
    } catch (err) {
      addToast(err.message || 'Erro ao desativar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      const res = await api.push.testPush();
      addToast('🚀 Notificação de teste enviada! Olhe a tela do celular.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao enviar teste', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) return null;

  // Modo Bell Icon (para a barra superior mobile e header)
  if (mode === 'bell') {
    return (
      <button
        onClick={isSubscribed ? handleTest : handleSubscribe}
        disabled={loading}
        title={isSubscribed ? 'Notificações ativas! Toque para testar som' : 'Toque para ativar notificações no celular'}
        style={{
          background: isSubscribed ? 'rgba(0, 245, 160, 0.15)' : 'rgba(255, 87, 34, 0.18)',
          border: `1px solid ${isSubscribed ? 'rgba(0, 245, 160, 0.4)' : 'rgba(255, 87, 34, 0.5)'}`,
          color: isSubscribed ? '#00F5A0' : '#ff5722',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          padding: 0
        }}
      >
        <FiBell size={16} />
        {!isSubscribed && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ff5722',
            border: '2px solid #08090A'
          }} />
        )}
      </button>
    );
  }

  // Modo Widget / Botão (usado dentro do Perfil ou Barra de Configurações)
  if (mode === 'widget') {
    return (
      <div style={{
        background: 'var(--color-surface, #121418)',
        border: '1px solid var(--color-border, rgba(255, 255, 255, 0.08))',
        borderRadius: '12px',
        padding: '1.25rem',
        marginTop: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              backgroundColor: isSubscribed ? 'rgba(0, 245, 160, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isSubscribed ? 'var(--color-primary, #00F5A0)' : 'var(--color-text-secondary)'
            }}>
              {isSubscribed ? <FiBell size={22} /> : <FiBellOff size={22} />}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                Notificações no Celular {isSubscribed && <span style={{ color: '#00F5A0', fontSize: '0.8rem', marginLeft: '6px' }}>● Ativo</span>}
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {isSubscribed 
                  ? 'Este dispositivo está configurado para receber alertas sonoros de novos leads.'
                  : 'Receba avisos instantâneos com som na tela de bloqueio quando um lead chegar.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {isSubscribed ? (
              <>
                <button
                  onClick={handleTest}
                  disabled={loading}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    borderRadius: '8px', padding: '8px 12px', fontSize: '0.825rem'
                  }}
                >
                  <FiSend size={14} /> Testar Som
                </button>
                <button
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-danger, #ef4444)',
                    borderRadius: '8px', padding: '8px 12px', fontSize: '0.825rem'
                  }}
                >
                  Desativar
                </button>
              </>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '0.875rem'
                }}
              >
                <FiBell size={16} /> Ativar Notificações
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Se já está inscrito ou o usuário dispensou o banner, não mostra o banner
  if (isSubscribed || dismissed) return null;

  // Modo Banner flutuante no topo / parte inferior da tela (perfeito para celular)
  return (
    <div style={{
      position: 'fixed',
      bottom: '72px', // logo acima da bottom nav no mobile
      left: '12px',
      right: '12px',
      zIndex: 9999,
      maxWidth: '480px',
      margin: '0 auto',
      backgroundColor: '#121418',
      border: '1px solid rgba(0, 245, 160, 0.4)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 245, 160, 0.2)',
      borderRadius: '14px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: 'rgba(0, 245, 160, 0.15)',
          color: '#00F5A0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <FiSmartphone size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            Ativar Alerta no Celular
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.2 }}>
            Receba notificações de novos leads com som em tempo real.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #00F5A0, #00D284)',
            color: '#061912',
            fontWeight: 700,
            fontSize: '0.75rem',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? 'Ativando...' : 'Ativar'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: '1rem',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

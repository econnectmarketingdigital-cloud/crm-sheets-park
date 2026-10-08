import React, { useState, useEffect } from 'react';
import { FiBell, FiBellOff, FiCheck, FiSend, FiSmartphone, FiShare, FiPlusSquare, FiInfo, FiX, FiVolume2 } from 'react-icons/fi';
import { isPushSupported, subscribeUserToPush, unsubscribeUserFromPush, getExistingSubscription } from '../services/pushNotification';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

// Função para reproduzir som de notificação cristalino via Web Audio API (compatível com todos os navegadores/celulares)
export const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    
    // Tom 1: E5 (659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.28);

    // Tom 2: B5 (988Hz) - alegre e chamativo
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.35, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.log('Audio playback:', e);
  }
};

export default function PushNotificationManager({ mode = 'banner' }) {
  const [supported, setSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const { addToast } = useToast();

  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  const isStandalone = typeof window !== 'undefined' && (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );

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
    // Se for iOS e não estiver no modo Home Screen, abre guia de instalação
    if (isIOS && !isStandalone) {
      setShowIOSModal(true);
      return;
    }

    try {
      setLoading(true);
      await subscribeUserToPush();
      setIsSubscribed(true);
      playNotificationChime();
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
      playNotificationChime();
      
      if (isSubscribed) {
        await api.push.testPush();
        addToast('🚀 Notificação enviada! Olhe a tela do celular.', 'success');
      } else {
        addToast('🔊 Som de notificação testado com sucesso!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao enviar teste', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Modal explicativo para iPhone / iPad
  const renderIOSModal = () => {
    if (!showIOSModal) return null;
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          backgroundColor: '#121418',
          border: '1px solid rgba(0, 245, 160, 0.4)',
          borderRadius: '16px',
          maxWidth: '420px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
          position: 'relative'
        }}>
          <button
            onClick={() => setShowIOSModal(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <FiX size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              backgroundColor: 'rgba(0, 245, 160, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#00F5A0'
            }}>
              <FiSmartphone size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                Notificações no iPhone
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#00F5A0', fontWeight: 600 }}>
                Passo a passo rápido da Apple
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.4, margin: '0 0 16px 0' }}>
            A Apple exige que o CRM seja adicionado à <strong>Tela de Início</strong> para enviar notificações com som na tela de bloqueio:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '10px' }}>
              <span style={{ background: '#00F5A0', color: '#061912', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>1</span>
              <div style={{ fontSize: '0.825rem', color: '#fff' }}>
                No Safari, toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima <FiShare style={{ verticalAlign: 'middle', margin: '0 2px' }} /> na barra inferior).
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '10px' }}>
              <span style={{ background: '#00F5A0', color: '#061912', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>2</span>
              <div style={{ fontSize: '0.825rem', color: '#fff' }}>
                Role a lista e selecione <strong style={{ color: '#00F5A0' }}>"Adicionar à Tela de Início"</strong> <FiPlusSquare style={{ verticalAlign: 'middle', margin: '0 2px' }} />.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '10px' }}>
              <span style={{ background: '#00F5A0', color: '#061912', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>3</span>
              <div style={{ fontSize: '0.825rem', color: '#fff' }}>
                Abra o Sheets Park pelo novo ícone na tela inicial do seu celular e toque em <strong>Ativar Notificações</strong>!
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                playNotificationChime();
                addToast('🔊 Som reproduzido com sucesso!', 'info');
              }}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <FiVolume2 size={16} /> Testar Som
            </button>
            <button
              onClick={() => setShowIOSModal(false)}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #00F5A0, #00D284)',
                color: '#061912',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  };

  // MODO BELL (Ícone de Sino no Top Header Mobile e Desktop)
  if (mode === 'bell') {
    const handleClick = () => {
      if (isIOS && !isStandalone && !isSubscribed) {
        setShowIOSModal(true);
      } else if (isSubscribed) {
        handleTest();
      } else {
        handleSubscribe();
      }
    };

    return (
      <>
        {renderIOSModal()}
        <button
          onClick={handleClick}
          disabled={loading}
          title={
            isSubscribed 
              ? 'Notificações ativas! Toque para testar som' 
              : (isIOS && !isStandalone)
                ? 'Toque para ver como ativar no iPhone'
                : 'Toque para ativar notificações de novos leads'
          }
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
      </>
    );
  }

  // MODO WIDGET (Exibido na página de Perfil / Configurações)
  if (mode === 'widget') {
    return (
      <>
        {renderIOSModal()}
        <div style={{
          background: 'var(--color-surface, #121418)',
          border: '1px solid var(--color-border, rgba(255, 255, 255, 0.08))',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '12px',
                backgroundColor: isSubscribed ? 'rgba(0, 245, 160, 0.15)' : 'rgba(255, 87, 34, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isSubscribed ? 'var(--color-primary, #00F5A0)' : '#ff5722'
              }}>
                {isSubscribed ? <FiBell size={24} /> : <FiBellOff size={24} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Notificações no Celular
                  {isSubscribed ? (
                    <span style={{ color: '#00F5A0', fontSize: '0.75rem', background: 'rgba(0,245,160,0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      ● Ativo com Som
                    </span>
                  ) : (
                    <span style={{ color: '#ff5722', fontSize: '0.75rem', background: 'rgba(255,87,34,0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      ● Inativo
                    </span>
                  )}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {isSubscribed 
                    ? 'Este dispositivo recebe alertas sonoros instantâneos a cada novo lead que chega.'
                    : 'Receba avisos com som na tela do celular para atender novos leads em tempo recorde.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleTest}
                disabled={loading}
                className="btn btn-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  borderRadius: '8px', padding: '8px 14px', fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <FiVolume2 size={16} /> Testar Som
              </button>

              {isSubscribed ? (
                <button
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-danger, #ef4444)',
                    borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Desativar
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <FiBell size={16} /> Ativar Notificações
                </button>
              )}
            </div>
          </div>

          {/* Dica para iPhone se detectado que está fora do modo app */}
          {isIOS && !isStandalone && (
            <div 
              onClick={() => setShowIOSModal(true)}
              style={{
                marginTop: '0.5rem',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiSmartphone size={18} color="#38BDF8" />
                <span style={{ fontSize: '0.825rem', color: '#e0f2fe' }}>
                  <strong>Usando iPhone?</strong> Adicione à Tela de Início para liberar alertas mesmo com tela bloqueada.
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                Ver Como ➔
              </span>
            </div>
          )}
        </div>
      </>
    );
  }

  // MODO BANNER FLUTUANTE (No rodapé do app caso ainda não tenha ativado)
  if (isSubscribed || dismissed) return null;

  return (
    <>
      {renderIOSModal()}
      <div style={{
        position: 'fixed',
        bottom: '72px', // acima da bottom navigation
        left: '12px',
        right: '12px',
        zIndex: 9999,
        maxWidth: '480px',
        margin: '0 auto',
        backgroundColor: '#121418',
        border: '1px solid rgba(0, 245, 160, 0.4)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85), 0 0 15px rgba(0, 245, 160, 0.2)',
        borderRadius: '14px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <div 
          onClick={isIOS && !isStandalone ? () => setShowIOSModal(true) : handleSubscribe}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }}
        >
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
              Ativar Notificações no Celular
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.2 }}>
              Receba novos leads com som em tempo real.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={isIOS && !isStandalone ? () => setShowIOSModal(true) : handleSubscribe}
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
    </>
  );
}

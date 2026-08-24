import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setGoogleLoading(true);
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const userInfo = await res.json();
      
      await loginWithGoogle(userInfo.email, userInfo.name);
      addToast('Conectado via Google com sucesso!', 'success');
      navigate('/');
    } catch (error) {
      addToast(error.message || 'Erro no login com Google', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const loginGoogleAction = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => addToast('O login com Google falhou.', 'error'),
  });

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      addToast('Login realizado com sucesso', 'success');
      navigate('/');
    } catch (error) {
      addToast(error.message || 'Erro ao fazer login', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    loginGoogleAction();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#0a0a0a',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Premium Animated Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.6 }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, rgba(212,149,106,0.15) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', animation: 'float 10s infinite alternate ease-in-out'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, rgba(181,69,27,0.15) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(80px)', animation: 'float 12s infinite alternate-reverse ease-in-out'
        }} />
      </div>

      <style>{`
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(5%, 5%) scale(1.05); } }
        .glass-login-card {
          background: rgba(30, 25, 23, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212,149,106,0.1);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          position: relative;
          z-index: 10;
        }
        .glass-input {
          background: rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 0.8rem 1rem !important;
          transition: all 0.3s ease !important;
        }
        .glass-input:focus {
          border-color: rgba(212,149,106, 0.5) !important;
          box-shadow: 0 0 0 4px rgba(212,149,106, 0.1) !important;
          background: rgba(0, 0, 0, 0.4) !important;
        }
        .premium-btn {
          background: linear-gradient(135deg, #D4956A, #B5451B);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          padding: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(181,69,27, 0.3);
        }
        .premium-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(181,69,27, 0.5);
        }
      `}</style>

      <div className="glass-login-card" style={{ width: '100%', maxWidth: '420px', margin: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo_icon.png?v=2" alt="Logo Marcela Lopes" style={{ width: '80px', height: 'auto', objectFit: 'contain' }} />
          <div>
            <h1 className="font-heading" style={{ color: 'var(--color-primary)', fontSize: '1.75rem', marginBottom: '0.25rem', fontWeight: 700, letterSpacing: '3px' }}>MARCELA LOPES</h1>
            <p style={{ color: 'var(--color-secondary)', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 500 }}>Negócios Imobiliários</p>
          </div>
        </div>

        {/* Google Login Button */}
        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '1.5rem'
          }}
          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          {googleLoading ? 'Conectando...' : 'Entrar com o Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ padding: '0 12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>ou com e-mail</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>Email</label>
            <input type="email" className="input glass-input" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>Senha</label>
            <input type="password" className="input glass-input" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <button type="submit" className="premium-btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Autenticando...' : 'Acessar Plataforma'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

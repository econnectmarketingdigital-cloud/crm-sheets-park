import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { HiHome, HiViewBoards, HiUserGroup, HiOfficeBuilding, HiCog, HiLogout, HiPlus } from 'react-icons/hi';
import { FiRefreshCw, FiHelpCircle, FiAward, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import OnboardingTour from './OnboardingTour';
import api from '../services/api';

const Layout = () => {
  const { user, isGestor, logout } = useAuth();
  
  const [isOnline, setIsOnline] = useState(user?.pausado_rodizio === 0);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    setIsOnline(user?.pausado_rodizio === 0);
  }, [user]);

  // Check if user has seen tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('@CRM_Tour_Done');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await api.rodizio.pausarCorretor(user.id, !newStatus);
      setIsOnline(newStatus);
    } catch (err) {
      console.error('Erro ao mudar status:', err);
    }
  };

  const navLinks = [
    { to: '/', icon: <HiHome size={24} />, label: 'Dashboard' },
    { to: '/kanban', icon: <HiViewBoards size={24} />, label: 'Kanban' },
    { to: '/leads', icon: <HiUserGroup size={24} />, label: 'Leads' },
    { to: '/ranking', icon: <FiAward size={24} />, label: 'Ranking' },
    { to: '/empreendimentos', icon: <HiOfficeBuilding size={24} />, label: 'Loteamentos' },
    { to: '/perfil', icon: <FiUser size={24} />, label: 'Meu Perfil' },
  ];

  if (isGestor) {
    navLinks.push({ to: '/equipe', icon: <HiUserGroup size={24} />, label: 'Equipe' });
    navLinks.push({ to: '/rodizio', icon: <FiRefreshCw size={24} />, label: 'Rodízio' });
    navLinks.push({ to: '/configuracoes', icon: <HiCog size={24} />, label: 'Ajustes' });
  }

  return (
    <div 
      className="app-container" 
      style={user?.wallpaper_url ? { 
        backgroundImage: `url(${user.wallpaper_url})`, 
        backgroundSize: 'cover', 
        backgroundPosition: user?.wallpaper_position || 'center center', 
        backgroundAttachment: 'fixed' 
      } : {}}
    >
      {user?.wallpaper_url && <div style={{position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8, 9, 10, 0.8)", zIndex: 0, pointerEvents: "none"}}></div>}
      {/* Onboarding Tour Component */}
      <OnboardingTour isOpen={showTour} onClose={() => setShowTour(false)} />

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="brand" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
          <img 
            src="/logo_icon.png?v=6" 
            alt="Sheets Park" 
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'cover',
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(0, 245, 160, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }} 
          />
          <span style={{ display: 'inline-block', fontSize: '0.65rem', color: '#00F5A0', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
            Loteamentos
          </span>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {navLinks.map((link) => (
            <NavLink 
              key={link.to} 
              to={link.to}
              data-tour={`nav-${link.to.replace('/', '') || 'dashboard'}`}
              className={({isActive}) => `btn ${isActive ? 'btn-primary' : ''}`}
              style={{ justifyContent: 'flex-start', backgroundColor: 'transparent' }}
            >
              {link.icon} {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Tutorial / Help Button */}
        <div style={{ padding: '0.75rem 0', borderTop: '1px solid var(--color-border)' }}>
          <button 
            onClick={() => setShowTour(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text-secondary)',
              fontSize: '0.825rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            <FiHelpCircle size={16} /> Guia da Plataforma
          </button>
        </div>

        <div className="user-info" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden' }} onClick={() => navigate('/perfil')}>
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.nome} 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00F5A0', flexShrink: 0 }} 
                />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 245, 160, 0.15)', color: '#00F5A0', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', border: '1px solid rgba(0, 245, 160, 0.3)', flexShrink: 0 }}>
                  {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '115px' }}>
                  {user?.nome}
                </div>
                <div className="text-secondary" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  {user?.role}
                </div>
              </div>
            </div>
            <button onClick={logout} className="btn" style={{ padding: '0.5rem', color: 'var(--color-danger)' }} title="Sair do sistema">
              <HiLogout size={20} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>Status Rodízio:</span>
            <button 
              onClick={handleToggleOnline}
              data-tour="btn-status-rodizio"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: isOnline ? 'var(--color-success, #10b981)' : 'var(--color-danger, #ef4444)',
                fontWeight: '600'
              }}
            >
              <div style={{ 
                width: '10px', height: '10px', borderRadius: '50%', 
                backgroundColor: isOnline ? 'var(--color-success, #10b981)' : 'var(--color-danger, #ef4444)' 
              }}></div>
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        <NavLink to="/" className="nav-item">
          <HiHome size={24} />
          <span>Início</span>
        </NavLink>
        <NavLink to="/kanban" className="nav-item">
          <HiViewBoards size={24} />
          <span>Kanban</span>
        </NavLink>
        <NavLink to="/leads/novo" className="nav-item" style={{ color: 'var(--color-primary)' }}>
          <HiPlus size={32} />
          <span>Novo Lead</span>
        </NavLink>
        <NavLink to="/leads" className="nav-item">
          <HiUserGroup size={24} />
          <span>Leads</span>
        </NavLink>
        <NavLink to="/empreendimentos" className="nav-item">
          <HiOfficeBuilding size={24} />
          <span>Imóveis</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;




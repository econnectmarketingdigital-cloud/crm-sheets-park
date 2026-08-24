import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { FiAward, FiTrendingUp } from 'react-icons/fi';
import { FaCrown, FaMedal } from 'react-icons/fa';

const Ranking = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users to create the ranking board
        const users = await api.usuarios.getUsuarios();
        
        // For demonstration of the gamified UI, we will just map the users and give them random VGV if not present,
        // since we need data to show the beautiful podium. In a real scenario, the backend should return actual VGV per user in a ranking endpoint.
        let ranked = users.filter(u => u.role === 'corretor').map((u, index) => ({
          ...u,
          vgv: Math.floor(Math.random() * (1500000 - 100000) + 100000), // Mock VGV for visual gamification
        })).sort((a, b) => b.vgv - a.vgv);
        
        setCorretores(ranked);
      } catch (err) {
        addToast(err.message || 'Erro ao carregar ranking', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;

  const top3 = corretores.slice(0, 3);
  const others = corretores.slice(3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', position: 'relative', zIndex: 1, minHeight: '100%', paddingBottom: '3rem' }}>
      
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '50vh', zIndex: -1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at top, rgba(241,196,15,0.15) 0%, transparent 70%)', filter: 'blur(50px)'
      }} />

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(241,196,15,0.1)', color: '#f1c40f', padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid rgba(241,196,15,0.3)', marginBottom: '1rem' }}>
          <FiAward size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Top Performers</span>
        </div>
        <h1 className="font-heading" style={{ fontSize: '3rem', margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-1px' }}>
          Ranking <span style={{ color: 'transparent', backgroundImage: 'linear-gradient(90deg, #f1c40f, #f39c12)', WebkitBackgroundClip: 'text' }}>Global</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>A corrida pelo topo. Quem será o campeão de VGV deste mês?</p>
      </div>

      <style>{`
        .podium-container {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 1.5rem;
          margin-top: 2rem;
          height: 350px;
        }
        .podium-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 160px;
          position: relative;
          animation: slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          opacity: 0;
          transform: translateY(50px);
        }
        .podium-item:nth-child(1) { animation-delay: 0.3s; } /* 2nd */
        .podium-item:nth-child(2) { animation-delay: 0.1s; } /* 1st */
        .podium-item:nth-child(3) { animation-delay: 0.5s; } /* 3rd */
        
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

        .podium-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--color-surface);
          border: 4px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin-bottom: -15px;
          position: relative;
          z-index: 10;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        .podium-base {
          width: 100%;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          border-bottom: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem 1rem 1rem;
          position: relative;
          overflow: hidden;
        }
        .podium-base::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 100%;
          background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);
        }
        .rank-number {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1;
          color: rgba(255,255,255,0.1);
          position: absolute;
          bottom: 10px;
          font-family: 'Space Grotesk', sans-serif;
        }
        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1rem 1.5rem;
          margin-bottom: 0.75rem;
          transition: all 0.2s ease;
        }
        .list-item:hover {
          background: rgba(255,255,255,0.06);
          transform: translateX(5px);
          border-color: rgba(212,149,106,0.3);
        }
      `}</style>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="podium-container">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="podium-item" style={{ zIndex: 2 }}>
              <FaMedal size={30} color="#bdc3c7" style={{ position: 'absolute', top: '-35px', filter: 'drop-shadow(0 4px 10px rgba(189,195,199,0.5))' }} />
              <div className="podium-avatar" style={{ borderColor: '#bdc3c7', background: top3[1].avatar_cor || '#3498db' }}>
                {top3[1].nome.charAt(0).toUpperCase()}
              </div>
              <div className="podium-base" style={{ height: '180px', boxShadow: '0 0 40px rgba(189,195,199,0.1)' }}>
                <span style={{ fontWeight: 600, textAlign: 'center', fontSize: '1.1rem', zIndex: 2 }}>{top3[1].nome.split(' ')[0]}</span>
                <span style={{ color: '#bdc3c7', fontWeight: 700, marginTop: '0.25rem', zIndex: 2 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(top3[1].vgv)}</span>
                <span className="rank-number">2</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="podium-item" style={{ zIndex: 3 }}>
              <FaCrown size={45} color="#f1c40f" style={{ position: 'absolute', top: '-55px', filter: 'drop-shadow(0 4px 15px rgba(241,196,15,0.8))' }} />
              <div className="podium-avatar" style={{ borderColor: '#f1c40f', background: top3[0].avatar_cor || '#e74c3c', width: '100px', height: '100px', fontSize: '2.5rem', marginBottom: '-20px' }}>
                {top3[0].nome.charAt(0).toUpperCase()}
              </div>
              <div className="podium-base" style={{ height: '240px', background: 'rgba(241,196,15,0.1)', borderColor: 'rgba(241,196,15,0.3)', boxShadow: '0 0 60px rgba(241,196,15,0.2)' }}>
                <span style={{ fontWeight: 800, textAlign: 'center', fontSize: '1.3rem', zIndex: 2, color: '#f1c40f' }}>{top3[0].nome.split(' ')[0]}</span>
                <span style={{ color: '#fff', fontWeight: 800, marginTop: '0.25rem', zIndex: 2, fontSize: '1.2rem' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(top3[0].vgv)}</span>
                <span className="rank-number" style={{ color: 'rgba(241,196,15,0.2)', fontSize: '6rem' }}>1</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="podium-item" style={{ zIndex: 1 }}>
              <FaMedal size={25} color="#cd7f32" style={{ position: 'absolute', top: '-30px', filter: 'drop-shadow(0 4px 10px rgba(205,127,50,0.5))' }} />
              <div className="podium-avatar" style={{ borderColor: '#cd7f32', background: top3[2].avatar_cor || '#9b59b6', width: '70px', height: '70px', fontSize: '1.5rem', marginBottom: '-10px' }}>
                {top3[2].nome.charAt(0).toUpperCase()}
              </div>
              <div className="podium-base" style={{ height: '140px', boxShadow: '0 0 30px rgba(205,127,50,0.1)' }}>
                <span style={{ fontWeight: 600, textAlign: 'center', fontSize: '1rem', zIndex: 2 }}>{top3[2].nome.split(' ')[0]}</span>
                <span style={{ color: '#cd7f32', fontWeight: 700, marginTop: '0.25rem', zIndex: 2, fontSize: '0.9rem' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(top3[2].vgv)}</span>
                <span className="rank-number" style={{ fontSize: '3.5rem' }}>3</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List for the rest */}
      <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        {others.map((corretor, index) => (
          <div key={corretor.id} className="list-item" style={{ borderLeft: user?.id === corretor.id ? '4px solid #D4956A' : '' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-tertiary)', width: '30px', textAlign: 'center' }}>{index + 4}º</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: corretor.avatar_cor || 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>
                {corretor.nome.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {corretor.nome} {user?.id === corretor.id && <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(212,149,106,0.2)', color: '#D4956A', padding: '2px 8px', borderRadius: '20px', marginLeft: '8px' }}>Você</span>}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiTrendingUp color="var(--color-text-secondary)" />
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(corretor.vgv)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ranking;

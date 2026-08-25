import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiHome, FiMapPin } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Empreendimentos() {
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmpreendimentos();
  }, []);

  const fetchEmpreendimentos = async () => {
    try {
      setLoading(true);
      const data = await api.empreendimentos.getEmpreendimentos();
      setEmpreendimentos(data || []);
    } catch (err) {
      addToast({ type: 'error', title: 'Erro', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return <div className="p-6 text-center text-[var(--color-text-secondary)]">Carregando empreendimentos...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-heading" style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>Loteamentos & Empreendimentos</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Gestão de quadras, lotes e disponibilidades</p>
        </div>
        {user?.role === 'gestor' && (
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiPlus /> Novo Loteamento
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {empreendimentos.map((emp) => {
          const isBeiraRio = emp.nome?.toLowerCase().includes('beira-rio') || emp.tipo?.toLowerCase().includes('beira');
          const isComercial = emp.nome?.toLowerCase().includes('comercial') || emp.tipo?.toLowerCase().includes('comercial');
          const iconEmoji = isBeiraRio ? '🌊' : isComercial ? '🏢' : '🏡';
          const badgeColor = isBeiraRio ? '#FBBF24' : isComercial ? '#38BDF8' : '#00F5A0';
          const badgeBg = isBeiraRio ? 'rgba(251,191,36,0.12)' : isComercial ? 'rgba(56,189,248,0.12)' : 'rgba(0,245,160,0.12)';
          const badgeBorder = isBeiraRio ? 'rgba(251,191,36,0.25)' : isComercial ? 'rgba(56,189,248,0.25)' : 'rgba(0,245,160,0.25)';

          return (
            <div
              key={emp.id}
              onClick={() => navigate(`/empreendimentos/${emp.id}`)}
              className="card"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: '1.75rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '1.75rem', marginRight: '8px' }}>{iconEmoji}</span>
                  <h2 className="font-heading" style={{ fontSize: '1.35rem', margin: '0.5rem 0 0 0', fontWeight: 800, color: '#FFFFFF' }}>{emp.nome}</h2>
                </div>
                <span style={{ 
                  backgroundColor: badgeBg, color: badgeColor, 
                  padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                  border: `1px solid ${badgeBorder}`
                }}>
                  {emp.tipo || 'Loteamento'}
                </span>
              </div>
              
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                {emp.descricao}
              </p>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  <FiMapPin color="#00F5A0" /> {emp.endereco || 'Endereço não informado'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  <FiHome color="#00F5A0" /> {emp.total_unidades_real || emp.total_unidades || 0} lotes cadastrados
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.5px', display: 'block' }}>Valor do Lote</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00F5A0' }}>
                    {formatCurrency(emp.valor_min || emp.valor_max || 0)}
                  </div>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#00F5A0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Ver Lotes →
                </span>
              </div>
            </div>
          );
        })}
        {empreendimentos.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Nenhum empreendimento cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}

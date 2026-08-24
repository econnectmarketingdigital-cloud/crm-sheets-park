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
        <h1 className="font-heading" style={{ fontSize: '2rem', margin: 0 }}>Empreendimentos</h1>
        {user?.role === 'gestor' && (
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiPlus /> Novo Empreendimento
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {empreendimentos.map((emp) => (
          <div
            key={emp.id}
            onClick={() => navigate(`/empreendimentos/${emp.id}`)}
            className="card"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 className="font-heading" style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>{emp.nome}</h2>
              <span style={{ 
                backgroundColor: 'rgba(212,149,106,0.15)', color: '#D4956A', 
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                border: '1px solid rgba(212,149,106,0.3)'
              }}>
                {emp.tipo || 'MCMV'}
              </span>
            </div>
            
            {emp.tipo?.toLowerCase() === 'mcmv' && emp.faixa_mcmv && (
              <div style={{ marginBottom: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', alignSelf: 'flex-start' }}>
                Faixa: {emp.faixa_mcmv}
              </div>
            )}
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                <FiMapPin color="#D4956A" /> {emp.endereco || 'Endereço não informado'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                <FiHome color="#D4956A" /> {emp.total_unidades_real || 0} unidades
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {formatCurrency(emp.valor_min)} <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 400 }}>a</span> {formatCurrency(emp.valor_max)}
              </div>
            </div>
          </div>
        ))}
        {empreendimentos.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Nenhum empreendimento cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}

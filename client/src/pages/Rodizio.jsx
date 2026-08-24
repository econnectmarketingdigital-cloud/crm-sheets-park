import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Rodizio = () => {
  const [config, setConfig] = useState(null);
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const conf = await api.config.getConfig();
      const corrs = await api.rodizio.getCorretoresRodizio();
      setConfig(conf);
      setCorretores(corrs);
    } catch (error) {
      console.error('Erro ao buscar dados do rodízio:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleConfigChange = async (key, value) => {
    try {
      await api.config.updateConfig({ [key]: value });
      setConfig(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      alert('Erro ao atualizar configuração');
    }
  };

  const toggleDisponivel = async (id, disponivelAtual) => {
    try {
      await api.rodizio.toggleDisponivel(id, !disponivelAtual);
      setCorretores(prev => prev.map(c => c.id === id ? { ...c, disponivel_rodizio: !disponivelAtual ? 1 : 0 } : c));
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error);
      alert('Erro ao alterar disponibilidade');
    }
  };

  const forcarPausa = async (id) => {
    try {
      await api.rodizio.pausarCorretor(id, true);
      setCorretores(prev => prev.map(c => c.id === id ? { ...c, pausado_rodizio: 1 } : c));
    } catch (error) {
      console.error('Erro ao forçar pausa:', error);
      alert('Erro ao forçar pausa');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Gerenciamento de Rodízio</h1>
        <p className="text-secondary">Gerencie a distribuição automática de leads e a disponibilidade da equipe.</p>
      </header>

      {config && (
        <section className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Configurações Gerais</h2>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="rodizioAtivo" style={{ fontWeight: '500' }}>Rodízio Automático:</label>
              <input
                id="rodizioAtivo"
                type="checkbox"
                checked={config.rodizio_ativo === 1}
                onChange={(e) => handleConfigChange('rodizio_ativo', e.target.checked ? 1 : 0)}
                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="slaMinutos" style={{ fontWeight: '500' }}>SLA de Redistribuição (minutos):</label>
              <input
                id="slaMinutos"
                type="number"
                min="1"
                className="input"
                value={config.sla_redistribuicao_minutos || 15}
                onChange={(e) => handleConfigChange('sla_redistribuicao_minutos', parseInt(e.target.value))}
                style={{ width: '80px' }}
              />
            </div>
          </div>
        </section>
      )}

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Equipe no Rodízio</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Corretor</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Status (Online/Offline)</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Plantão do Dia</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {corretores.map((corretor) => {
                const isOnline = corretor.pausado_rodizio === 0;
                const isDisponivel = corretor.disponivel_rodizio === 1;

                return (
                  <tr key={corretor.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500' }}>{corretor.nome}</div>
                      <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{corretor.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '12px', height: '12px', borderRadius: '50%', 
                          backgroundColor: isOnline ? 'var(--color-success, #10b981)' : 'var(--color-danger, #ef4444)' 
                        }}></div>
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isDisponivel}
                          onChange={() => toggleDisponivel(corretor.id, isDisponivel)}
                          style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                        />
                        <span>{isDisponivel ? 'Disponível' : 'Fora do Plantão'}</span>
                      </label>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {isOnline && (
                        <button 
                          className="btn btn-outline"
                          onClick={() => forcarPausa(corretor.id)}
                          style={{ borderColor: 'var(--color-danger, #ef4444)', color: 'var(--color-danger, #ef4444)' }}
                        >
                          Forçar Pausa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {corretores.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-secondary)' }}>
                    Nenhum corretor encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Rodizio;

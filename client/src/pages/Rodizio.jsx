import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { SALAS, getSalaBadge } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const Rodizio = () => {
  const { user } = useAuth();
  const isSuperGestor = user?.sala === 'todas';
  const visibleSalas = isSuperGestor ? SALAS : SALAS.filter(s => s.key === (user?.sala || 'sao_luis'));
  const [config, setConfig] = useState({
    rodizio_ativo: 1,
    sla_redistribuicao_minutos: 15,
    sala_sao_luis_ativa: 1,
    sala_salinas_ativa: 1,
    sala_santo_amaro_ativa: 1
  });
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salaFilter, setSalaFilter] = useState('');
  const { addToast } = useToast();

  const fetchDados = async () => {
    try {
      setLoading(true);
      const [confRaw, corrs] = await Promise.all([
        api.config.getConfig(),
        api.rodizio.getCorretoresRodizio()
      ]);

      const parsedConf = {
        rodizio_ativo: 1,
        sla_redistribuicao_minutos: 15,
        sala_sao_luis_ativa: 1,
        sala_salinas_ativa: 1,
        sala_santo_amaro_ativa: 1
      };

      if (Array.isArray(confRaw)) {
        confRaw.forEach(item => {
          if (item.chave === 'rodizio_ativo') {
            parsedConf.rodizio_ativo = (item.valor === '1' || item.valor === 'true') ? 1 : 0;
          } else if (item.chave === 'sla_redistribuicao_minutos') {
            parsedConf.sla_redistribuicao_minutos = parseInt(item.valor, 10) || 15;
          } else if (['sala_sao_luis_ativa', 'sala_salinas_ativa', 'sala_santo_amaro_ativa'].includes(item.chave)) {
            parsedConf[item.chave] = (item.valor === '1' || item.valor === 'true') ? 1 : 0;
          }
        });
      } else if (confRaw && typeof confRaw === 'object') {
        Object.assign(parsedConf, confRaw);
      }

      setConfig(parsedConf);
      setCorretores(corrs || []);
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

  const handlePesoChange = async (id, field, val) => {
    const numVal = parseInt(val, 10) || 0;
    try {
      await api.rodizio.updatePesosCorretor(id, { [field]: numVal });
      setCorretores(prev => prev.map(c => c.id === id ? { ...c, [field]: numVal } : c));
      addToast('Fila do corretor atualizada!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar praça/peso:', error);
      addToast('Erro ao atualizar praça/peso', 'error');
    }
  };

  const handleSalaChange = async (id, novaSala) => {
    try {
      await api.rodizio.updatePesosCorretor(id, { sala: novaSala });
      setCorretores(prev => prev.map(c => c.id === id ? { ...c, sala: novaSala } : c));
      const badge = getSalaBadge(novaSala);
      addToast(`Corretor movido para ${badge.name}!`, 'success');
    } catch (error) {
      console.error('Erro ao atualizar sala:', error);
      addToast('Erro ao atualizar sala do corretor', 'error');
    }
  };

  const handleToggleSalaAtiva = async (salaKey, isAtivaAtual) => {
    const novoStatus = !isAtivaAtual;
    const configKey = `sala_${salaKey}_ativa`;
    try {
      await api.rodizio.updateSalaPlantao(salaKey, { ativa: novoStatus });
      setConfig(prev => ({ ...prev, [configKey]: novoStatus ? 1 : 0 }));
      const badge = getSalaBadge(salaKey);
      addToast(`${badge.name} ${novoStatus ? 'ATIVADA' : 'PAUSADA'} no rodízio!`, 'success');
    } catch (error) {
      console.error('Erro ao alterar status da sala:', error);
      addToast('Erro ao alterar status da sala', 'error');
    }
  };

  const handleBulkPlantaoSala = async (salaKey, disponivel) => {
    const badge = getSalaBadge(salaKey);
    try {
      await api.rodizio.updateSalaPlantao(salaKey, { disponivel, ativa: disponivel ? true : undefined });
      setCorretores(prev => prev.map(c => (c.sala || 'sao_luis') === salaKey ? {
        ...c,
        disponivel_rodizio: disponivel ? 1 : 0,
        pausado_rodizio: disponivel ? 0 : c.pausado_rodizio
      } : c));
      if (disponivel) {
        setConfig(prev => ({ ...prev, [`sala_${salaKey}_ativa`]: 1 }));
      }
      addToast(
        disponivel
          ? `Todos os corretores da ${badge.name} foram colocados no plantão!`
          : `Plantão de todos os corretores da ${badge.name} foi pausado!`,
        'success'
      );
    } catch (error) {
      console.error('Erro ao atualizar plantão da sala:', error);
      addToast('Erro ao atualizar plantão da sala', 'error');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Gerenciamento de Rodízio por Sala & Produto</h1>
        <p className="text-secondary">Ative ou pause salas inteiras com 1 clique (São Luís, Salinas e Santo Amaro) e defina quais produtos cada corretor atende.</p>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Controle Rápido por Sala / Equipe</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {visibleSalas.map(sala => {
            const configKey = `sala_${sala.key}_ativa`;
            const isSalaAtiva = config?.[configKey] !== 0;
            const corretoresDaSala = corretores.filter(c => (c.sala || 'sao_luis') === sala.key);
            const noPlantaoCount = corretoresDaSala.filter(c => c.disponivel_rodizio === 1 && c.pausado_rodizio === 0).length;

            return (
              <div
                key={sala.key}
                className="card"
                style={{
                  padding: '1.25rem',
                  border: isSalaAtiva ? `1.5px solid ${sala.color}` : '1px solid var(--color-border)',
                  opacity: isSalaAtiva ? 1 : 0.72,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: sala.color }}>{sala.label}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {corretoresDaSala.length} corretor(es) cadastrado(s) • <strong>{noPlantaoCount} no plantão</strong>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    backgroundColor: isSalaAtiva ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                    color: isSalaAtiva ? '#10B981' : '#EF4444',
                    border: isSalaAtiva ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                    whiteSpace: 'nowrap'
                  }}>
                    {isSalaAtiva ? '● SALA ATIVA' : '⏸ SALA PAUSADA'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleToggleSalaAtiva(sala.key, isSalaAtiva)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: isSalaAtiva ? '#ef4444' : '#10b981',
                      color: '#fff'
                    }}
                  >
                    {isSalaAtiva ? 'Pausar Sala Inteira' : 'Ativar Sala no Rodízio'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => handleBulkPlantaoSala(sala.key, true)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    ✓ Colocar Todos no Plantão
                  </button>
                  <button
                    onClick={() => handleBulkPlantaoSala(sala.key, false)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    ✕ Tirar Todos do Plantão
                  </button>
                </div>

                <div style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    🔗 Link Exclusivo do Make para esta Sala:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      readOnly
                      value={`https://crm-sheets-park.onrender.com/api/webhooks/meta/${sala.key}`}
                      style={{
                        flex: 1,
                        fontSize: '0.72rem',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        color: 'var(--color-text-secondary)'
                      }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://crm-sheets-park.onrender.com/api/webhooks/meta/${sala.key}`);
                        addToast(`Link do Make da ${sala.name} copiado!`, 'success');
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: sala.bg,
                        color: sala.color,
                        border: `1px solid ${sala.border}`,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Copiar Link
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {config && (
        <section className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Configurações Gerais</h2>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
          
          <div style={{ 
            marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', 
            backgroundColor: '#e8f5e9',
            border: '1px solid #a5d6a7',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <div>
              <strong style={{ display: 'block', color: '#2e7d32' }}>
                Distribuição Inteligente por Praça (Salinas & Santo Amaro)
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#555' }}>
                Os leads de Salinas e Santo Amaro possuem filas independentes e balanceadas conforme os pesos configurados abaixo.
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Corretores por Sala & Filas de Produto</h2>
          {isSuperGestor && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSalaFilter('')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: salaFilter === '' ? '1px solid #00F5A0' : '1px solid var(--color-border)',
                  backgroundColor: salaFilter === '' ? 'rgba(0, 245, 160, 0.15)' : 'transparent',
                  color: salaFilter === '' ? '#00F5A0' : 'var(--color-text-secondary)'
                }}
              >
                Todas as Salas ({corretores.length})
              </button>
              {SALAS.map(s => {
                const count = corretores.filter(c => (c.sala || 'sao_luis') === s.key).length;
                const active = salaFilter === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSalaFilter(s.key)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      border: active ? `1px solid ${s.color}` : '1px solid var(--color-border)',
                      backgroundColor: active ? s.bg : 'transparent',
                      color: active ? s.color : 'var(--color-text-secondary)'
                    }}
                  >
                    {s.shortLabel} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Corretor</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Sala / Equipe</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>🌊 Produto Salinas</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>🌴 Produto Santo Amaro</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Status (Online/Offline)</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Plantão do Dia</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {corretores
                .filter(c => !salaFilter || (c.sala || 'sao_luis') === salaFilter)
                .map((corretor) => {
                const isOnline = corretor.pausado_rodizio === 0;
                const isDisponivel = corretor.disponivel_rodizio === 1;
                const pesoSalinas = corretor.peso_salinas ?? 0;
                const pesoSantoAmaro = corretor.peso_santo_amaro ?? 0;
                const salaBadge = getSalaBadge(corretor.sala);

                return (
                  <tr key={corretor.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600' }}>{corretor.nome}</div>
                      <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{corretor.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {isSuperGestor ? (
                        <select
                          className="input"
                          value={corretor.sala || 'sao_luis'}
                          onChange={(e) => handleSalaChange(corretor.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            border: `1px solid ${salaBadge.border}`,
                            backgroundColor: salaBadge.bg,
                            color: salaBadge.color,
                            cursor: 'pointer'
                          }}
                        >
                          {SALAS.map(s => (
                            <option key={s.key} value={s.key} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                              {s.label}
                            </option>
                          ))}
                          {corretor.role === 'gestor' && (
                            <option value="todas" style={{ backgroundColor: '#1a1a1a', color: '#00F5A0' }}>
                              🌐 Todas as Salas (Geral)
                            </option>
                          )}
                        </select>
                      ) : (
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
                          backgroundColor: salaBadge.bg, color: salaBadge.color, border: `1px solid ${salaBadge.border}`
                        }}>
                          {salaBadge.label}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        className="input"
                        value={pesoSalinas}
                        onChange={(e) => handlePesoChange(corretor.id, 'peso_salinas', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          border: pesoSalinas > 0 ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid var(--color-border)',
                          backgroundColor: pesoSalinas > 0 ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                          color: pesoSalinas > 0 ? '#38BDF8' : 'var(--color-text-secondary)'
                        }}
                      >
                        <option value={0}>Não recebe (0)</option>
                        <option value={1}>Ativo — Peso 1 (Normal)</option>
                        <option value={2}>Ativo — Peso 2 (Dobro)</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        className="input"
                        value={pesoSantoAmaro}
                        onChange={(e) => handlePesoChange(corretor.id, 'peso_santo_amaro', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          border: pesoSantoAmaro > 0 ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--color-border)',
                          backgroundColor: pesoSantoAmaro > 0 ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                          color: pesoSantoAmaro > 0 ? '#10B981' : 'var(--color-text-secondary)'
                        }}
                      >
                        <option value={0}>Não recebe (0)</option>
                        <option value={1}>Ativo — Peso 1 (Normal)</option>
                        <option value={2}>Ativo — Peso 2 (Prioridade)</option>
                      </select>
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
              
              {corretores.filter(c => !salaFilter || (c.sala || 'sao_luis') === salaFilter).length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-secondary)' }}>
                    Nenhum corretor encontrado nesta sala.
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

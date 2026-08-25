import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { FiPlus, FiSearch, FiFilter } from 'react-icons/fi';

const getEtapaColor = (etapa) => {
  const colors = {
    novo: '#3498db',
    contato_feito: '#f1c40f',
    visita_agendada: '#9b59b6',
    proposta: '#e67e22',
    documentacao: '#34495e',
    fechado: '#2ecc71',
    perdido: '#e74c3c'
  };
  return colors[etapa] || '#95a5a6';
};

const getEtapaLabel = (etapa) => {
  const labels = {
    novo: 'Novo',
    contato_feito: 'Contato Feito',
    visita_agendada: 'Visita Agendada',
    proposta: 'Proposta',
    documentacao: 'Documentação',
    fechado: 'Fechado',
    perdido: 'Perdido'
  };
  return labels[etapa] || etapa;
};

const getOrigemColor = (origem) => {
  const colors = {
    meta_ads: '#4267B2',
    google_ads: '#DB4437',
    manual: '#2c3e50'
  };
  return colors[origem] || '#95a5a6';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const cleanStr = dateStr.includes('T') || dateStr.endsWith('Z') 
    ? dateStr 
    : dateStr.replace(' ', 'T') + 'Z';
  return new Date(cleanStr).toLocaleDateString('pt-BR');
};

export default function Leads() {
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [etapaFilter, setEtapaFilter] = useState(searchParams.get('etapa') || '');
  const [origemFilter, setOrigemFilter] = useState('');
  const corretorId = searchParams.get('corretor_id');
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [corretorId]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (corretorId) params.corretor_id = corretorId;
      const data = await api.leads.getLeads(params);
      setLeads(data || []);
      setSelectedLeads([]); // clear selection on reload
    } catch (err) {
      addToast(err.message || 'Erro ao carregar leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lead.telefone || '').includes(searchTerm) ||
      (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesEtapa = etapaFilter ? lead.etapa === etapaFilter : true;
    const matchesOrigem = origemFilter ? lead.origem === origemFilter : true;

    return matchesSearch && matchesEtapa && matchesOrigem;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(filteredLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectOne = (e, id) => {
    e.stopPropagation(); // prevent row click
    if (e.target.checked) {
      setSelectedLeads(prev => [...prev, id]);
    } else {
      setSelectedLeads(prev => prev.filter(leadId => leadId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedLeads.length} lead(s) selecionado(s)? Esta ação é irreversível.`)) {
      return;
    }
    
    setIsDeletingBulk(true);
    let successCount = 0;
    
    try {
      // Execute in parallel chunks or one by one
      for (const id of selectedLeads) {
        await api.leads.deleteLead(id);
        successCount++;
      }
      addToast(`${successCount} lead(s) excluído(s) com sucesso.`, 'success');
      fetchLeads(); // refresh
    } catch (err) {
      addToast(`Erro ao excluir alguns leads. ${successCount} excluídos.`, 'error');
      fetchLeads(); // refresh anyway to show updated state
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, color: 'var(--color-text)' }}>Leads</h1>
        <button 
          onClick={() => navigate('/leads/novo')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'var(--color-primary, #007bff)', color: '#fff',
            border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          <FiPlus /> Novo Lead
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '10px', color: '#999' }} />
          <input 
            type="text" 
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 8px 8px 35px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <select 
          value={etapaFilter} 
          onChange={(e) => setEtapaFilter(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">Todas as Etapas</option>
          <option value="novo">Novo</option>
          <option value="contato_feito">Contato Feito</option>
          <option value="visita_agendada">Visita Agendada</option>
          <option value="proposta">Proposta</option>
          <option value="documentacao">Documentação</option>
          <option value="fechado">Fechado</option>
          <option value="perdido">Perdido</option>
        </select>
        <select 
          value={origemFilter} 
          onChange={(e) => setOrigemFilter(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">Todas as Origens</option>
          <option value="meta_ads">Meta Ads</option>
          <option value="google_ads">Google Ads</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {selectedLeads.length > 0 && (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '15px', 
          backgroundColor: 'var(--color-surface-hover)', padding: '12px 20px', 
          borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--color-border)' 
        }}>
          <span style={{ fontWeight: 600 }}>{selectedLeads.length} lead(s) selecionado(s)</span>
          <div style={{ flex: 1 }}></div>
          <button 
            onClick={handleBulkDelete}
            disabled={isDeletingBulk}
            style={{
              backgroundColor: '#e74c3c', color: 'white', border: 'none', 
              padding: '8px 16px', borderRadius: '4px', cursor: isDeletingBulk ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {isDeletingBulk ? 'Excluindo...' : 'Excluir Selecionados'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando leads...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Origem</th>
                  <th>Etapa</th>
                  <th>Empreendimento</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    style={{ cursor: 'pointer', backgroundColor: selectedLeads.includes(lead.id) ? 'var(--color-surface-hover)' : 'transparent' }}
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => handleSelectOne(e, lead.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ fontWeight: '500' }}>{lead.nome}</td>
                    <td>{lead.telefone}</td>
                    <td>
                      <span style={{ 
                        backgroundColor: getOrigemColor(lead.origem), color: '#fff', 
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase'
                      }}>
                        {lead.origem}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        backgroundColor: getEtapaColor(lead.etapa), color: '#fff', 
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase'
                      }}>
                        {getEtapaLabel(lead.etapa)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{lead.empreendimento_nome || '-'}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(lead.created_at)}</td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Nenhum lead encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

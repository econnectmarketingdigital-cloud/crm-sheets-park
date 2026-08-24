import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { FiPhone, FiMail, FiMessageCircle, FiEdit3, FiInfo, FiClock, FiCheck, FiXCircle, FiArrowRight } from 'react-icons/fi';
import ModalFechamentoVenda from '../components/ModalFechamentoVenda';

const ETAPAS = ['novo', 'contato_feito', 'visita_agendada', 'proposta', 'documentacao', 'fechado'];

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

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const cleanStr = dateStr.includes('T') || dateStr.endsWith('Z') 
    ? dateStr 
    : dateStr.replace(' ', 'T') + 'Z';
  return new Date(cleanStr).toLocaleString('pt-BR');
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [lead, setLead] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notaText, setNotaText] = useState('');
  const [showLostModal, setShowLostModal] = useState(false);
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadData, histData] = await Promise.all([
        api.leads.getLead(id),
        api.leads.getHistorico(id)
      ]);
      setLead(leadData);
      setHistorico(histData || []);
    } catch (err) {
      addToast('Erro ao carregar dados do lead', 'error');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNota = async () => {
    if (!notaText.trim()) return;
    try {
      setActionLoading(true);
      await api.leads.addNota(id, notaText);
      setNotaText('');
      addToast('Nota adicionada', 'success');
      fetchData();
    } catch (err) {
      addToast('Erro ao adicionar nota', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEtapaChange = async (novaEtapa) => {
    if (novaEtapa === lead.etapa) return;
    
    if (novaEtapa === 'perdido') {
      setShowLostModal(true);
      return;
    }

    if (novaEtapa === 'fechado') {
      setShowVendaModal(true);
      return;
    }

    try {
      setActionLoading(true);
      await api.leads.moveLeadEtapa(id, novaEtapa);
      addToast('Etapa atualizada com sucesso', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextEtapa = async () => {
    if (!lead) return;
    const currentIndex = ETAPAS.indexOf(lead.etapa);
    if (currentIndex >= 0 && currentIndex < ETAPAS.length - 1) {
      handleEtapaChange(ETAPAS[currentIndex + 1]);
    }
  };

  const handleMarkLost = async () => {
    if (!lostReason.trim()) {
      addToast('Motivo é obrigatório', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const token = localStorage.getItem('@CRM_Token');
      const response = await fetch(`/api/leads/${id}/etapa`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ etapa: 'perdido', perdido_motivo: lostReason })
      });
      if (!response.ok) throw new Error('Erro na requisição');
      
      setShowLostModal(false);
      setLostReason('');
      addToast('Lead marcado como perdido', 'success');
      fetchData();
    } catch (err) {
      addToast('Erro ao marcar como perdido', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>;
  if (!lead) return null;

  const getPhoneNumbers = (phone) => phone ? phone.replace(/\D/g, '') : '';

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lead.nome}
            <span style={{ fontSize: '0.5em', padding: '4px 8px', borderRadius: '12px', background: '#eee', color: '#333' }}>
              {lead.origem}
            </span>
            <span style={{ fontSize: '0.5em', padding: '4px 8px', borderRadius: '12px', background: lead.etapa === 'perdido' ? '#e74c3c' : 'var(--color-primary, #007bff)', color: '#fff' }}>
              {getEtapaLabel(lead.etapa)}
            </span>
          </h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href={`https://wa.me/55${getPhoneNumbers(lead.telefone)}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#25D366', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
              <FiMessageCircle /> WhatsApp
            </a>
            <a href={`tel:${getPhoneNumbers(lead.telefone)}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#3498db', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
              <FiPhone /> Ligar
            </a>
            {lead.email && (
              <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#95a5a6', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
                <FiMail /> Email
              </a>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {lead.etapa !== 'perdido' && lead.etapa !== 'fechado' && (
            <>
              <button 
                onClick={() => setShowLostModal(true)}
                style={{ padding: '8px 12px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <FiXCircle /> Perdido
              </button>
              <button 
                onClick={() => setShowVendaModal(true)}
                style={{ padding: '8px 12px', background: 'var(--color-success)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
              >
                💰 Registrar Venda
              </button>
              <button 
                onClick={handleNextEtapa} disabled={actionLoading}
                style={{ padding: '8px 12px', background: 'var(--color-primary, #007bff)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
              >
                Avançar Etapa <FiArrowRight />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      {lead.etapa !== 'perdido' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', background: 'var(--color-surface, #fff)', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
          {ETAPAS.map((etp, idx) => {
            const currentIdx = ETAPAS.indexOf(lead.etapa);
            const isCompleted = idx <= currentIdx;
            return (
              <div key={etp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: isCompleted ? 1 : 0.4, minWidth: '100px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isCompleted ? 'var(--color-primary, #007bff)' : '#ccc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  {isCompleted ? <FiCheck /> : idx + 1}
                </div>
                <span style={{ fontSize: '0.85em', textAlign: 'center', fontWeight: isCompleted ? 'bold' : 'normal' }}>
                  {getEtapaLabel(etp)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Left Column */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Info Card */}
          <div style={{ background: 'var(--color-surface, #fff)', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiInfo /> Informações
            </h3>
            <p style={{ margin: '8px 0' }}><strong>Telefone:</strong> {lead.telefone || '-'}</p>
            <p style={{ margin: '8px 0' }}><strong>Email:</strong> {lead.email || '-'}</p>
            <p style={{ margin: '8px 0' }}><strong>Empreendimento:</strong> {lead.empreendimento_nome || lead.empreendimento_interesse_id || '-'}</p>
            <p style={{ margin: '8px 0' }}><strong>Corretor Responsável:</strong> {lead.corretor_nome || 'Nenhum'}</p>
            {lead.faixa_renda && <p style={{ margin: '8px 0' }}><strong>Renda Informada:</strong> {lead.faixa_renda}</p>}
            {lead.campanha && <p style={{ margin: '8px 0' }}><strong>Campanha:</strong> {lead.campanha}</p>}
            <p style={{ margin: '8px 0' }}><strong>Observações Iniciais:</strong><br/>{lead.observacoes || '-'}</p>
          </div>

          {/* Add Note */}
          <div style={{ background: 'var(--color-surface, #fff)', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiEdit3 /> Nova Nota
            </h3>
            <textarea 
              value={notaText} onChange={(e) => setNotaText(e.target.value)}
              placeholder="Digite aqui..." rows="4"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical', marginBottom: '10px' }}
            />
            <button 
              onClick={handleAddNota} disabled={actionLoading}
              style={{ padding: '8px 16px', background: 'var(--color-primary, #007bff)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Adicionar Nota
            </button>
          </div>
        </div>

        {/* Right Column - Timeline */}
        <div style={{ flex: '2 1 400px', background: 'var(--color-surface, #fff)', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <FiClock /> Histórico
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {historico.length === 0 ? (
              <p style={{ color: '#999' }}>Nenhum histórico encontrado.</p>
            ) : (
              historico.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '15px', borderLeft: '2px solid #eee', paddingLeft: '15px', position: 'relative' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary, #007bff)', position: 'absolute', left: '-6px', top: '5px' }}></div>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>
                      <strong>{item.corretor_nome || 'Sistema'}</strong>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95em' }}>
                      {item.tipo === 'mudanca_etapa' ? (
                        <span>Mudou etapa de <strong>{getEtapaLabel(item.etapa_anterior)}</strong> para <strong>{getEtapaLabel(item.etapa_nova)}</strong></span>
                      ) : (
                        item.descricao
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Lost Modal */}
      {showLostModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Marcar como Perdido</h3>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Motivo *</label>
            <textarea 
              value={lostReason} onChange={(e) => setLostReason(e.target.value)} rows="3"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '15px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowLostModal(false)} style={{ padding: '8px 16px', background: '#f9f9f9', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleMarkLost} disabled={actionLoading} style={{ padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <ModalFechamentoVenda
        isOpen={showVendaModal}
        onClose={() => setShowVendaModal(false)}
        leadId={id}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}

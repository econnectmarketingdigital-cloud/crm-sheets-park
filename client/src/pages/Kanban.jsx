import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { FiClock, FiMessageCircle, FiPhone } from 'react-icons/fi';
import ModalFechamentoVenda from '../components/ModalFechamentoVenda';

const columns = [
  { id: 'novo', title: 'Novo' },
  { id: 'contato_feito', title: 'Contato Feito' },
  { id: 'visita_agendada', title: 'Visita Agendada' },
  { id: 'proposta', title: 'Proposta' },
  { id: 'documentacao', title: 'Documentação' },
  { id: 'fechado', title: 'Fechado' },
  { id: 'perdido', title: 'Perdido/S. Resposta' },
];

const originBadgeClass = (origem) => {
  if (origem === 'meta_ads') return 'badge-meta';
  if (origem === 'google_ads') return 'badge-google';
  return 'badge-manual';
};

const originLabel = (origem) => {
  if (origem === 'meta_ads') return 'Meta';
  if (origem === 'google_ads') return 'Google';
  return 'Manual';
};

const Kanban = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await api.leads.getLeads();
      setLeads(Array.isArray(data) ? data : (data?.leads || []));
    } catch (err) {
      addToast(err.message || 'Erro ao carregar leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getLeadsByEtapa = (etapa) => {
    return leads.filter(lead => lead.etapa === etapa);
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newEtapa = destination.droppableId;
    
    if (newEtapa === 'fechado') {
      setActiveLeadId(draggableId);
      setShowVendaModal(true);
      return;
    }

    let motivo = null;
    if (newEtapa === 'perdido') {
      motivo = window.prompt("Qual o motivo da perda/sem resposta?");
      if (!motivo) return; // cancel drag
    }

    // Optimistic update
    const updatedLeads = leads.map(lead => {
      if (lead.id === draggableId) {
        return { ...lead, etapa: newEtapa };
      }
      return lead;
    });
    setLeads(updatedLeads);

    try {
      await api.leads.moveLeadEtapa(draggableId, newEtapa, motivo);
      addToast('Lead movido com sucesso', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao mover lead', 'error');
      fetchLeads(); // Revert on failure
    }
  };

  const formatTimeSince = (dateString) => {
    if (!dateString) return 'Sem contato';
    const diff = new Date() - new Date(dateString);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div className="flex-col h-full">
      <h1 className="font-heading" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Kanban de Vendas</h1>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div data-tour="kanban-board" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '1rem', height: 'calc(100vh - 120px)' }}>
          {columns.map(col => {
            const colLeads = getLeadsByEtapa(col.id);
            return (
              <div key={col.id} style={{ minWidth: '260px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--color-surface)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{col.title}</span>
                  <span className="badge" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>{colLeads.length}</span>
                </div>
                
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      style={{
                        minHeight: '100px',
                        flex: '1',
                        overflowY: 'auto',
                        padding: '0.25rem',
                        paddingRight: '0.5rem',
                        borderRadius: '8px',
                        backgroundColor: snapshot.isDraggingOver ? 'var(--color-surface-hover)' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {colLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className="card"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/leads/${lead.id}`)}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                                marginBottom: '0.5rem',
                                padding: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', margin: 0 }}>{lead.nome}</h4>
                                <span className={`badge ${originBadgeClass(lead.origem)}`} style={{ fontSize: '0.7rem' }}>
                                  {originLabel(lead.origem)}
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 0.5rem 0' }}>
                                {lead.empreendimento_nome ? (
                                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                                    {lead.empreendimento_nome}
                                  </p>
                                ) : <span />}
                                {lead.corretor_nome && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', background: 'var(--color-primary-soft)', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                                    {lead.corretor_nome}
                                  </span>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                                  <FiClock size={12} />
                                  <span>{formatTimeSince(lead.ultimo_contato || lead.created_at)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {lead.telefone && (
                                    <a href={`https://wa.me/55${lead.telefone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                                       onClick={e => e.stopPropagation()} 
                                       style={{ color: 'var(--color-success)', padding: '2px' }}>
                                      <FiMessageCircle size={14} />
                                    </a>
                                  )}
                                  {lead.telefone && (
                                    <a href={`tel:${lead.telefone}`} onClick={e => e.stopPropagation()}
                                       style={{ color: 'var(--color-info)', padding: '2px' }}>
                                      <FiPhone size={14} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <ModalFechamentoVenda
        isOpen={showVendaModal}
        onClose={() => setShowVendaModal(false)}
        leadId={activeLeadId}
        onSuccess={() => {
          fetchLeads();
        }}
      />
    </div>
  );
};

export default Kanban;

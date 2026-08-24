import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function ModalFechamentoVenda({ isOpen, onClose, leadId, onSuccess }) {
  const { addToast } = useToast();
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEmpreendimentos();
    }
  }, [isOpen]);

  const fetchEmpreendimentos = async () => {
    try {
      const data = await api.empreendimentos.getEmpreendimentos();
      setEmpreendimentos(data || []);
      if (data && data.length > 0) {
        setEmpreendimentoId(data[0].id);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const formatCurrencyInput = (value) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) return '';
    const number = parseInt(clean, 10) / 100;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
  };

  const getRawValue = (formatted) => {
    if (!formatted) return 0;
    const clean = formatted.replace(/\D/g, '');
    return parseInt(clean, 10) / 100;
  };

  const handleValorChange = (e) => {
    setValorVenda(formatCurrencyInput(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valorReal = getRawValue(valorVenda);
    if (!empreendimentoId || valorReal <= 0) {
      addToast('Selecione o empreendimento e informe um valor válido.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.leads.fecharVenda(leadId, {
        empreendimento_id: empreendimentoId,
        valor_venda: valorReal
      });
      addToast('Venda registrada com sucesso! VGV atualizado.', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
        <h2 className="font-heading" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-success)' }}>
          💰 Registrar Fechamento de Venda
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Parabéns pela venda! Preencha os dados abaixo para contabilizar o seu VGV no painel.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label>Qual produto/empreendimento foi vendido?</label>
            <select 
              className="input" 
              value={empreendimentoId} 
              onChange={e => setEmpreendimentoId(e.target.value)}
              required
            >
              <option value="" disabled>Selecione um empreendimento</option>
              {empreendimentos.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Valor Bruto da Venda (VGV)</label>
            <input
              type="text"
              className="input"
              value={valorVenda}
              onChange={handleValorChange}
              placeholder="R$ 0,00"
              required
              style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-accent)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn" style={{ flex: 1, backgroundColor: 'var(--color-success)', color: '#fff' }}>
              {submitting ? 'Salvando...' : 'Confirmar Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

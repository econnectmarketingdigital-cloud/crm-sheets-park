import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const formatPhone = (val) => {
  let v = val.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
  if (v.length > 10) v = `${v.slice(0,10)}-${v.slice(10)}`;
  return v;
};

export default function NovoLead() {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    empreendimento_interesse_id: '',
    observacoes: ''
  });
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    api.empreendimentos.getEmpreendimentos()
      .then(data => setEmpreendimentos(data || []))
      .catch(err => addToast('Erro ao carregar empreendimentos', 'error'));
  }, [addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'telefone' ? formatPhone(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.telefone) {
      return addToast('Nome e telefone são obrigatórios', 'error');
    }
    
    setLoading(true);
    try {
      await api.leads.createLead({
        ...formData,
        origem: 'manual'
      });
      addToast('Lead criado com sucesso!', 'success');
      navigate('/kanban');
    } catch (err) {
      addToast(err.message || 'Erro ao criar lead', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Novo Lead</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: 'var(--color-surface, #fff)', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome *</label>
          <input 
            type="text" name="nome" value={formData.nome} onChange={handleChange} required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Telefone *</label>
          <input 
            type="text" name="telefone" value={formData.telefone} onChange={handleChange} required
            placeholder="(XX) XXXXX-XXXX"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input 
            type="email" name="email" value={formData.email} onChange={handleChange}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Empreendimento de Interesse</label>
          <select 
            name="empreendimento_interesse_id" value={formData.empreendimento_interesse_id} onChange={handleChange}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Ainda não definido / Nenhum específico</option>
            {empreendimentos.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Observações</label>
          <textarea 
            name="observacoes" value={formData.observacoes} onChange={handleChange} rows="4"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button 
            type="button" onClick={() => navigate(-1)}
            style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: '#f9f9f9', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            type="submit" disabled={loading}
            style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-primary, #007bff)', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Salvando...' : 'Salvar Lead'}
          </button>
        </div>

      </form>
    </div>
  );
}

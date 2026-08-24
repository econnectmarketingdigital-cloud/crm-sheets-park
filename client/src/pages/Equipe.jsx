import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUserPlus, FiUser, FiPower } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Equipe() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [novoCorretor, setNovoCorretor] = useState({ nome: '', email: '', senha: '' });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await api.usuarios.getUsuarios();
      setUsuarios(data || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAtivo = async (id, currentStatus) => {
    try {
      await api.usuarios.toggleUsuarioAtivo(id, { ativo: !currentStatus });
      addToast('Status do usuário atualizado.', 'success');
      fetchUsuarios();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddCorretor = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.auth.register({ 
        nome: novoCorretor.nome, 
        email: novoCorretor.email, 
        senha: novoCorretor.senha, 
        role: 'corretor' 
      });
      addToast('Corretor adicionado com sucesso!', 'success');
      setNovoCorretor({ nome: '', email: '', senha: '' });
      fetchUsuarios();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o corretor ${nome}?`)) {
      try {
        await api.usuarios.deleteUsuario(id);
        addToast('Usuário excluído.', 'success');
        fetchUsuarios();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  if (loading) return <div className="p-6 text-center text-[var(--color-text-secondary)]">Carregando equipe...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 className="font-heading" style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--color-primary)' }}>Minha Equipe</h1>

      {user?.role === 'gestor' && (
        <div className="card" style={{ marginBottom: '2rem', maxWidth: '800px' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiUserPlus /> Novo Corretor
            </h2>
          </div>
          <form onSubmit={handleAddCorretor} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Nome</label>
              <input
                type="text"
                required
                value={novoCorretor.nome}
                onChange={e => setNovoCorretor({...novoCorretor, nome: e.target.value})}
                className="input"
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Gmail (Para acesso)</label>
              <input
                type="email"
                required
                value={novoCorretor.email}
                onChange={e => setNovoCorretor({...novoCorretor, email: e.target.value})}
                className="input"
                placeholder="joao@gmail.com"
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Senha Inicial</label>
              <input
                type="password"
                required
                value={novoCorretor.senha}
                onChange={e => setNovoCorretor({...novoCorretor, senha: e.target.value})}
                className="input"
                placeholder="****"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ height: '42px', width: '100%' }}>
              {submitting ? 'Adicionando...' : 'Cadastrar'}
            </button>
          </form>
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Dica: Ao cadastrar um Gmail válido, o corretor poderá usar o botão "Entrar com o Google" imediatamente sem precisar digitar a senha!
          </p>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Acesso</th>
                <th>Status Plantão</th>
                {user?.role === 'gestor' && <th style={{ textAlign: 'right' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.6 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate(`/equipe/${u.id}`)}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                      }}>
                        {u.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{u.nome}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                      backgroundColor: u.role === 'gestor' ? 'var(--color-primary-soft)' : 'rgba(255,255,255,0.1)',
                      color: u.role === 'gestor' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.role === 'corretor' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.disponivel_rodizio ? 'var(--color-success)' : 'var(--color-danger)' }} />
                        <span style={{ fontSize: '0.85rem' }}>{u.disponivel_rodizio ? 'Disponível (Rodízio)' : 'Fora do Rodízio'}</span>
                      </div>
                    ) : '-'}
                  </td>
                  {user?.role === 'gestor' && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {user.id !== u.id && (
                          <>
                            <button
                              onClick={() => toggleAtivo(u.id, u.ativo)}
                              className={`btn ${u.ativo ? 'btn-outline' : 'btn-success'}`}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              {u.ativo ? 'Desativar' : 'Reativar'}
                            </button>
                            <button
                              onClick={() => handleExcluir(u.id, u.nome)}
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiHome, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function EmpreendimentoDetail() {
  const { id } = useParams();
  const [empreendimento, setEmpreendimento] = useState(null);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empData, uniData] = await Promise.all([
        api.empreendimentos.getEmpreendimento(id),
        api.unidades.getUnidades(id)
      ]);
      setEmpreendimento(empData);
      setUnidades(uniData || []);
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

  if (loading) return <div className="p-6 text-center text-[var(--color-text-secondary)]">Carregando detalhes...</div>;
  if (!empreendimento) return <div className="p-6 text-center text-red-500">Empreendimento não encontrado.</div>;

  const stats = {
    total: unidades.length,
    disponivel: unidades.filter(u => u.status === 'disponivel').length,
    reservado: unidades.filter(u => u.status === 'reservado').length,
    vendido: unidades.filter(u => u.status === 'vendido').length
  };

  return (
    <div className="p-6">
      <div className="mb-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{empreendimento.nome}</h1>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${empreendimento.tipo === 'MCMV' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {empreendimento.tipo}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><FiHome /> Total</div>
            <div className="text-xl font-semibold">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="text-sm text-green-600 mb-1 flex items-center gap-1"><FiCheckCircle /> Disponíveis</div>
            <div className="text-xl font-semibold text-green-700">{stats.disponivel}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
            <div className="text-sm text-orange-600 mb-1 flex items-center gap-1"><FiClock /> Reservadas</div>
            <div className="text-xl font-semibold text-orange-700">{stats.reservado}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="text-sm text-red-600 mb-1 flex items-center gap-1"><FiXCircle /> Vendidas</div>
            <div className="text-xl font-semibold text-red-700">{stats.vendido}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Unidades</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {unidades.map(unidade => (
          <div key={unidade.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${
              unidade.status === 'disponivel' ? 'bg-green-500' : 
              unidade.status === 'reservado' ? 'bg-orange-500' : 'bg-red-500'
            }`} />
            
            <div className="flex justify-between items-center mb-2 mt-1">
              <span className="font-bold text-lg text-[var(--color-text)]">{unidade.numero}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                unidade.status === 'disponivel' ? 'bg-green-100 text-green-800' : 
                unidade.status === 'reservado' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
              }`}>
                {unidade.status.charAt(0).toUpperCase() + unidade.status.slice(1)}
              </span>
            </div>
            
            <div className="text-sm text-[var(--color-text-secondary)] space-y-1 mb-3">
              <div>Tipo: <span className="font-medium text-[var(--color-text)]">{unidade.tipologia}</span></div>
              <div>Área: <span className="font-medium text-[var(--color-text)]">{unidade.area_m2} m²</span></div>
            </div>
            
            <div className="mt-auto font-semibold text-[var(--color-primary)]">
              {formatCurrency(unidade.valor)}
            </div>
          </div>
        ))}
        {unidades.length === 0 && (
          <div className="col-span-full text-center py-6 text-[var(--color-text-secondary)]">Nenhuma unidade cadastrada.</div>
        )}
      </div>
    </div>
  );
}

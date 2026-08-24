import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabase';
import api from '../services/api';
import { FiImage, FiUpload, FiCheck, FiMove, FiSave } from 'react-icons/fi';

const Perfil = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [savingPos, setSavingPos] = useState(false);

  // Parse existing position or default to 50% 50%
  const parsePos = (posStr) => {
    if (!posStr) return { x: 50, y: 50 };
    const parts = posStr.split(' ');
    if (parts.length === 2) {
      const px = parseFloat(parts[0]) || 50;
      const py = parseFloat(parts[1]) || 50;
      return { x: px, y: py };
    }
    return { x: 50, y: 50 };
  };

  const [pos, setPos] = useState(() => parsePos(user?.wallpaper_position));
  const isDragging = useRef(false);
  const startCoords = useRef({ x: 0, y: 0, posX: 50, posY: 50 });

  useEffect(() => {
    if (user?.wallpaper_position) {
      setPos(parsePos(user.wallpaper_position));
    }
  }, [user?.wallpaper_position]);

  const handleFileChange = async (event) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      
      setUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('wallpapers')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wallpapers')
        .getPublicUrl(filePath);
        
      const defaultPos = '50% 50%';
      setPos({ x: 50, y: 50 });

      // Update User in Backend
      await api.auth.updateProfile({ wallpaper_url: publicUrl, wallpaper_position: defaultPos });
      
      // Add to local user context
      updateUser({ wallpaper_url: publicUrl, wallpaper_position: defaultPos });
      
      addToast('Capa enviada! Ajuste a posição arrastando a imagem abaixo.', 'success');
    } catch (error) {
      console.error(error);
      addToast('Erro ao enviar imagem. Verifique se o bucket "wallpapers" é público.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startCoords.current = {
      x: e.clientX,
      y: e.clientY,
      posX: pos.x,
      posY: pos.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - startCoords.current.x;
    const deltaY = e.clientY - startCoords.current.y;

    // Sensibility scaling
    const newX = Math.max(0, Math.min(100, startCoords.current.posX - (deltaX * 0.2)));
    const newY = Math.max(0, Math.min(100, startCoords.current.posY - (deltaY * 0.2)));

    const updated = { x: Math.round(newX), y: Math.round(newY) };
    setPos(updated);
    updateUser({ wallpaper_position: `${updated.x}% ${updated.y}%` });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleSliderYChange = (e) => {
    const newY = Number(e.target.value);
    const updated = { ...pos, y: newY };
    setPos(updated);
    updateUser({ wallpaper_position: `${updated.x}% ${updated.y}%` });
  };

  const handleSliderXChange = (e) => {
    const newX = Number(e.target.value);
    const updated = { ...pos, x: newX };
    setPos(updated);
    updateUser({ wallpaper_position: `${updated.x}% ${updated.y}%` });
  };

  const handleSavePosition = async () => {
    try {
      setSavingPos(true);
      const posString = `${pos.x}% ${pos.y}%`;
      await api.auth.updateProfile({ wallpaper_position: posString });
      updateUser({ wallpaper_position: posString });
      addToast('Enquadramento salvo com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar enquadramento', 'error');
    } finally {
      setSavingPos(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '850px', margin: '0 auto' }}>
      <h1 className="font-heading" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Meu Perfil</h1>
      
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 className="font-heading" style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiImage color="var(--color-primary)" /> Personalizar Papel de Parede
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Escolha uma foto da sua galeria para usar como plano de fundo do seu CRM. 
          Você pode arrastar a imagem abaixo para ajustar o enquadramento perfeito (estilo capa de rede social).
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label 
            className="btn btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}
          >
            {uploading ? <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }}></div> : <FiUpload />}
            {uploading ? 'Enviando...' : 'Escolher Nova Imagem'}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              disabled={uploading}
              style={{ display: 'none' }} 
            />
          </label>

          {user?.wallpaper_url && (
            <>
              <button 
                className="btn btn-primary"
                onClick={handleSavePosition}
                disabled={savingPos}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#7CB99B', borderColor: '#7CB99B', color: '#111' }}
              >
                {savingPos ? <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#111' }}></div> : <FiSave />}
                Salvar Enquadramento
              </button>

              <button 
                className="btn btn-outline" 
                onClick={async () => {
                  await api.auth.updateProfile({ wallpaper_url: null, wallpaper_position: null });
                  updateUser({ wallpaper_url: null, wallpaper_position: null });
                  addToast('Papel de parede removido', 'info');
                }}
                style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
              >
                Remover Imagem
              </button>
            </>
          )}
        </div>
        
        {user?.wallpaper_url && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FiMove color="var(--color-primary)" /> Clique e arraste na foto para reposicionar ou use as barras abaixo:
              </span>
              <span style={{ fontSize: '0.8rem', color: '#7CB99B', background: 'rgba(124, 185, 155, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                Posição: X={pos.x}% | Y={pos.y}%
              </span>
            </div>

            {/* Interactive Drag Box */}
            <div 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ 
                border: '2px dashed var(--color-primary)', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                position: 'relative', 
                height: '240px',
                cursor: 'grab',
                backgroundImage: `url(${user.wallpaper_url})`,
                backgroundSize: 'cover',
                backgroundPosition: `${pos.x}% ${pos.y}%`,
                userSelect: 'none',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                <FiMove /> Arraste para enquadrar
              </div>
              <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#7CB99B' }}>
                <FiCheck /> Pré-visualização Ativa
              </div>
            </div>

            {/* Precision Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  Ajuste Vertical (Cima / Baixo): <strong>{pos.y}%</strong>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={pos.y} 
                  onChange={handleSliderYChange}
                  style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  Ajuste Horizontal (Esquerda / Direita): <strong>{pos.x}%</strong>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={pos.x} 
                  onChange={handleSliderXChange}
                  style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;

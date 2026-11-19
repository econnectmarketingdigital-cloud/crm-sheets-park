import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getWhatsAppUrl(phone) {
  if (!phone) return '#';
  let digits = phone.replace(/\D/g, '');
  while (digits.startsWith('5555')) {
    digits = digits.substring(2);
  }
  if (!digits.startsWith('55')) {
    digits = '55' + digits;
  }
  return `https://wa.me/${digits}`;
}

export function getCampanhaBadge(campanha, empNome) {
  const rawText = empNome || campanha;
  if (!rawText || rawText === 'Meta Ads' || rawText === 'manual' || rawText === 'google_ads') return null;

  const lower = `${campanha || ''} ${empNome || ''}`.toLowerCase();
  if (lower.includes('salinas')) {
    return { label: '🌊 Salinas', bg: 'rgba(56, 189, 248, 0.18)', color: '#38BDF8', border: 'rgba(56, 189, 248, 0.45)' };
  }
  if (lower.includes('amaro') || lower.includes('santa amaro') || lower.includes('santo amaro') || lower.includes('santa maria')) {
    return { label: '🌴 Santo Amaro', bg: 'rgba(16, 185, 129, 0.18)', color: '#10B981', border: 'rgba(16, 185, 129, 0.45)' };
  }
  if (lower.includes('beira') || lower.includes('rio')) {
    return { label: '⛵ Beira-Rio', bg: 'rgba(251, 191, 36, 0.18)', color: '#FBBF24', border: 'rgba(251, 191, 36, 0.45)' };
  }
  if (lower.includes('comercial') || lower.includes('comerciais')) {
    return { label: '🏢 Comercial', bg: 'rgba(168, 85, 247, 0.18)', color: '#A855F7', border: 'rgba(168, 85, 247, 0.45)' };
  }
  if (lower.includes('residencial') || lower.includes('residenciais')) {
    return { label: '🏡 Residencial', bg: 'rgba(0, 245, 160, 0.18)', color: '#00F5A0', border: 'rgba(0, 245, 160, 0.45)' };
  }

  const cleanLabel = rawText.replace(/campanha\s*[-_:]?\s*/i, '').trim();
  return { label: `🏷️ ${cleanLabel}`, bg: 'rgba(255, 255, 255, 0.08)', color: '#E2E8F0', border: 'rgba(255, 255, 255, 0.2)' };
}

export const SALAS = [
  {
    key: 'sao_luis',
    label: '🏛️ Sala São Luís (MA)',
    shortLabel: '🏛️ São Luís',
    name: 'Sala São Luís',
    color: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.14)',
    border: 'rgba(167, 139, 250, 0.38)'
  },
  {
    key: 'salinas',
    label: '🌊 Sala Salinas (PA)',
    shortLabel: '🌊 Salinas',
    name: 'Sala Salinas',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.38)'
  },
  {
    key: 'santo_amaro',
    label: '🌴 Sala Santo Amaro (MA)',
    shortLabel: '🌴 Santo Amaro',
    name: 'Sala Santo Amaro',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.38)'
  }
];

export function getSalaBadge(salaKey) {
  if (salaKey === 'todas') {
    return {
      key: 'todas',
      label: '🌐 Todas as Salas (Geral)',
      shortLabel: '🌐 Geral',
      name: 'Todas as Salas',
      color: '#00F5A0',
      bg: 'rgba(0, 245, 160, 0.14)',
      border: 'rgba(0, 245, 160, 0.38)'
    };
  }
  const found = SALAS.find(s => s.key === (salaKey || 'sao_luis'));
  return found || SALAS[0];
}

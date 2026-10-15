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
  const text = empNome || campanha;
  if (!text || text === 'Meta Ads' || text === 'manual' || text === 'google_ads') return null;

  const lower = text.toLowerCase();
  if (lower.includes('salinas')) {
    return { label: '🌊 Salinas', bg: 'rgba(56, 189, 248, 0.18)', color: '#38BDF8', border: 'rgba(56, 189, 248, 0.45)' };
  }
  if (lower.includes('amaro') || lower.includes('santa amaro') || lower.includes('santo amaro')) {
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

  const cleanLabel = text.replace(/campanha\s*[-_:]?\s*/i, '').trim();
  return { label: `🏷️ ${cleanLabel}`, bg: 'rgba(255, 255, 255, 0.08)', color: '#E2E8F0', border: 'rgba(255, 255, 255, 0.2)' };
}

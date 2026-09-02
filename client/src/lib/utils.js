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

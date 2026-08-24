import { getDb } from '../database.js';

export const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('55')) {
     return digits.substring(2);
  }
  return digits || null;
};

export const findExistingLead = async (telefone, email) => {
  const db = getDb();
  const normPhone = normalizePhone(telefone);
  
  if (normPhone) {
    const leadByPhone = await db.queryOne('SELECT * FROM leads WHERE telefone = ?', [normPhone]);
    if (leadByPhone) return leadByPhone;
  }
  
  if (email && email.trim() !== '') {
    const leadByEmail = await db.queryOne('SELECT * FROM leads WHERE email = ?', [email.trim()]);
    if (leadByEmail) return leadByEmail;
  }
  
  return null;
};

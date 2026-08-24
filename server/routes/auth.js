import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database.js';
import { generateToken, authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/login', async (req, res) => {
  const db = getDb();
  const { email, password, senha } = req.body;
  const loginSenha = password || senha;
  
  if (!email || !loginSenha) return res.status(400).json({ success: false, error: 'Email e senha sÃ£o obrigatÃ³rios' });

  try {
    const user = await db.queryOne('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email]);
    if (!user) return res.status(401).json({ success: false, error: 'Credenciais inválidas ou usuário inativo' });

    const validPassword = bcrypt.compareSync(loginSenha, user.senha_hash);
    if (!validPassword) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });

    const token = generateToken(user);
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, nome: user.nome, role: user.role, wallpaper_url: user.wallpaper_url, wallpaper_position: user.wallpaper_position } } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/google', async (req, res) => {
  const db = getDb();
  const { email, nome } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email do Google não fornecido' });
  }

  try {
    const user = await db.queryOne('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email.trim().toLowerCase()]);
    
    if (!user) {
      return res.status(403).json({ 
        success: false, 
        error: `O e-mail "${email}" não está cadastrado na equipe. Peça ao gestor para liberar seu acesso.` 
      });
    }

    const token = generateToken(user);
    res.json({ 
      success: true, 
      data: { 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          nome: user.nome, 
          role: user.role,
          wallpaper_url: user.wallpaper_url,
          wallpaper_position: user.wallpaper_position
        } 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/register', authenticateToken, requireRole('gestor'), async (req, res) => {
  const db = getDb();
  const { nome, email, telefone, senha, role } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ success: false, error: 'Campos obrigatórios ausentes' });

  try {
    const existing = await db.queryOne('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ success: false, error: 'Email já cadastrado' });

    const id = uuidv4();
    const hash = bcrypt.hashSync(senha, 10);
    const userRole = role || 'corretor';

    await db.execute(`
      INSERT INTO usuarios (id, nome, email, telefone, senha_hash, role, disponivel_rodizio)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [id, nome, email, telefone, hash, userRole]);
    res.json({ success: true, data: { id, nome, email, role: userRole } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  const db = getDb();
  try {
    const user = await db.queryOne('SELECT id, nome, email, telefone, role, ativo, meta_vgv_pessoal, pausado_rodizio, disponivel_rodizio, wallpaper_url, wallpaper_position FROM usuarios WHERE id = ?', [req.user.id]);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  const db = getDb();
  const { nome, telefone, wallpaper_url, wallpaper_position } = req.body;
  try {
    await db.execute('UPDATE usuarios SET nome = COALESCE(?, nome), telefone = COALESCE(?, telefone), wallpaper_url = COALESCE(?, wallpaper_url), wallpaper_position = COALESCE(?, wallpaper_position) WHERE id = ?', [nome || null, telefone || null, wallpaper_url !== undefined ? wallpaper_url : null, wallpaper_position !== undefined ? wallpaper_position : null, req.user.id]);
    res.json({ success: true, data: 'Atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar' });
  }
});

export default router;


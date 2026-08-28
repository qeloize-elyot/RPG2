const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { generateToken, authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Entrar', error: null });
});

router.get('/register', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('register', { title: 'Registrar', error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { title: 'Entrar', error: 'Preencha todos os campos.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('login', { title: 'Entrar', error: 'Credenciais inválidas.' });
  }
  const token = generateToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });
  res.redirect('/dashboard');
});

router.post('/register', (req, res) => {
  const { username, email, password, display_name } = req.body;
  if (!username || !email || !password) {
    return res.render('register', { title: 'Registrar', error: 'Preencha os campos obrigatórios.' });
  }
  if (password.length < 6) {
    return res.render('register', { title: 'Registrar', error: 'Senha deve ter no mínimo 6 caracteres.' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (exists) {
    return res.render('register', { title: 'Registrar', error: 'Usuário ou email já existe.' });
  }
  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (id, username, email, password, display_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, username, email, hash, display_name || username);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const token = generateToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

router.get('/profile', authRequired, (req, res) => {
  res.render('profile', { title: 'Perfil', user: req.user });
});

router.post('/profile', authRequired, (req, res) => {
  const { display_name, bio } = req.body;
  db.prepare('UPDATE users SET display_name = ?, bio = ? WHERE id = ?')
    .run(display_name || req.user.username, bio || '', req.user.id);
  res.redirect('/profile');
});

module.exports = router;

const jwt = require('jsonwebtoken');
const { db } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'aether_dark_secret_change_in_production_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authRequired(req, res, next) {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, display_name, role, bio, avatar_url FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    req.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.redirect('/login');
  }
}

function optionalAuth(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT id, username, email, display_name, role, bio, avatar_url FROM users WHERE id = ?').get(decoded.id);
      if (user) req.user = user;
    } catch (e) {}
  }
  next();
}

module.exports = { generateToken, authRequired, optionalAuth, JWT_SECRET };

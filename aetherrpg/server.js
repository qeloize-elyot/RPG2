require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const { initDatabase } = require('./db/database');
const { optionalAuth, authRequired } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const characterRoutes = require('./routes/characters');

const app = express();
const PORT = process.env.PORT || 3000;

// Init DB
initDatabase();

// Security & middleware
app.use(helmet({
  contentSecurityPolicy: false // allow inline for simplicity in demo
}));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global user for templates
app.use(optionalAuth);
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/characters', characterRoutes);

app.get('/', (req, res) => {
  res.render('index', { title: 'AetherRPG — Portal das Sombras' });
});

app.get('/dashboard', authRequired, (req, res) => {
  const { db } = require('./db/database');
  const myCampaigns = db.prepare(`
    SELECT c.*, cm.role as member_role
    FROM campaigns c
    JOIN campaign_members cm ON cm.campaign_id = c.id
    WHERE cm.user_id = ?
    ORDER BY c.created_at DESC LIMIT 5
  `).all(req.user.id);

  const myCharacters = db.prepare(`
    SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(req.user.id);

  res.render('dashboard', {
    title: 'Santuário',
    user: req.user,
    myCampaigns,
    myCharacters
  });
});

app.get('/tools', authRequired, (req, res) => {
  res.render('tools', { title: 'Ferramentas', user: req.user });
});

app.get('/tools/dice', authRequired, (req, res) => {
  res.render('dice', { title: 'Rolador de Dados', user: req.user });
});

app.get('/tools/combat', authRequired, (req, res) => {
  res.render('combat', { title: 'Rastreador de Combate', user: req.user });
});

// API for dice history (optional)
app.post('/api/roll', authRequired, (req, res) => {
  const { formula, result, total, campaign_id } = req.body;
  const { v4: uuidv4 } = require('uuid');
  const { db } = require('./db/database');
  try {
    db.prepare(`
      INSERT INTO roll_history (id, user_id, campaign_id, formula, result, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, campaign_id || null, formula, result, total);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Falha ao salvar' });
  }
});

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página não encontrada',
    user: req.user,
    message: 'As trevas engoliram esta página.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Erro',
    user: req.user,
    message: 'Algo sombrio ocorreu no servidor.'
  });
});

app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║   AetherRPG — Portal das Sombras    ║`);
  console.log(`  ║   http://localhost:${PORT}              ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);
});

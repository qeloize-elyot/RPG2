const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.get('/', authRequired, (req, res) => {
  const myCampaigns = db.prepare(`
    SELECT c.*, cm.role as member_role,
      (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = c.id) as member_count
    FROM campaigns c
    JOIN campaign_members cm ON cm.campaign_id = c.id
    WHERE cm.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user.id);

  const publicCampaigns = db.prepare(`
    SELECT c.*, u.display_name as owner_name,
      (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = c.id) as member_count
    FROM campaigns c
    JOIN users u ON u.id = c.owner_id
    WHERE c.is_public = 1 AND c.status = 'active'
    AND c.id NOT IN (SELECT campaign_id FROM campaign_members WHERE user_id = ?)
    ORDER BY c.created_at DESC
    LIMIT 20
  `).all(req.user.id);

  res.render('campaigns', {
    title: 'Campanhas',
    user: req.user,
    myCampaigns,
    publicCampaigns
  });
});

router.get('/create', authRequired, (req, res) => {
  res.render('campaign-create', { title: 'Nova Campanha', user: req.user, error: null });
});

router.post('/create', authRequired, (req, res) => {
  const { name, description, system, style, max_players, is_public } = req.body;
  if (!name) {
    return res.render('campaign-create', { title: 'Nova Campanha', user: req.user, error: 'Nome é obrigatório.' });
  }
  const id = uuidv4();
  const invite = generateInviteCode();
  db.prepare(`
    INSERT INTO campaigns (id, name, description, system, style, invite_code, owner_id, max_players, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description || '', system || 'D&D 5e', style || 'Fantasia Sombria', invite, req.user.id, parseInt(max_players) || 6, is_public === 'on' ? 1 : 0);

  db.prepare(`
    INSERT INTO campaign_members (id, campaign_id, user_id, role)
    VALUES (?, ?, ?, 'gm')
  `).run(uuidv4(), id, req.user.id);

  res.redirect('/campaigns/' + id);
});

router.get('/join', authRequired, (req, res) => {
  res.render('campaign-join', { title: 'Entrar em Campanha', user: req.user, error: null });
});

router.post('/join', authRequired, (req, res) => {
  const { invite_code } = req.body;
  const campaign = db.prepare('SELECT * FROM campaigns WHERE invite_code = ?').get((invite_code || '').toUpperCase());
  if (!campaign) {
    return res.render('campaign-join', { title: 'Entrar em Campanha', user: req.user, error: 'Código inválido.' });
  }
  const already = db.prepare('SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(campaign.id, req.user.id);
  if (already) {
    return res.redirect('/campaigns/' + campaign.id);
  }
  const count = db.prepare('SELECT COUNT(*) as c FROM campaign_members WHERE campaign_id = ?').get(campaign.id).c;
  if (count >= campaign.max_players) {
    return res.render('campaign-join', { title: 'Entrar em Campanha', user: req.user, error: 'Campanha lotada.' });
  }
  db.prepare(`
    INSERT INTO campaign_members (id, campaign_id, user_id, role)
    VALUES (?, ?, ?, 'player')
  `).run(uuidv4(), campaign.id, req.user.id);
  res.redirect('/campaigns/' + campaign.id);
});

router.get('/:id', authRequired, (req, res) => {
  const campaign = db.prepare(`
    SELECT c.*, u.display_name as owner_name
    FROM campaigns c JOIN users u ON u.id = c.owner_id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!campaign) return res.status(404).render('error', { title: 'Não encontrado', user: req.user, message: 'Campanha não encontrada.' });

  const member = db.prepare('SELECT * FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(campaign.id, req.user.id);
  if (!member && !campaign.is_public) {
    return res.status(403).render('error', { title: 'Acesso negado', user: req.user, message: 'Você não faz parte desta campanha.' });
  }

  const members = db.prepare(`
    SELECT u.id, u.username, u.display_name, cm.role, cm.joined_at
    FROM campaign_members cm JOIN users u ON u.id = cm.user_id
    WHERE cm.campaign_id = ?
    ORDER BY cm.role DESC, cm.joined_at
  `).all(campaign.id);

  const characters = db.prepare(`
    SELECT ch.*, u.display_name as player_name
    FROM characters ch JOIN users u ON u.id = ch.user_id
    WHERE ch.campaign_id = ?
  `).all(campaign.id);

  const sessions = db.prepare(`
    SELECT * FROM sessions WHERE campaign_id = ? ORDER BY scheduled_at DESC LIMIT 10
  `).all(campaign.id);

  const notes = db.prepare(`
    SELECT n.*, u.display_name as author_name
    FROM notes n JOIN users u ON u.id = n.author_id
    WHERE n.campaign_id = ?
    AND (n.visibility = 'party' OR n.author_id = ? OR ? = 'gm')
    ORDER BY n.updated_at DESC
  `).all(campaign.id, req.user.id, member ? member.role : 'player');

  res.render('campaign', {
    title: campaign.name,
    user: req.user,
    campaign,
    member,
    members,
    characters,
    sessions,
    notes
  });
});

router.post('/:id/session', authRequired, (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Não encontrado' });
  const member = db.prepare('SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(campaign.id, req.user.id);
  if (!member || member.role !== 'gm') return res.status(403).json({ error: 'Apenas o mestre' });

  const { title, description, scheduled_at } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO sessions (id, campaign_id, title, description, scheduled_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, campaign.id, title, description || '', scheduled_at || null);
  res.redirect('/campaigns/' + campaign.id);
});

router.post('/:id/note', authRequired, (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Não encontrado' });
  const member = db.prepare('SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(campaign.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Não é membro' });

  const { title, content, visibility, category } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO notes (id, campaign_id, author_id, title, content, visibility, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, campaign.id, req.user.id, title, content || '', visibility || 'party', category || 'geral');
  res.redirect('/campaigns/' + campaign.id);
});

module.exports = router;

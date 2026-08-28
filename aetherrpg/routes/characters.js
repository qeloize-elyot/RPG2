const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const characters = db.prepare(`
    SELECT ch.*, c.name as campaign_name
    FROM characters ch
    LEFT JOIN campaigns c ON c.id = ch.campaign_id
    WHERE ch.user_id = ?
    ORDER BY ch.created_at DESC
  `).all(req.user.id);
  res.render('characters', { title: 'Personagens', user: req.user, characters });
});

router.get('/create', authRequired, (req, res) => {
  const campaigns = db.prepare(`
    SELECT c.id, c.name FROM campaigns c
    JOIN campaign_members cm ON cm.campaign_id = c.id
    WHERE cm.user_id = ?
  `).all(req.user.id);
  res.render('character-create', { title: 'Criar Personagem', user: req.user, campaigns, error: null });
});

router.post('/create', authRequired, (req, res) => {
  const {
    name, system, race, class: charClass, level, background, alignment,
    str, dex, con, int, wis, cha, campaign_id, hp_max, ac
  } = req.body;

  if (!name) {
    const campaigns = db.prepare(`
      SELECT c.id, c.name FROM campaigns c
      JOIN campaign_members cm ON cm.campaign_id = c.id WHERE cm.user_id = ?
    `).all(req.user.id);
    return res.render('character-create', { title: 'Criar Personagem', user: req.user, campaigns, error: 'Nome é obrigatório.' });
  }

  const stats = JSON.stringify({
    str: parseInt(str) || 10,
    dex: parseInt(dex) || 10,
    con: parseInt(con) || 10,
    int: parseInt(int) || 10,
    wis: parseInt(wis) || 10,
    cha: parseInt(cha) || 10
  });

  const id = uuidv4();
  const hp = parseInt(hp_max) || 10;
  db.prepare(`
    INSERT INTO characters (
      id, user_id, campaign_id, name, system, race, class, level,
      background, alignment, stats, hp_current, hp_max, ac, initiative_mod
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.id, campaign_id || null, name, system || 'D&D 5e',
    race || '', charClass || '', parseInt(level) || 1,
    background || '', alignment || '', stats, hp, hp,
    parseInt(ac) || 10, Math.floor(((parseInt(dex) || 10) - 10) / 2)
  );

  res.redirect('/characters/' + id);
});

router.get('/:id', authRequired, (req, res) => {
  const character = db.prepare(`
    SELECT ch.*, u.display_name as player_name, c.name as campaign_name
    FROM characters ch
    JOIN users u ON u.id = ch.user_id
    LEFT JOIN campaigns c ON c.id = ch.campaign_id
    WHERE ch.id = ?
  `).get(req.params.id);

  if (!character) {
    return res.status(404).render('error', { title: 'Não encontrado', user: req.user, message: 'Personagem não encontrado.' });
  }

  if (character.user_id !== req.user.id && !character.is_public) {
    // allow if same campaign member
    if (character.campaign_id) {
      const member = db.prepare('SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ?')
        .get(character.campaign_id, req.user.id);
      if (!member) {
        return res.status(403).render('error', { title: 'Acesso negado', user: req.user, message: 'Personagem privado.' });
      }
    } else {
      return res.status(403).render('error', { title: 'Acesso negado', user: req.user, message: 'Personagem privado.' });
    }
  }

  const stats = JSON.parse(character.stats || '{}');
  const inventory = JSON.parse(character.inventory || '[]');

  res.render('character', {
    title: character.name,
    user: req.user,
    character,
    stats,
    inventory,
    isOwner: character.user_id === req.user.id
  });
});

router.post('/:id/update', authRequired, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!character || character.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Não autorizado' });
  }

  const { hp_current, notes, inventory } = req.body;
  if (hp_current !== undefined) {
    db.prepare('UPDATE characters SET hp_current = ? WHERE id = ?').run(parseInt(hp_current), character.id);
  }
  if (notes !== undefined) {
    db.prepare('UPDATE characters SET notes = ? WHERE id = ?').run(notes, character.id);
  }
  if (inventory !== undefined) {
    db.prepare('UPDATE characters SET inventory = ? WHERE id = ?').run(inventory, character.id);
  }
  res.redirect('/characters/' + character.id);
});

module.exports = router;

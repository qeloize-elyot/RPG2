const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'aetherrpg.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'player',
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      system TEXT DEFAULT 'D&D 5e',
      style TEXT DEFAULT 'Fantasia Sombria',
      invite_code TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      max_players INTEGER DEFAULT 6,
      is_public INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaign_members (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'player',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(campaign_id, user_id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      campaign_id TEXT,
      name TEXT NOT NULL,
      system TEXT DEFAULT 'D&D 5e',
      race TEXT DEFAULT '',
      class TEXT DEFAULT '',
      level INTEGER DEFAULT 1,
      background TEXT DEFAULT '',
      alignment TEXT DEFAULT '',
      stats TEXT DEFAULT '{}',
      skills TEXT DEFAULT '{}',
      hp_current INTEGER DEFAULT 10,
      hp_max INTEGER DEFAULT 10,
      ac INTEGER DEFAULT 10,
      initiative_mod INTEGER DEFAULT 0,
      inventory TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      is_public INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      scheduled_at DATETIME,
      status TEXT DEFAULT 'planned',
      recap TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      visibility TEXT DEFAULT 'party',
      category TEXT DEFAULT 'geral',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roll_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      campaign_id TEXT,
      formula TEXT NOT NULL,
      result TEXT NOT NULL,
      total INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed admin if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count === 0) {
    const id = uuidv4();
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, username, email, password, display_name, role)
      VALUES (?, 'admin', 'admin@aetherrpg.local', ?, 'Arquimago', 'gm')
    `).run(id, hash);
    console.log('Usuário seed criado: admin / admin123');
  }

  console.log('Banco de dados inicializado.');
}

module.exports = { db, initDatabase };

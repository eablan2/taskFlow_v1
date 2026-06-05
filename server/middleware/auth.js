const db = require('../db');

// Sessions are persisted in SQLite so they survive server restarts/redeploys
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

function createSession(userId) {
  const token = require('crypto').randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)')
    .run(token, userId, Date.now());
  return token;
}

function destroySession(token) {
  db.prepare('DELETE FROM sessions WHERE token=?').run(token);
}

function getUserId(token) {
  const row = db.prepare('SELECT user_id FROM sessions WHERE token=?').get(token);
  return row?.user_id ?? null;
}

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] ?? '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userId = getUserId(token);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  req.userId = userId;
  next();
}

module.exports = { createSession, destroySession, getUserId, requireAuth };

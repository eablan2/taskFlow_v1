const express = require('express');
const router = express.Router();
const db = require('../db');
const { createSession, destroySession, getUserId, requireAuth } = require('../middleware/auth');

function userWithoutPassword(u) {
  const { password, ...rest } = u;
  return rest;
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = db.prepare('SELECT * FROM users WHERE username=? AND password=?').get(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = createSession(user.id);
  res.json({ user: userWithoutPassword(user), token });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  const token = req.headers['authorization'].slice(7);
  destroySession(token);
  res.status(204).end();
});

// GET /api/auth/me  — restore session on page reload
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(userWithoutPassword(user));
});

module.exports = router;

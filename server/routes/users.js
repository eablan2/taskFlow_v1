const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

function userWithoutPassword(u) {
  const { password, ...rest } = u;
  return rest;
}

// GET /api/users
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM users').all();
  res.json(rows.map(userWithoutPassword));
});

// GET /api/users/check-username?username=x&excludeId=y
router.get('/check-username', (req, res) => {
  const { username, excludeId } = req.query;
  let row;
  if (excludeId) {
    row = db.prepare('SELECT id FROM users WHERE username=? AND id!=?').get(username, excludeId);
  } else {
    row = db.prepare('SELECT id FROM users WHERE username=?').get(username);
  }
  res.json({ taken: !!row });
});

// POST /api/users
router.post('/', (req, res) => {
  const { name, username, password, role = 'user' } = req.body;
  const id = 'u' + Date.now();
  db.prepare('INSERT INTO users (id, name, username, password, role) VALUES (?,?,?,?,?)').run(id, name, username, password, role);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  res.status(201).json(userWithoutPassword(user));
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { name, username, password, role } = req.body;
  db.prepare('UPDATE users SET name=?,username=?,password=?,role=? WHERE id=?').run(
    name     ?? existing.name,
    username ?? existing.username,
    password || existing.password,
    role     ?? existing.role,
    req.params.id
  );
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  res.json(userWithoutPassword(user));
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;

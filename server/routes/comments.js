const express = require('express');
const router  = express.Router({ mergeParams: true });
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');
const { randomUUID } = require('crypto');

router.use(requireAuth);

function getReactions(commentId) {
  const rows = db.prepare(
    'SELECT emoji, user_id FROM comment_reactions WHERE comment_id=?'
  ).all(commentId);
  // Group into { emoji: [userId, ...] }
  const map = {};
  for (const r of rows) {
    if (!map[r.emoji]) map[r.emoji] = [];
    map[r.emoji].push(r.user_id);
  }
  return map;
}

function rowToComment(row) {
  return { ...row, reactions: getReactions(row.id) };
}

// GET /api/items/:itemId/comments
router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM comments WHERE item_id=? ORDER BY created ASC'
  ).all(req.params.itemId);
  res.json(rows.map(rowToComment));
});

// POST /api/items/:itemId/comments
router.post('/', (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Body required' });

  const id = randomUUID();
  db.prepare(
    'INSERT INTO comments (id, item_id, user_id, body, created) VALUES (?,?,?,?,?)'
  ).run(id, req.params.itemId, req.userId, body.trim(), Date.now());

  const row = db.prepare('SELECT * FROM comments WHERE id=?').get(id);
  res.status(201).json(rowToComment(row));
});

// POST /api/items/:itemId/comments/:commentId/reactions
router.post('/:commentId/reactions', (req, res) => {
  const { emoji } = req.body;
  const allowed = ['👍', '❤️', '😮', '😂', '😢'];
  if (!allowed.includes(emoji)) return res.status(400).json({ error: 'Invalid emoji' });

  const { commentId } = req.params;
  const userId = req.userId;

  // Toggle: if exists remove, else add
  const existing = db.prepare(
    'SELECT 1 FROM comment_reactions WHERE comment_id=? AND user_id=? AND emoji=?'
  ).get(commentId, userId, emoji);

  if (existing) {
    db.prepare(
      'DELETE FROM comment_reactions WHERE comment_id=? AND user_id=? AND emoji=?'
    ).run(commentId, userId, emoji);
  } else {
    db.prepare(
      'INSERT OR IGNORE INTO comment_reactions (comment_id, user_id, emoji) VALUES (?,?,?)'
    ).run(commentId, userId, emoji);
  }

  res.json(getReactions(commentId));
});

module.exports = router;

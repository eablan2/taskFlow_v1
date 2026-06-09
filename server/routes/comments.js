const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');
const { randomUUID } = require('crypto');
const { createNotification } = require('../notifyHelper');

router.use(requireAuth);

function getReactions(commentId) {
  const rows = db.prepare(
    'SELECT emoji, user_id FROM comment_reactions WHERE comment_id=?'
  ).all(commentId);
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
router.get('/:itemId/comments', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM comments WHERE item_id=? ORDER BY created ASC'
  ).all(req.params.itemId);
  res.json(rows.map(rowToComment));
});

// POST /api/items/:itemId/comments
router.post('/:itemId/comments', (req, res) => {
  const { body, parent_id = null } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Body required' });

  const id = randomUUID();
  db.prepare(
    'INSERT INTO comments (id, item_id, user_id, body, parent_id, created) VALUES (?,?,?,?,?,?)'
  ).run(id, req.params.itemId, req.userId, body.trim(), parent_id, Date.now());

  const row = db.prepare('SELECT * FROM comments WHERE id=?').get(id);

  // Fire @mention notifications
  const mentions = [...body.trim().matchAll(/@(\w+)/g)].map(m => m[1]);
  const authorRow = db.prepare('SELECT name FROM users WHERE id=?').get(req.userId);
  const authorName = authorRow?.name ?? 'Someone';
  const item = db.prepare('SELECT title FROM items WHERE id=?').get(req.params.itemId);
  const itemTitle = item?.title ?? req.params.itemId;

  for (const username of mentions) {
    const mentioned = db.prepare('SELECT id FROM users WHERE username=?').get(username);
    if (mentioned && mentioned.id !== req.userId) {
      createNotification(
        mentioned.id,
        'mention',
        `${authorName} mentioned you in a comment on "${itemTitle}"`,
        req.params.itemId
      );
    }
  }

  res.status(201).json(rowToComment(row));
});

// DELETE /api/items/:itemId/comments/:commentId
router.delete('/:itemId/comments/:commentId', (req, res) => {
  const row = db.prepare('SELECT * FROM comments WHERE id=?').get(req.params.commentId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM comment_reactions WHERE comment_id=?').run(req.params.commentId);
  db.prepare('DELETE FROM comments WHERE id=?').run(req.params.commentId);
  res.status(204).end();
});

// POST /api/items/:itemId/comments/:commentId/reactions
router.post('/:itemId/comments/:commentId/reactions', (req, res) => {
  const { emoji } = req.body;
  const allowed = ['👍', '❤️', '😲', '😂', '😢'];
  if (!allowed.includes(emoji)) return res.status(400).json({ error: 'Invalid emoji' });

  const { commentId } = req.params;
  const userId = req.userId;

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

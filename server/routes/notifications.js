const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

const ONE_WEEK_MS  = 7  * 24 * 60 * 60 * 1000;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function pruneOld() {
  const cutoff = Date.now() - TWO_WEEKS_MS;
  db.prepare('DELETE FROM notifications WHERE created < ?').run(cutoff);
}

// GET /api/notifications
router.get('/', (req, res) => {
  pruneOld();
  const now = Date.now();
  const rows = db.prepare(
    'SELECT * FROM notifications WHERE user_id=? ORDER BY created DESC'
  ).all(req.userId);

  const recent   = rows.filter(r => now - r.created <= ONE_WEEK_MS);
  const previous = rows.filter(r => now - r.created >  ONE_WEEK_MS);
  const unread   = rows.filter(r => !r.read).length;

  res.json({ recent, previous, unread });
});

// POST /api/notifications/read-all
router.post('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(req.userId);
  res.json({ ok: true });
});

// DELETE /api/notifications  — clear all for this user
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM notifications WHERE user_id=?').run(req.userId);
  res.json({ ok: true });
});

module.exports = router;

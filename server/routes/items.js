const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

function getLinks(itemId) {
  return db.prepare('SELECT linked_id FROM item_links WHERE item_id=?')
    .all(itemId)
    .map(r => r.linked_id);
}

function rowToItem(row) {
  return { ...row, links: getLinks(row.id) };
}

// GET /api/items
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM items ORDER BY created DESC').all();
  res.json(rows.map(rowToItem));
});

// GET /api/items/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM items WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(rowToItem(row));
});

// POST /api/items
router.post('/', (req, res) => {
  const counter = db.prepare('SELECT val FROM id_counter WHERE id=?').get('items');
  const n = counter?.val ?? 1;
  const id = 'TF-' + String(n).padStart(3, '0');
  db.prepare('UPDATE id_counter SET val=? WHERE id=?').run(n + 1, 'items');

  const { type, title, desc='', status='New', priority='Medium', assignee='', points=0, due='', links=[] } = req.body;
  const created = Date.now();

  db.prepare(
    'INSERT INTO items (id,type,title,desc,status,priority,assignee,points,due,created) VALUES (?,?,?,?,?,?,?,?,?,?)'
  ).run(id, type, title, desc, status, priority, assignee, points, due, created);

  syncLinks(id, [], links);
  res.status(201).json(rowToItem(db.prepare('SELECT * FROM items WHERE id=?').get(id)));
});

// PUT /api/items/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const oldLinks = getLinks(req.params.id);
  const { type, title, desc, status, priority, assignee, points, due, links } = req.body;

  db.prepare(
    'UPDATE items SET type=?,title=?,desc=?,status=?,priority=?,assignee=?,points=?,due=? WHERE id=?'
  ).run(
    type ?? existing.type,
    title ?? existing.title,
    desc ?? existing.desc,
    status ?? existing.status,
    priority ?? existing.priority,
    assignee ?? existing.assignee,
    points ?? existing.points,
    due ?? existing.due,
    req.params.id
  );

  if (links !== undefined) syncLinks(req.params.id, oldLinks, links);
  res.json(rowToItem(db.prepare('SELECT * FROM items WHERE id=?').get(req.params.id)));
});

// DELETE /api/items/:id
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  // Remove all links involving this item
  db.prepare('DELETE FROM item_links WHERE item_id=? OR linked_id=?').run(id, id);
  db.prepare('DELETE FROM items WHERE id=?').run(id);
  res.status(204).end();
});

// Bidirectional link sync
function syncLinks(itemId, oldLinks, newLinks) {
  const added   = newLinks.filter(l => !oldLinks.includes(l));
  const removed = oldLinks.filter(l => !newLinks.includes(l));

  const delLink    = db.prepare('DELETE FROM item_links WHERE item_id=? AND linked_id=?');
  const insertLink = db.prepare('INSERT OR IGNORE INTO item_links (item_id, linked_id) VALUES (?,?)');

  for (const lid of removed) {
    delLink.run(itemId, lid);
    delLink.run(lid, itemId);
  }
  for (const lid of added) {
    insertLink.run(itemId, lid);
    insertLink.run(lid, itemId);
  }
}

module.exports = router;

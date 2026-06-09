const db = require('./db');
const { randomUUID } = require('crypto');

function createNotification(userId, type, message, itemId = null) {
  db.prepare(
    'INSERT INTO notifications (id, user_id, type, message, item_id, read, created) VALUES (?,?,?,?,?,0,?)'
  ).run(randomUUID(), userId, type, message, itemId, Date.now());
}

module.exports = { createNotification };

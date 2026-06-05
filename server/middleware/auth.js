// In-memory session store: token → userId
const sessions = new Map();

function createSession(userId) {
  const token = require('crypto').randomBytes(32).toString('hex');
  sessions.set(token, userId);
  return token;
}

function destroySession(token) {
  sessions.delete(token);
}

function getUserId(token) {
  return sessions.get(token) ?? null;
}

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = sessions.get(token);
  next();
}

module.exports = { createSession, destroySession, getUserId, requireAuth };

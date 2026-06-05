const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'taskflow.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role     TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS items (
    id       TEXT PRIMARY KEY,
    type     TEXT NOT NULL,
    title    TEXT NOT NULL,
    desc     TEXT NOT NULL DEFAULT '',
    status   TEXT NOT NULL DEFAULT 'New',
    priority TEXT NOT NULL DEFAULT 'Medium',
    assignee TEXT NOT NULL DEFAULT '',
    points   INTEGER NOT NULL DEFAULT 0,
    due      TEXT NOT NULL DEFAULT '',
    created  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS item_links (
    item_id   TEXT NOT NULL,
    linked_id TEXT NOT NULL,
    PRIMARY KEY (item_id, linked_id)
  );

  CREATE TABLE IF NOT EXISTS id_counter (
    id  TEXT PRIMARY KEY,
    val INTEGER NOT NULL DEFAULT 1
  );
`);

// Seed users if empty
const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get();
if (userCount.n === 0) {
  const insert = db.prepare('INSERT INTO users (id, name, username, password, role) VALUES (?, ?, ?, ?, ?)');
  insert.run('u1', 'Admin User', 'admin', 'admin123', 'admin');
  insert.run('u2', 'Dev Member', 'dev',   'dev123',   'user');
}

// Seed work items if empty
const itemCount = db.prepare('SELECT COUNT(*) as n FROM items').get();
if (itemCount.n === 0) {
  const insertItem = db.prepare(
    'INSERT INTO items (id,type,title,desc,status,priority,assignee,points,due,created) VALUES (?,?,?,?,?,?,?,?,?,?)'
  );
  const insertLink = db.prepare('INSERT OR IGNORE INTO item_links (item_id, linked_id) VALUES (?,?)');
  const now = Date.now();

  const seeds = [
    ['TF-001','Epic','User Authentication System','Implement full authentication including login, registration, and password reset flows.','Active','High','u1',21,'2025-09-01', now - 8e7],
    ['TF-002','Feature','Login page UI','Design and implement the login form with validation.','Done','High','u2',5,'2025-07-15', now - 6e7],
    ['TF-003','User Story','As a user I can reset my password via email','Password reset flow via email link.','New','Medium','u2',3,'2025-08-01', now - 4e7],
    ['TF-004','Task','Set up CI/CD pipeline','Configure GitHub Actions for automated testing and deployment.','Active','High','u1',8,'', now - 2e7],
    ['TF-005','Task','Write unit tests for auth module','Cover all critical paths with Jest tests.','In Review','Medium','u2',5,'', now - 1e7],
  ];
  for (const s of seeds) insertItem.run(...s);

  const links = [['TF-001','TF-002'],['TF-002','TF-001'],['TF-001','TF-003'],['TF-003','TF-001'],['TF-005','TF-004'],['TF-004','TF-005']];
  for (const [a, b] of links) insertLink.run(a, b);

  db.prepare('INSERT OR IGNORE INTO id_counter (id, val) VALUES (?,?)').run('items', 6);
}

if (!db.prepare('SELECT val FROM id_counter WHERE id=?').get('items')) {
  db.prepare('INSERT INTO id_counter (id, val) VALUES (?,?)').run('items', 6);
}

module.exports = db;

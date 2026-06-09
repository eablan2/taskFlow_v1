const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/items', require('./routes/comments'));
app.use('/api/users', require('./routes/users'));

// Serve Angular build in production
if (PROD) {
  const static_dir = path.join(__dirname, '..', 'dist', 'taskflow', 'browser');
  app.use(express.static(static_dir));
  // SPA fallback — let Angular's router handle all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(static_dir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`TaskFlow ${PROD ? 'production' : 'API'} server running on http://localhost:${PORT}`);
});

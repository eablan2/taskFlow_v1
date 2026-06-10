const express     = require('express');
const cors        = require('cors');
const compression = require('compression');
const path        = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';

// ── Gzip/Brotli all responses ──────────────────────────────────────────
app.use(compression());

app.use(cors());
app.use(express.json());

// ── API routes ─────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/items',         require('./routes/items'));
app.use('/api/items',         require('./routes/comments'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));

// ── Serve Angular build in production ─────────────────────────────────
if (PROD) {
  const staticDir = path.join(__dirname, '..', 'dist', 'taskflow', 'browser');

  // Hashed assets (main.abc123.js, styles.abc123.css, etc.) → cache 1 year
  app.use(
    express.static(staticDir, {
      maxAge: '1y',
      immutable: true,
      // Don't set long cache on index.html — it must always be fresh
      setHeaders(res, filePath) {
        if (path.basename(filePath) === 'index.html') {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    })
  );

  // SPA fallback
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`TaskFlow ${PROD ? 'production' : 'API'} server on http://localhost:${PORT}`);
});

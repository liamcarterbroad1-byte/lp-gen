const path = require('path');
const express = require('express');
const { buildLandingPage, validate } = require('./lib/render');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Renders a paste-ready GoHighLevel landing page locally from the brief —
// no AI, no external calls. Brand values are substituted into the proven
// template and the finished HTML is returned for copy/paste.
app.post('/api/generate', (req, res) => {
  const form = req.body || {};

  const missing = validate(form);
  if (missing.length) {
    return res.status(400).json({ error: `Please fix: ${missing.join(', ')}.` });
  }

  try {
    const html = buildLandingPage(form);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: (err && err.message) || 'Failed to build the page.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`lp-gen running at http://localhost:${PORT}`);
});

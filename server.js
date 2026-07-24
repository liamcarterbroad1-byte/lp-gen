const path = require('path');
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { INSTRUCTIONS, buildInputsMessage, validate } = require('./lib/prompt');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.LP_GEN_MODEL || 'claude-opus-4-8';

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Streams the generated GoHighLevel landing page back to the browser as it is
// produced. The Anthropic key comes from the request (the user's own Claude) or
// falls back to the server env var, so the app "connects to the user's Claude".
app.post('/api/generate', async (req, res) => {
  const { apiKey: bodyKey, ...form } = req.body || {};
  const apiKey = (bodyKey && String(bodyKey).trim()) || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(400).json({
      error: 'No Anthropic API key. Paste your Claude key in the dashboard (or set ANTHROPIC_API_KEY on the server).',
    });
  }

  const missing = validate(form);
  if (missing.length) {
    return res.status(400).json({ error: `Please fill in the required fields: ${missing.join(', ')}.` });
  }

  const client = new Anthropic({ apiKey });

  // Plain-text streaming response; the browser reads it chunk by chunk.
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      system: [
        {
          type: 'text',
          text: INSTRUCTIONS,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: buildInputsMessage(form) }],
    });

    stream.on('text', (delta) => {
      res.write(delta);
    });

    await stream.finalMessage();
    res.end();
  } catch (err) {
    const msg = (err && err.message) ? err.message : 'Unknown error calling Claude.';
    if (res.headersSent) {
      // Streaming already began — surface the failure inline so it's visible.
      res.write(`\n\n<!-- [GENERATION ERROR] ${msg} -->\n`);
      res.end();
    } else {
      const status = (err && err.status) || 500;
      res.status(status).json({ error: msg });
    }
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, model: MODEL, serverKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.listen(PORT, () => {
  console.log(`lp-gen running at http://localhost:${PORT}`);
});

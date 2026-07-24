# LP-Gen — Landing Page Generator

A small web dashboard that connects to **your own Claude** and turns a client
brief into a **paste-ready GoHighLevel landing page**. You fill in the inputs
(business name, brand color, GHL planner embed, offer copy, roadmap, …), hit
Generate, and Claude writes the complete Custom-Code file live in the panel —
built by adapting a proven, battle-tested template.

## How it works

1. You paste your Anthropic (Claude) API key in the dashboard. It's stored only
   in your browser (`localStorage`) and sent straight to Claude via the server —
   never persisted server-side.
2. You fill in the client brief.
3. The server injects your inputs into the proven prompt + reference template and
   **streams** the generated page back to the browser using your key.
4. Copy the result into a GoHighLevel **Custom Code** element (no
   `<!DOCTYPE>`/`<html>`/`<head>`/`<body>` — it's paste-ready as-is).

The heavy lifting (the exact instructions and the battle-tested template that
must survive untouched) lives in `lib/prompt.js` and `reference-template.html`.

## Run it

```bash
npm install
npm start
# open http://localhost:3000
```

Then paste your Claude API key (top-right) and fill in the brief.

### Bring-your-own-key vs. server key

By default each user pastes their own key — nothing is stored on the server.
If you'd rather run a shared key, copy `.env.example` to `.env` and set
`ANTHROPIC_API_KEY`; it's used as a fallback whenever a request has no key.

## Config

| Env var             | Default            | Purpose                                  |
| ------------------- | ------------------ | ---------------------------------------- |
| `ANTHROPIC_API_KEY` | (unset)            | Optional server-side fallback key        |
| `PORT`              | `3000`             | Port to listen on                        |
| `LP_GEN_MODEL`      | `claude-opus-4-8`  | Claude model used for generation         |

## Project layout

```
server.js               Express server + streaming /api/generate
lib/prompt.js           Instructions + INPUTS-block builder + validation
reference-template.html The proven GHL template (kept verbatim)
public/                 Dashboard UI (index.html, styles.css, app.js)
```

## Notes

- Output streams token-by-token, so long pages appear as they're written.
- The generated testimonials are intentionally generic placeholders — replace
  them with real member reviews before going live.

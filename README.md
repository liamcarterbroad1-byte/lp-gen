# LP-Gen — Landing Page Generator

A small web dashboard that turns a client brief into **paste-ready GoHighLevel
landing page code** — no AI, no API keys, fully local. You fill in the brand
values (business name, brand color, GHL planner embed, logo/photos, headline,
address, CTA, roadmap titles) and the app substitutes them into a proven,
battle-tested template and returns the finished HTML to copy/paste.

## How it works

1. You fill in the client brief.
2. The server substitutes your values into `reference-template.html`:
   - **Palette** — a full color scheme (`--ptf-olive` + soft/dark/light/cream
     tints) is derived from your primary hex, and every hardcoded color in the
     CSS, inline SVGs, JS backgrounds, and button gradient is recolored to match.
   - **Planner** — the iframe `src` + `id` are pulled from your pasted GHL embed
     (the popup iframe gets a distinct `_popup` id).
   - **Map** — a Google Maps embed is built from the business name + address.
   - **Media / copy** — logo, photos, headline, subtext, funnel-step label,
     coach tag, CTA text, roadmap step titles, address, and business name.
3. You copy the result into a GoHighLevel **Custom Code** element (it's
   paste-ready — no `<!DOCTYPE>`/`<html>`/`<head>`/`<body>`).

### What is *not* changed

The body copy (USP cards, FAQ answers, testimonial text) stays the template's
Dutch defaults — these are content decisions, so edit them directly in the
generated code before going live. The testimonials are intentionally generic
placeholders.

## Run it

```bash
npm install
npm start
# open http://localhost:3000
```

## Config

| Env var | Default | Purpose           |
| ------- | ------- | ----------------- |
| `PORT`  | `3000`  | Port to listen on |

## Project layout

```
server.js               Express server + /api/generate (local render)
lib/render.js           Palette derivation + template substitution + validation
reference-template.html The proven GHL template (kept verbatim)
public/                 Dashboard UI (index.html, styles.css, app.js)
```

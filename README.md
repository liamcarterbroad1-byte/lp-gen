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

Everything runs **in the browser** — there's no backend to keep alive and no
API to hit. Two ways to use it:

**Easiest — just open the file:**

```
Open public/index.html in your browser (double-click it).
```

**Or serve the folder** (any static host works), e.g.:

```bash
npx serve public      # then open the printed URL
# or
npm install && npm start   # → http://localhost:3000
```

> If you previously saw **"Request failed 404"**, that was the old version
> calling a `/api/generate` endpoint that only existed when the Node server was
> running. The generator is now fully client-side, so that can't happen — open
> `public/index.html` however you like.

## Config

| Env var | Default | Purpose                                    |
| ------- | ------- | ------------------------------------------ |
| `PORT`  | `3000`  | Port for the optional static `npm start`   |

## Project layout

```
public/
  index.html            Dashboard UI
  styles.css            Styles
  template.js           The proven GHL template, inlined (auto-generated)
  render.js             Palette derivation + template substitution + validation
  app.js                Wiring (build / copy / download)
reference-template.html Source of template.js (kept verbatim)
server.js               Optional static server (npm start) — not required
lib/render.js           Node copy of the render logic used by server.js
```

### Regenerating the inlined template

`public/template.js` is generated from `reference-template.html`. If you edit
the template, regenerate it:

```bash
node -e "const fs=require('fs');fs.writeFileSync('public/template.js','window.PTF_TEMPLATE = '+JSON.stringify(fs.readFileSync('reference-template.html','utf8'))+';\n')"
```

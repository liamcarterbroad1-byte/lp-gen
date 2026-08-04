# Liam's Sauce — Sub Landing Page Generator

Liam's Sauce is a web dashboard that turns a client brief into **paste-ready GoHighLevel
landing page code** — no AI, no API keys, fully local. You fill in the brand
values (business name, brand color, GHL planner embed, logo/photos, headline,
address, CTA, roadmap titles) and the app substitutes them into a proven,
battle-tested template and returns the finished HTML to copy/paste.

## How it works

1. You pick a **service type** and fill in the client brief.
2. The browser substitutes your values into the template (all in `public/render.js`):
   - **Service copy** — the template ships as *small group*; choosing another
     type rewrites the service-specific wording across the hero badge/subtext,
     USP cards, coach section, testimonials, FAQ, final-CTA urgency, and the
     4 roadmap steps (each type has its own designed steps). For online coaching
     the studio section is reworded to "train anywhere", and if no address is
     given the map, address line, and footer address are dropped.
   - **Offer / Guarantee (optional)** — the base page makes **no deal claim**.
     Enter an **offer** (e.g. "2 weken gratis") to surface it in the hero badge,
     roadmap step 3, sticky + final CTA notes, and the commitment FAQ. Enter a
     **guarantee** (e.g. "Niet tevreden? Geld terug") to add a hero shield badge
     and the final-CTA note. Leave them blank for a clean, deal-free page.
   - **Location** — the studio section ("Onze studio in …") and hero subtext
     follow the **city** parsed from the address you enter; the region-specific
     line is replaced with a neutral one.
   - **Two coaches** — tick "Two founders / coaches" and add a second name +
     photo to render two coach cards, a plural heading, and a team paragraph.
   - **Palette** — a full color scheme (`--ptf-olive` + soft/dark/light/cream
     tints) is derived from your primary hex, and every hardcoded color in the
     CSS, inline SVGs, JS backgrounds, and button gradient is recolored to match.
   - **Planner** — the iframe `src` + `id` are pulled from your pasted GHL embed
     into the inline hero calendar. Every CTA button smooth-scrolls up to that
     calendar (no popup — a popup iframe didn't resize reliably on mobile and
     clipped the booking form).
   - **Map** — a Google Maps embed is built from the business name + address.
   - **Media / copy** — logo, photos, headline, subtext, funnel-step label,
     coach tag + auto-derived coach first name, CTA text, address, business name.
3. You copy the result into a GoHighLevel **Custom Code** element (it's
   paste-ready — no `<!DOCTYPE>`/`<html>`/`<head>`/`<body>`).

### Detailed editor, preview & video reviews

Three buttons sit next to **Build**:

- **Detailed editor** — opens a panel listing every section with its **standard
  copy** in editable fields. The standard text is always the default; edit a
  field only to override it (leave it to keep the standard). Each section also
  has a **Show** toggle (turn the section off) and a **Bg** colour picker
  (per-section background — use light shades so text stays readable). Under
  **Reviews** there's a **video review carousel** toggle: tick it and paste
  video URLs (YouTube, Vimeo, or direct `.mp4`, one per line) to replace the two
  text testimonials with a swipeable video carousel.
- **Preview** — renders the generated page live in a phone-width frame (with a
  Desktop toggle) so you can see edits before copying.

All of this runs in the browser via structured DOM edits; the base output is
untouched unless you actually change something in the editor.

### Service types

| Service | Copy |
| ------- | ---- |
| **Small Group** | The template's original wording (baseline). |
| **Personal Training** | 1-op-1 wording throughout; "how private is it" FAQ; studio kept. |
| **Online Coaching** | Online/remote wording; device-needs FAQ; the Google map is replaced by a self-contained "online coaching space" mockup (a brand-colored video-call window) under an online headline ("Jouw coaching, volledig online"). |
| **Pilates** | Pilates-flavoured wording (correcties, balans & controle); "do I need experience" FAQ; studio kept. |

### What is *not* changed

Copy that isn't service-specific (e.g. the "100% gratis" / "geen verplichtingen"
badges, generic FAQ answers) stays the template's Dutch defaults — edit those in
the generated code before going live. Testimonials are intentionally generic
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
  index.html            Dashboard UI (service selector + brief)
  styles.css            Styles
  template.js           The proven GHL template, inlined (auto-generated)
  render.js             Service copy packs + palette + substitution + validation
  app.js                Wiring (build / copy / download)
reference-template.html Source of template.js (kept verbatim)
server.js               Optional static server (npm start) — not required
```

### Regenerating the inlined template

`public/template.js` is generated from `reference-template.html`. If you edit
the template, regenerate it:

```bash
node -e "const fs=require('fs');fs.writeFileSync('public/template.js','window.PTF_TEMPLATE = '+JSON.stringify(fs.readFileSync('reference-template.html','utf8'))+';\n')"
```

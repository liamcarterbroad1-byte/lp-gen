const fs = require('fs');
const path = require('path');

const TEMPLATE = fs.readFileSync(
  path.join(__dirname, '..', 'reference-template.html'),
  'utf8'
);

// ── Field metadata ──────────────────────────────────────────────────────────
const FIELD_LABELS = {
  clientName: 'Client / business name',
  businessType: 'Type of business & what they offer',
  primaryColor: 'Primary brand color (hex)',
  otherColors: 'Other brand colors (optional)',
  logoUrl: 'Logo URL',
  photo1Url: 'Photo 1 — atmosphere/group photo URL',
  photo2Url: 'Photo 2 — coach/owner photo URL',
  coachName: 'Coach/owner name + role',
  ghlEmbed: 'GHL planner embed code',
  offerHeadline: 'Offer headline (H1)',
  offerSubtext: 'Offer subtext (under H1)',
  funnelStep: 'Funnel step label (top of hero)',
  address: 'Business address (street, zip, city)',
  ctaText: 'Main CTA button text',
};

// Only fields that the local render actually consumes to produce usable code.
const REQUIRED_FIELDS = ['clientName', 'primaryColor', 'ghlEmbed', 'offerHeadline'];

function validate(data = {}) {
  const missing = REQUIRED_FIELDS.filter(
    (f) => !data[f] || String(data[f]).trim() === ''
  ).map((f) => FIELD_LABELS[f]);

  if (data.primaryColor && String(data.primaryColor).trim() && !normalizeHex(data.primaryColor)) {
    missing.push('Primary brand color (must be a hex like #525A43)');
  }
  return missing;
}

// ── Small helpers ────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

function replaceAll(haystack, needle, replacement) {
  return haystack.split(needle).join(replacement);
}

// case-insensitive literal replace (used for hex codes that vary in case)
function replaceAllCI(haystack, needle, replacement) {
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return haystack.replace(re, replacement);
}

// ── Color math ───────────────────────────────────────────────────────────────
function normalizeHex(input) {
  if (!input) return null;
  let h = String(input).trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return '#' + h.toUpperCase();
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r, g, b) {
  const to = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Shift lightness by delta percentage-points, keeping hue & saturation.
function shiftL(hex, delta) {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  return rgbToHex(...hslToRgb(h, s, clamp(l + delta, 0, 100)));
}

// Push toward a near-white tint at target lightness, softening saturation.
function toTint(hex, targetL, satFactor) {
  const [h, s] = rgbToHsl(...hexToRgb(hex));
  return rgbToHex(...hslToRgb(h, s * satFactor, targetL));
}

function rgbTriplet(hex) {
  const [r, g, b] = hexToRgb(hex);
  return `${r},${g},${b}`;
}

// Recolor every hardcoded brand color in the template to a palette derived
// from the primary. The template's original brand hexes/rgb triplets are known
// constants, so each maps 1:1 to its new equivalent.
function colorize(html, primary) {
  const olive = primary;
  const oliveSoft = shiftL(olive, 6);
  const oliveDark = shiftL(olive, -12);
  const oliveDarker = shiftL(olive, -19);
  const oliveLight = toTint(olive, 92, 0.30);
  const cream = toTint(olive, 98, 0.25);
  const dot = shiftL(olive, 14);
  const urgencyDot = toTint(olive, 80, 0.45);

  const hexMap = [
    ['#3F4633', oliveDark],   // olive-dark var + html/body bg + JS backgrounds
    ['#525A43', olive],       // olive var + SVG stroke/fill + star fills
    ['#5E6750', oliveSoft],   // olive-soft var + button gradient start
    ['#47503A', oliveDarker], // button gradient end
    ['#EDEFE8', oliveLight],  // olive-light var + modal-close bg
    ['#FAFAF7', cream],       // cream var
    ['#6d7a54', dot],         // pulsing planner dot
    ['#cdd6b8', urgencyDot],  // urgency badge dot
  ];
  for (const [from, to] of hexMap) html = replaceAllCI(html, from, to);

  const rgbMap = [
    ['109,122,84', rgbTriplet(dot)],      // pulse keyframe (=#6d7a54)
    ['82,90,67', rgbTriplet(olive)],      // roadmap line gradient (=#525A43)
    ['63,70,51', rgbTriplet(oliveDark)],  // button/step shadows (=#3F4633)
  ];
  for (const [from, to] of rgbMap) html = replaceAll(html, `rgba(${from},`, `rgba(${to},`);

  return html;
}

// ── GHL embed parsing ────────────────────────────────────────────────────────
function parseEmbed(embed) {
  if (!embed) return {};
  const src = (embed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i) || [])[1];
  const id = (embed.match(/<iframe[^>]*\sid=["']([^"']+)["']/i) || [])[1];
  return { src, id };
}

// ── Main render ──────────────────────────────────────────────────────────────
function buildLandingPage(data = {}) {
  let html = TEMPLATE;
  const val = (k) => (data[k] == null ? '' : String(data[k]).trim());

  // 1. Colors
  const primary = normalizeHex(val('primaryColor'));
  if (primary) html = colorize(html, primary);

  // 2. Booking planner (iframe src + ids)
  const { src: embedSrc, id: embedId } = parseEmbed(val('ghlEmbed'));
  const ORIG_URL = 'https://api.leadconnectorhq.com/widget/booking/lhumA8v6bLvnQ7v25jYY';
  const ORIG_HERO_ID = 'lhumA8v6bLvnQ7v25jYY_1784898793215';
  const ORIG_POPUP_ID = 'lhumA8v6bLvnQ7v25jYY_popup';
  if (embedSrc) html = replaceAll(html, ORIG_URL, escapeAttr(embedSrc));
  if (embedId) {
    // popup id must differ from the hero id
    html = replaceAll(html, ORIG_POPUP_ID, escapeAttr(embedId + '_popup'));
    html = replaceAll(html, ORIG_HERO_ID, escapeAttr(embedId));
  }

  // 3. Map (business name + address)
  const address = val('address');
  const clientName = val('clientName');
  const ORIG_MAP = 'https://www.google.com/maps?q=PTF%20by%20Joep%2C%20Zuiderkade%203%2C%201948%20NG%20Beverwijk&z=15&output=embed';
  if (address || clientName) {
    const query = [clientName, address].filter(Boolean).join(', ');
    const newMap = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
    html = replaceAll(html, ORIG_MAP, newMap);
  }

  // 4. Media
  if (val('logoUrl')) {
    html = replaceAll(html, 'https://www.ptf-by-joep.nl/wp-content/uploads/2024/01/PTF-by-Joep-Logo-150x150.png', escapeAttr(val('logoUrl')));
  }
  if (val('photo1Url')) {
    html = replaceAll(html, 'https://assets.cdn.filesafe.space/9fhovZYk1lVT2zNK01rv/media/69bd39a90e1bdb83c17a64fc.png', escapeAttr(val('photo1Url')));
  }
  if (val('photo2Url')) {
    html = replaceAll(html, 'https://assets.cdn.filesafe.space/9fhovZYk1lVT2zNK01rv/media/69bd3dd68944bb8666d93138.png', escapeAttr(val('photo2Url')));
  }

  // 5. Hero headline (drops the accent span; injects the given H1 verbatim)
  if (val('offerHeadline')) {
    html = html.replace(
      /<h1>[\s\S]*?<\/h1>/,
      `<h1>${escapeHtml(val('offerHeadline'))}</h1>`
    );
  }

  // 6. Hero subtext
  if (val('offerSubtext')) {
    html = replaceAll(
      html,
      'Kies hieronder een moment dat jou uitkomt. Je traint samen in een kleine groep in onze studio in Beverwijk en ontvangt direct een bevestiging per mail.',
      escapeHtml(val('offerSubtext'))
    );
  }

  // 7. Funnel step eyebrow (remove when skipped)
  const funnel = val('funnelStep');
  const EYEBROW = '<span class="ptf-eyebrow">Stap 2 · Kies je trainingsmoment</span>';
  if (funnel && funnel.toLowerCase() !== 'skip') {
    html = replaceAll(html, EYEBROW, `<span class="ptf-eyebrow">${escapeHtml(funnel)}</span>`);
  } else if (funnel.toLowerCase() === 'skip') {
    html = replaceAll(html, EYEBROW + '\n      ', '');
    html = replaceAll(html, EYEBROW, '');
  }

  // 8. Coach name + role (tag pill)
  if (val('coachName')) {
    html = replaceAll(html, 'Joep · Oprichter &amp; Coach', escapeHtml(val('coachName')));
  }

  // 9. CTA button text
  if (val('ctaText')) {
    html = replaceAll(html, 'Plan je gratis proefperiode', escapeHtml(val('ctaText')));
  }

  // 10. Roadmap step titles (only the <h3> titles; descriptions stay template default)
  const roadmapTitles = [
    'Intake',
    'Proefles',
    '2 Weken gratis &amp; vrijblijvend uitproberen',
    'Exclusieve korting bij aanmelden',
  ];
  roadmapTitles.forEach((orig, i) => {
    const step = val(`roadmap${i + 1}`);
    if (step) html = replaceAll(html, `<h3>${orig}</h3>`, `<h3>${escapeHtml(step)}</h3>`);
  });

  // 11. Address (address line + footer). Do this before the client-name pass.
  if (address) {
    html = replaceAll(html, 'Zuiderkade 3, 1948 NG Beverwijk', escapeHtml(address));
  }

  // 12. Client name (topbar alt, coach text, testimonials cite, footer, alts)
  if (clientName) {
    html = replaceAll(html, 'PTF By Joep', escapeHtml(clientName));
  }

  return html;
}

module.exports = { buildLandingPage, validate, FIELD_LABELS };

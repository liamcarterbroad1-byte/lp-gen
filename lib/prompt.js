const fs = require('fs');
const path = require('path');

const REFERENCE_TEMPLATE = fs.readFileSync(
  path.join(__dirname, '..', 'reference-template.html'),
  'utf8'
);

// The full instruction block. This is stable across every request, so we send it
// as the system prompt and mark it for prompt caching — the variable client brief
// goes in the user message.
const INSTRUCTIONS = `You are an expert conversion-focused landing page developer. Build a mobile-first landing/planner page for a Meta ads funnel, for the client described in INPUTS, by adapting the proven REFERENCE TEMPLATE at the bottom of this message. The template is battle-tested inside GoHighLevel — its structure and JavaScript contain specific fixes that must survive untouched.

INSTRUCTIONS — follow exactly

1. BASE: Use the REFERENCE TEMPLATE below as the exact base. Keep the section order, HTML structure, CSS architecture (all classes stay prefixed "ptf-") and ALL JavaScript logic identical. Only swap brand values and rewrite visible copy. Do NOT restructure, "improve" or simplify the code.
2. COLORS: Set the primary brand color as --ptf-olive. Derive the other tokens from it: --ptf-olive-soft (slightly lighter), --ptf-olive-dark (clearly darker), --ptf-olive-light (very light tint for section backgrounds), --ptf-cream (near-white warm tint). Also replace EVERY hardcoded color occurrence outside the CSS variables: the html/body background rule at the top of the CSS, the two backgrounds set in JavaScript near the end, the stroke/ fill colors inside inline SVGs, and the button gradient — they must all match the new palette. Keep text ink near-black and surfaces white; verify text contrast stays readable.
3. BOOKING PLANNER: From the pasted GHL embed code, extract the iframe src URL and the iframe id. Use the URL + id verbatim for the hero planner iframe. In the JavaScript, the popup iframe src is the same URL and its id must be the booking-widget id with suffix "_popup" (it must differ from the hero iframe id). Load the form_embed.js script exactly once, before the custom script.
4. MAP: Build the Google Maps iframe src as https://www.google.com/maps?q=<URL-ENCODED business name + full address>&z=15&output=embed
5. DO-NOT-TOUCH JAVASCRIPT (these fix real GHL/iOS bugs):
   * Re-parenting of #ptf-sticky-cta and #ptf-modal to document.body (GHL wrappers use CSS transforms that break position:fixed).
   * The ancestor loop that zeroes margin/padding/background of GHL wrappers plus the html/body background override (kills white bars above/below the page).
   * Sticky CTA shows only when scrollY > 150 AND the hero planner is out of view, re-checked on scroll (prevents it appearing on slow first load before the planner renders).
   * The parked sticky CTA is visibility:hidden with the delayed visibility transition (prevents it shining through iOS Safari's translucent bottom toolbar on first load).
   * The popup iframe is injected on first open only.
   * The 100vw negative-margin breakout on #ptf-lp (full-bleed inside GHL columns).
6. COPY: Write all visible text in the requested language, adapted to the client, their offer and their audience. This includes: the hero (use the given headline/subtext verbatim), 3 trust badges, planner-card header line, microtrust line, USP section (title + 3 cards with fitting inline SVG icons), roadmap intro + the 4 given steps, coach section, 4 FAQ items answering the most likely objections to THIS offer, final CTA with a soft urgency badge, footer with name + address. Tone: energetic, personal, conversion-focused, no hype.
7. TESTIMONIALS: Keep exactly 2 testimonial cards with 5 stars. Write plausible but clearly generic quotes attributed as "— Lid van <client name>" (or fitting equivalent) and keep the HTML comment marking them as placeholders to be replaced with real reviews.
8. OUTPUT: Return ONE code block containing the complete final file and nothing else — no explanations before or after. The code must be paste-ready for a GoHighLevel Custom Code element (no <!DOCTYPE>, <html>, <head> or <body> tags).

REFERENCE TEMPLATE (proven code — adapt, don't restructure)

${REFERENCE_TEMPLATE}`;

const FIELD_LABELS = {
  clientName: 'Client / business name',
  businessType: 'Type of business & what they offer',
  primaryColor: 'Primary brand color (hex)',
  otherColors: 'Other brand colors (optional)',
  logoUrl: 'Logo URL',
  photo1Url: 'Photo 1 — atmosphere/group photo URL',
  photo2Url: 'Photo 2 — coach/owner photo URL',
  coachName: 'Coach/owner name + role',
  ghlEmbed: 'GHL planner embed code (paste the full iframe + script)',
  offerHeadline: 'Offer headline (H1)',
  offerSubtext: 'Offer subtext (under H1)',
  funnelStep: 'Funnel step label (top of hero)',
  roadmap: 'Roadmap — what the lead can expect, 4 steps',
  address: 'Business address (street, zip, city)',
  ctaText: 'Main CTA button text',
  language: 'Language of the page',
  specialWishes: 'Special wishes',
};

function line(label, value) {
  const v = (value == null || String(value).trim() === '') ? '(not provided)' : String(value).trim();
  return `* ${label}: ${v}`;
}

// Turns the submitted form fields into the INPUTS block the prompt expects.
function buildInputsMessage(data = {}) {
  const roadmapSteps = [1, 2, 3, 4]
    .map((n) => {
      const v = data[`roadmap${n}`];
      return v && String(v).trim() ? `${n}) ${String(v).trim()}` : null;
    })
    .filter(Boolean)
    .join('  ');

  const rows = [
    line(FIELD_LABELS.clientName, data.clientName),
    line(FIELD_LABELS.businessType, data.businessType),
    line(FIELD_LABELS.primaryColor, data.primaryColor),
    line(FIELD_LABELS.otherColors, data.otherColors || 'derive from primary'),
    line(FIELD_LABELS.logoUrl, data.logoUrl),
    line(FIELD_LABELS.photo1Url, data.photo1Url),
    line(FIELD_LABELS.photo2Url, data.photo2Url),
    line(FIELD_LABELS.coachName, data.coachName),
    line(FIELD_LABELS.ghlEmbed, data.ghlEmbed),
    line(FIELD_LABELS.offerHeadline, data.offerHeadline),
    line(FIELD_LABELS.offerSubtext, data.offerSubtext),
    line(FIELD_LABELS.funnelStep, data.funnelStep || 'skip'),
    line(FIELD_LABELS.roadmap, roadmapSteps),
    line(FIELD_LABELS.address, data.address),
    line(FIELD_LABELS.ctaText, data.ctaText || 'derive from offer'),
    line(FIELD_LABELS.language, data.language || 'Nederlands'),
    line(FIELD_LABELS.specialWishes, data.specialWishes || 'none'),
  ];

  return `INPUTS\n\n${rows.join('\n')}`;
}

// Server-side check so we fail fast before spending a Claude call.
const REQUIRED_FIELDS = ['clientName', 'businessType', 'primaryColor', 'ghlEmbed', 'offerHeadline'];

function validate(data = {}) {
  const missing = REQUIRED_FIELDS.filter(
    (f) => !data[f] || String(data[f]).trim() === ''
  ).map((f) => FIELD_LABELS[f]);
  return missing;
}

module.exports = { INSTRUCTIONS, buildInputsMessage, validate, FIELD_LABELS };

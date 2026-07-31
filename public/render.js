// Browser-side landing-page renderer. Pure string substitution — no server,
// no network, no keys. Exposes window.LPGEN = { buildLandingPage, validate }.
(function () {
  'use strict';

  var FIELD_LABELS = {
    clientName: 'Client / business name',
    primaryColor: 'Primary brand color (hex)',
    logoUrl: 'Logo URL',
    photo1Url: 'Photo 1 — atmosphere/group photo URL',
    photo2Url: 'Photo 2 — coach/owner photo URL',
    coachName: 'Coach/owner name + role',
    coach2Name: 'Coach 2 — name + role',
    coach2Photo: 'Coach 2 — photo URL',
    ghlEmbed: 'GHL planner embed code',
    offerHeadline: 'Offer headline (H1)',
    offerSubtext: 'Offer subtext (under H1)',
    funnelStep: 'Funnel step label (top of hero)',
    address: 'Business address (street, zip, city)',
    ctaText: 'Main CTA button text',
  };

  var REQUIRED_FIELDS = ['clientName', 'primaryColor', 'ghlEmbed', 'offerHeadline'];
  var SERVICES = ['personal_training', 'small_group', 'online_coaching', 'pilates'];
  var PHYSICAL = ['small_group', 'personal_training', 'pilates']; // has a studio

  function validate(data) {
    data = data || {};
    var missing = REQUIRED_FIELDS.filter(function (f) {
      return !data[f] || String(data[f]).trim() === '';
    }).map(function (f) { return FIELD_LABELS[f]; });

    if (data.primaryColor && String(data.primaryColor).trim() && !normalizeHex(data.primaryColor)) {
      missing.push('Primary brand color (must be a hex like #525A43)');
    }
    return missing;
  }

  // ── Baseline (small-group) copy the packs rewrite ───────────────────────────
  var BASE = {
    subtext: 'Kies hieronder een moment dat jou uitkomt. Je traint samen in een kleine groep in onze studio in Beverwijk en ontvangt direct een bevestiging per mail.',
    coachPara: 'Bij <strong>PTF By Joep</strong> train je nooit anoniem. Omdat de groepen klein blijven, kent Joep jouw doelen, houdt hij je techniek scherp en past hij de oefeningen aan op jouw niveau. Of je nu net begint of al jaren traint — jij traint op jouw tempo, met begeleiding die je vooruit helpt.',
    testi1: '"Door de kleine groep krijg je echt persoonlijke begeleiding. Ik voel me fitter én sterker dan ooit."',
    testi2: '"De vaste momenten en de groep houden me op de been. Trainen is nu iets waar ik naar uitkijk."',
    faq2: 'Zeker. Elke oefening wordt aangepast op jouw niveau. Juist beginners halen veel uit de persoonlijke begeleiding in een kleine groep.',
    faq4a: 'We trainen bewust in kleine groepen, zodat er altijd persoonlijke aandacht is voor jouw techniek en doelen.',
    usp1: 'Kleine groepen, dus de coach ziet élke herhaling en stuurt direct bij.',
    usp3desc: 'Vaste trainingsmomenten en een stok achter de deur — zo blijf je gaan.',
  };

  // ── Roadmap: 4 designed steps per service (no user input) ────────────────────
  var ROADMAP_ORIG = [
    { t: 'Intake', d: 'We bespreken jouw doelen, ervaring en eventuele blessures, zodat je training écht bij jou past.' },
    { t: 'Proefles', d: 'Ervaar direct hoe het is om te trainen in een kleine groep met persoonlijke aandacht.' },
    { t: '2 Weken gratis &amp; vrijblijvend uitproberen', d: 'Train twee volle weken gratis mee. Bevalt het niet? Dan stopt het vanzelf — zonder gedoe.' },
    { t: 'Exclusieve korting bij aanmelden', d: 'Besluit je door te gaan, dan ontvang je als proefdeelnemer een exclusieve korting op je lidmaatschap.' },
  ];

  // Neutral base roadmaps — no free-trial / discount baked in. When an offer is
  // entered, step 3 is swapped for it (see applyRoadmap).
  var ROADMAP = {
    small_group: [
      { t: 'Intake', d: 'We bespreken jouw doelen, ervaring en eventuele blessures, zodat je training écht bij jou past.' },
      { t: 'Proefles', d: 'Ervaar direct hoe het is om te trainen in een kleine groep met persoonlijke aandacht.' },
      { t: 'Aan de slag', d: 'Je traint mee in een kleine groep, op het moment dat jou uitkomt.' },
      { t: 'Bereik je doel', d: 'Met vaste momenten en persoonlijke aandacht werk je gericht naar jouw doel.' },
    ],
    personal_training: [
      { t: 'Kennismaking', d: 'We bespreken jouw doelen, ervaring en blessures, zodat jouw 1-op-1 training perfect aansluit.' },
      { t: 'Proefsessie', d: 'Ervaar direct hoe het is om 1-op-1 te trainen met volledige aandacht voor jouw techniek.' },
      { t: 'Aan de slag', d: 'Je start je 1-op-1 sessies op momenten die jou uitkomen.' },
      { t: 'Bereik je doel', d: 'Samen werken we gericht toe naar jouw doel, met een plan op maat.' },
    ],
    online_coaching: [
      { t: 'Intake-call', d: 'In een korte online call bespreken we jouw doelen, ervaring en wat je nodig hebt.' },
      { t: 'Persoonlijk schema', d: "Je ontvangt een programma op maat met instructievideo's, direct te starten vanaf je telefoon." },
      { t: 'Aan de slag', d: 'Je start met je persoonlijke programma, direct vanaf je telefoon.' },
      { t: 'Bereik je doel', d: 'Met doorlopende check-ins en bijsturing werk je gericht naar jouw doel.' },
    ],
    pilates: [
      { t: 'Kennismaking', d: 'We bespreken jouw doelen en eventuele klachten, zodat elke oefening bij jouw lichaam past.' },
      { t: 'Proefles', d: 'Ervaar direct hoe rustig en gecontroleerd Pilates werkt, met persoonlijke correcties.' },
      { t: 'Aan de slag', d: 'Je traint mee in een kleine groep, op het moment dat jou uitkomt.' },
      { t: 'Bereik je doel', d: 'Met vaste momenten en persoonlijke correcties bouw je rustig op naar jouw doel.' },
    ],
  };

  // ── Service-specific copy packs (small group = baseline, applies nothing) ─────
  var SERVICE_COPY = {
    small_group: [],

    personal_training: [
      ['Kleine groepen</span>', '1-op-1 begeleiding</span>'],
      [BASE.subtext, 'Kies hieronder een moment dat jou uitkomt. Je traint 1-op-1 met je eigen coach en ontvangt direct een bevestiging per mail.'],
      ['Trainen met resultaat, zonder sportschool-gevoel', 'Trainen met resultaat, volledig op jou afgestemd'],
      ['Small-group training bij PTF By Joep in Beverwijk', 'Persoonlijke training bij PTF By Joep'],
      [BASE.usp1, '1-op-1 met je coach, dus élke herhaling wordt gezien en direct bijgestuurd.'],
      ['Samen volhouden', 'Structuur &amp; voortgang'],
      [BASE.usp3desc, 'Vaste afspraken en een coach die je scherp houdt — zo blijf je gaan.'],
      ['Persoonlijke aandacht, ook in de groep.', 'Persoonlijke aandacht, elke sessie.'],
      [BASE.coachPara, 'Bij <strong>PTF By Joep</strong> train je nooit anoniem. In jouw 1-op-1 sessies kent Joep jouw doelen, houdt hij je techniek scherp en past hij elke oefening aan op jouw niveau. Of je nu net begint of al jaren traint — jij traint op jouw tempo, met begeleiding die je vooruit helpt.'],
      [BASE.testi1, '"Door de 1-op-1 begeleiding krijg je echt persoonlijke aandacht. Ik voel me fitter én sterker dan ooit."'],
      [BASE.testi2, '"De vaste afspraken en persoonlijke aandacht houden me op de been. Trainen is nu iets waar ik naar uitkijk."'],
      [BASE.faq2, 'Zeker. Elke oefening wordt aangepast op jouw niveau. Juist beginners halen veel uit de 1-op-1 begeleiding.'],
      ['Hoe groot zijn de groepen?', 'Is dit echt helemaal privé?'],
      [BASE.faq4a, 'Ja. Je traint 1-op-1 met je eigen coach, volledig gericht op jouw doelen en techniek.'],
      ['Plekken per groep zijn beperkt', 'Er zijn beperkt plekken beschikbaar'],
    ],

    online_coaching: [
      ['Kleine groepen</span>', '100% online</span>'],
      [BASE.subtext, 'Kies hieronder een moment voor je kennismaking. We bespreken online jouw doelen en je ontvangt direct een bevestiging per mail.'],
      ['Trainen met resultaat, zonder sportschool-gevoel', 'Trainen met resultaat, waar en wanneer jij wilt'],
      ['Small-group training bij PTF By Joep in Beverwijk', 'Online coaching van PTF By Joep'],
      [BASE.usp1, 'Persoonlijke video-feedback, dus élke herhaling wordt gezien en direct bijgestuurd.'],
      ['Samen volhouden', 'Structuur &amp; voortgang'],
      [BASE.usp3desc, 'Een vast schema en check-ins die je scherp houden — zo blijf je gaan.'],
      ['Persoonlijke aandacht, ook in de groep.', 'Persoonlijke aandacht, ook op afstand.'],
      [BASE.coachPara, 'Bij <strong>PTF By Joep</strong> sta je er nooit alleen voor. Via je persoonlijke online programma kent Joep jouw doelen, houdt hij je techniek scherp en stuurt hij je schema bij op jouw niveau. Of je nu net begint of al jaren traint — jij traint op jouw tempo, waar je ook bent, met begeleiding die je vooruit helpt.'],
      [BASE.testi1, '"Zelfs online krijg je echt persoonlijke begeleiding. Ik voel me fitter én sterker dan ooit."'],
      [BASE.testi2, '"Het schema en de check-ins houden me op de been. Trainen is nu iets waar ik naar uitkijk."'],
      [BASE.faq2, 'Zeker. Elke oefening wordt aangepast op jouw niveau. Juist beginners halen veel uit de persoonlijke online begeleiding.'],
      ['Wat moet ik meenemen?', 'Wat heb ik nodig om te starten?'],
      ['Sportkleding, binnenschoenen, een handdoek en een flesje water. Voor de rest zorgen wij.', 'Een smartphone of laptop, een stukje ruimte en eventueel basis-materiaal. De rest krijg je via het programma.'],
      ['Hoe groot zijn de groepen?', 'Hoe werkt de begeleiding op afstand?'],
      [BASE.faq4a, "Je krijgt een persoonlijk schema, instructievideo's en regelmatige check-ins, zodat je altijd weet wat je moet doen."],
      ['Plekken per groep zijn beperkt', 'Er zijn beperkt plekken beschikbaar'],
      ['De studio', 'Online coaching'],
      ['Onze studio in Beverwijk', 'Jouw coaching, volledig online'],
      ['Gratis parkeren voor de deur en makkelijk bereikbaar vanuit heel de IJmond.', 'Train live met je coach of op je eigen moment — thuis, in de sportschool of onderweg. Alles via één app.'],
    ],

    pilates: [
      ['Kleine groepen</span>', 'Voor elk niveau</span>'],
      [BASE.subtext, 'Kies hieronder een moment dat jou uitkomt. Je traint in een kleine groep in onze studio en ontvangt direct een bevestiging per mail.'],
      ['Trainen met resultaat, zonder sportschool-gevoel', 'Sterker, soepeler en in balans — met Pilates'],
      ['Small-group training bij PTF By Joep in Beverwijk', 'Pilates bij PTF By Joep'],
      [BASE.usp1, 'Kleine groepen, dus de instructeur ziet élke beweging en corrigeert direct.'],
      ['Samen volhouden', 'Balans &amp; controle'],
      [BASE.usp3desc, 'Vaste momenten en persoonlijke correcties — zo bouw je rustig en blessurevrij op.'],
      ['Persoonlijke aandacht, ook in de groep.', 'Persoonlijke aandacht en correcties, elke les.'],
      [BASE.coachPara, 'Bij <strong>PTF By Joep</strong> train je nooit anoniem. Omdat de groepen klein blijven, kent Joep jouw lichaam en doelen, houdt hij je houding scherp en past hij elke oefening aan op jouw niveau. Of je nu net begint of al jaren traint — jij traint op jouw tempo, met begeleiding die je vooruit helpt.'],
      [BASE.testi1, '"Door de kleine groep krijg ik echt persoonlijke correcties. Ik voel me sterker én soepeler dan ooit."'],
      [BASE.testi2, '"De rust en aandacht in de les houden me op de been. Pilates is nu mijn vaste moment."'],
      ['Hoe groot zijn de groepen?', 'Heb ik ervaring nodig?'],
      [BASE.faq4a, 'Nee. Pilates is voor elk niveau. We beginnen bij de basis en bouwen rustig op, met persoonlijke correcties.'],
      ['Plekken per groep zijn beperkt', 'Plekken per les zijn beperkt'],
    ],
  };

  // ── helpers ──
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(str) { return String(str).replace(/"/g, '&quot;'); }
  function replaceAll(hay, needle, rep) { return hay.split(needle).join(rep); }
  function replaceAllCI(hay, needle, rep) {
    var re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return hay.replace(re, rep);
  }
  function firstNameOf(name) {
    var head = String(name || '').split(/[·\-–—,|]/)[0].trim();
    return head.split(/\s+/)[0] || '';
  }
  // Derive the city from a "street, [zip] city" address.
  function cityOf(address) {
    if (!address || address.indexOf(',') < 0) return '';
    var parts = address.split(',');
    var last = parts[parts.length - 1].trim();
    last = last.replace(/^\d{4}\s*[A-Za-z]{2}\b\s*/, '').trim(); // strip Dutch postcode
    if (!last || /\d/.test(last)) return '';
    return last;
  }

  // ── color math ──
  function normalizeHex(input) {
    if (!input) return null;
    var h = String(input).trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return '#' + h.toUpperCase();
  }
  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHex(r, g, b) {
    function to(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'); }
    return '#' + to(r) + to(g) + to(b);
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }
  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) { var v = l * 255; return [v, v, v]; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    function hue(t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function shiftL(hex, delta) {
    var hsl = rgbToHsl.apply(null, hexToRgb(hex));
    return rgbToHex.apply(null, hslToRgb(hsl[0], hsl[1], clamp(hsl[2] + delta, 0, 100)));
  }
  function toTint(hex, targetL, satFactor) {
    var hsl = rgbToHsl.apply(null, hexToRgb(hex));
    return rgbToHex.apply(null, hslToRgb(hsl[0], hsl[1] * satFactor, targetL));
  }
  function rgbTriplet(hex) { var r = hexToRgb(hex); return r[0] + ',' + r[1] + ',' + r[2]; }

  function colorize(html, primary) {
    var olive = primary;
    var oliveSoft = shiftL(olive, 6);
    var oliveDark = shiftL(olive, -12);
    var oliveDarker = shiftL(olive, -19);
    var oliveLight = toTint(olive, 92, 0.30);
    var cream = toTint(olive, 98, 0.25);
    var dot = shiftL(olive, 14);
    var urgencyDot = toTint(olive, 80, 0.45);

    var hexMap = [
      ['#3F4633', oliveDark], ['#525A43', olive], ['#5E6750', oliveSoft],
      ['#47503A', oliveDarker], ['#EDEFE8', oliveLight], ['#FAFAF7', cream],
      ['#6d7a54', dot], ['#cdd6b8', urgencyDot],
    ];
    hexMap.forEach(function (m) { html = replaceAllCI(html, m[0], m[1]); });

    var rgbMap = [
      ['109,122,84', rgbTriplet(dot)], ['82,90,67', rgbTriplet(olive)], ['63,70,51', rgbTriplet(oliveDark)],
    ];
    rgbMap.forEach(function (m) { html = replaceAll(html, 'rgba(' + m[0] + ',', 'rgba(' + m[1] + ','); });

    return html;
  }

  function parseEmbed(embed) {
    if (!embed) return {};
    var srcM = embed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
    var idM = embed.match(/<iframe[^>]*\sid=["']([^"']+)["']/i);
    return { src: srcM ? srcM[1] : undefined, id: idM ? idM[1] : undefined };
  }

  function applyServicePack(html, service) {
    (SERVICE_COPY[service] || []).forEach(function (pair) { html = replaceAll(html, pair[0], pair[1]); });
    return html;
  }

  function applyRoadmap(html, service, offer) {
    var steps = (ROADMAP[service] || ROADMAP['small_group']).slice();
    // When an offer is entered, step 3 becomes the offer step.
    if (offer) {
      steps[2] = { t: escapeHtml(offer), d: 'Ervaar het zelf en ontdek of het bij je past — vrijblijvend en zonder gedoe.' };
    }
    ROADMAP_ORIG.forEach(function (orig, i) {
      html = replaceAll(html, '<h3>' + orig.t + '</h3>', '<h3>' + steps[i].t + '</h3>');
      html = replaceAll(html, orig.d, steps[i].d);
    });
    return html;
  }

  // The base template makes no free-trial / discount claim. An offer or a
  // guarantee is re-injected only when the user enters one.
  function applyOfferGuarantee(html, offer, guarantee) {
    var oe = escapeHtml(offer);
    var ge = escapeHtml(guarantee);

    // Final-CTA note (compute, then replace) — must run before the badge below
    // since both contain "100% gratis".
    var first = offer ? oe : 'Vrijblijvend';
    var second = guarantee ? ge : 'Geen verplichtingen';
    html = replaceAll(html, '✓ 100% gratis · ✓ Geen verplichtingen', '✓ ' + first + ' · ✓ ' + second);

    // Hero badge 1
    html = replaceAll(html, '</svg>100% gratis</span>', '</svg>' + (offer ? oe : 'Persoonlijke aanpak') + '</span>');

    // Sticky CTA
    html = replaceAll(html, 'Probeer 2 weken gratis', offer ? ('Probeer ' + oe) : 'Plan je kennismaking');

    // Neutralise payment-detail claims (offers vary; don't assume free)
    html = replaceAll(html, 'Binnen 2 minuten geregeld · Geen betaalgegevens nodig', 'Binnen 2 minuten geregeld · Vrijblijvend');
    html = replaceAll(html, '✓ Geen betaalgegevens nodig', '✓ Vrijblijvend geregeld');

    // FAQ 1 (about commitment / the deal)
    var faqQ = offer ? 'Is de actie echt vrijblijvend?' : 'Zit ik ergens aan vast?';
    var faqA = offer
      ? ('Ja. ' + oe + ' is volledig vrijblijvend. Je zit nergens aan vast en er wordt niets automatisch verlengd.')
      : 'Nee. Een kennismaking is volledig vrijblijvend. Je zit nergens aan vast en er wordt niets automatisch verlengd.';
    html = replaceAll(html, 'Is het echt gratis en vrijblijvend?', faqQ);
    html = replaceAll(html, 'Ja. Je traint twee weken volledig gratis mee. Je zit nergens aan vast en er wordt niets automatisch verlengd.', faqA);

    // Guarantee badge in the hero (prepended to the badge row)
    if (guarantee) {
      var shield = '<span><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5 3 3.2v3.4c0 3 2.1 4.9 5 6 2.9-1.1 5-3 5-6V3.2L8 1.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>' + ge + '</span>';
      html = replaceAll(html, '<div class="ptf-badges">', '<div class="ptf-badges">' + shield);
    }
    return html;
  }

  // Studio location text follows the address entered (physical services only).
  function applyLocation(html, address) {
    var city = cityOf(address);
    if (city) {
      html = replaceAll(html, 'Onze studio in Beverwijk', 'Onze studio in ' + escapeHtml(city));
      html = replaceAll(html, 'onze studio in Beverwijk', 'onze studio in ' + escapeHtml(city));
    } else {
      html = replaceAll(html, 'Onze studio in Beverwijk', 'Onze studio');
      html = replaceAll(html, 'in onze studio in Beverwijk', 'in onze studio');
    }
    html = replaceAll(html, 'Gratis parkeren voor de deur en makkelijk bereikbaar vanuit heel de IJmond.', 'Goed bereikbaar en makkelijk te vinden.');
    return html;
  }

  // A self-contained "online coaching space" mockup (a video-call window) that
  // replaces the Google map for online coaching. Uses the brand CSS variables so
  // it recolors with the palette. No external assets.
  var ONLINE_MOCK =
    '<div class="ptf-online-mock ptf-reveal">' +
      '<div class="ptf-mock-win">' +
        '<div class="ptf-mock-bar">' +
          '<span class="ptf-mock-dots"><i></i><i></i><i></i></span>' +
          '<span class="ptf-mock-live"><span class="ptf-mock-livedot"></span>LIVE</span>' +
        '</div>' +
        '<div class="ptf-mock-stage">' +
          '<div class="ptf-mock-coach"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4.2"/><path d="M3.5 21a8.5 8.5 0 0 1 17 0Z"/></svg><span class="ptf-mock-name">Jouw coach</span></div>' +
          '<div class="ptf-mock-self"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="9" r="3.2"/><path d="M6 20a6 6 0 0 1 12 0Z"/></svg></div>' +
          '<div class="ptf-mock-ctrls"><span></span><span></span><span class="end"></span></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var ONLINE_MOCK_CSS =
    '#ptf-lp .ptf-online-mock{max-width:520px;margin:26px auto 0}' +
    '#ptf-lp .ptf-mock-win{border-radius:20px;overflow:hidden;border:1px solid rgba(20,21,17,.08);box-shadow:0 18px 50px rgba(20,21,17,.16);background:var(--ptf-white)}' +
    '#ptf-lp .ptf-mock-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--ptf-olive-dark)}' +
    '#ptf-lp .ptf-mock-dots{display:inline-flex;gap:6px}' +
    '#ptf-lp .ptf-mock-dots i{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.35)}' +
    '#ptf-lp .ptf-mock-live{display:inline-flex;align-items:center;gap:7px;color:#fff;font-size:.72rem;font-weight:800;letter-spacing:.1em}' +
    '#ptf-lp .ptf-mock-livedot{width:8px;height:8px;border-radius:50%;background:#ff5b5b}' +
    '#ptf-lp .ptf-mock-stage{position:relative;aspect-ratio:16/10;background:radial-gradient(120% 100% at 50% 0%,var(--ptf-olive-soft),var(--ptf-olive) 58%,var(--ptf-olive-dark));display:flex;align-items:center;justify-content:center}' +
    '#ptf-lp .ptf-mock-coach{display:flex;flex-direction:column;align-items:center;gap:12px;color:rgba(255,255,255,.92)}' +
    '#ptf-lp .ptf-mock-coach svg{width:78px;height:78px;opacity:.92}' +
    '#ptf-lp .ptf-mock-name{font-size:.8rem;font-weight:700;background:rgba(0,0,0,.22);padding:4px 14px;border-radius:999px;color:#fff}' +
    '#ptf-lp .ptf-mock-self{position:absolute;top:14px;right:14px;width:78px;height:58px;border-radius:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center}' +
    '#ptf-lp .ptf-mock-self svg{width:32px;height:32px;color:rgba(255,255,255,.82)}' +
    '#ptf-lp .ptf-mock-ctrls{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);display:inline-flex;gap:12px}' +
    '#ptf-lp .ptf-mock-ctrls span{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28)}' +
    '#ptf-lp .ptf-mock-ctrls span.end{background:#ff5b5b;border-color:#ff5b5b}';

  // Online coaching: swap the Google map for the mockup, drop the address line,
  // and (when no address was given) the footer address too.
  function applyOnlineSpace(html, hasAddress) {
    html = html.replace(/<div class="ptf-map-card ptf-reveal">[\s\S]*?<\/div>/, ONLINE_MOCK);
    html = html.replace(/\s*<p class="ptf-address">[\s\S]*?<\/p>/, '');
    if (!hasAddress) html = replaceAll(html, '<br>Zuiderkade 3, 1948 NG Beverwijk', '');
    html = html.replace('</style>', ONLINE_MOCK_CSS + '</style>');
    return html;
  }

  var COACH_PNG = 'https://assets.cdn.filesafe.space/9fhovZYk1lVT2zNK01rv/media/69bd3dd68944bb8666d93138.png';

  // Replace the single coach card with two coach cards + a team paragraph.
  function applyTwoCoaches(html, coach1Name, coach1Photo, coach2Name, coach2Photo) {
    var c1 = firstNameOf(coach1Name) || 'je coach';
    var c2 = firstNameOf(coach2Name) || 'je coach';
    var p1 = coach1Photo || COACH_PNG;

    var duo =
      '<div class="ptf-coach-duo ptf-reveal">' +
        '<div class="ptf-coach-card">' +
          '<img class="ptf-coach-img" src="' + escapeAttr(p1) + '" alt="' + escapeAttr(c1) + '" loading="lazy">' +
          '<span class="ptf-coach-tag">' + escapeHtml(coach1Name) + '</span>' +
        '</div>' +
        '<div class="ptf-coach-card">' +
          '<img class="ptf-coach-img" src="' + escapeAttr(coach2Photo) + '" alt="' + escapeAttr(c2) + '" loading="lazy">' +
          '<span class="ptf-coach-tag">' + escapeHtml(coach2Name) + '</span>' +
        '</div>' +
      '</div>';

    html = html.replace(/<div class="ptf-coach-card ptf-reveal">[\s\S]*?<\/div>/, duo);
    html = replaceAll(html, '<span class="ptf-kicker ptf-reveal">Jouw coach</span>', '<span class="ptf-kicker ptf-reveal">Jouw coaches</span>');
    html = replaceAll(html, '<h2 class="ptf-reveal">Train onder begeleiding van Joep</h2>', '<h2 class="ptf-reveal">Train onder begeleiding van ' + escapeHtml(c1) + ' &amp; ' + escapeHtml(c2) + '</h2>');

    var teamPara = '<p class="ptf-coach-text ptf-reveal">Bij <strong>PTF By Joep</strong> train je nooit anoniem. ' +
      escapeHtml(c1) + ' en ' + escapeHtml(c2) + ' kennen jouw doelen, houden je techniek scherp en passen de training aan op jouw niveau. Of je nu net begint of al jaren traint — jij traint op jouw tempo, met begeleiding die je vooruit helpt.</p>';
    html = html.replace(/<p class="ptf-coach-text ptf-reveal">[\s\S]*?<\/p>/, teamPara);

    var css = '#ptf-lp .ptf-coach-duo{display:flex;flex-wrap:wrap;gap:30px 16px;justify-content:center;max-width:520px;margin:0 auto 24px}#ptf-lp .ptf-coach-duo .ptf-coach-card{flex:1 1 200px;min-width:180px;max-width:240px;margin:0}';
    html = html.replace('</style>', css + '</style>');
    return html;
  }

  function buildLandingPage(data) {
    data = data || {};
    var html = window.PTF_TEMPLATE;
    function val(k) { return data[k] == null ? '' : String(data[k]).trim(); }

    var service = SERVICES.indexOf(data.service) >= 0 ? data.service : 'small_group';
    var isPhysical = PHYSICAL.indexOf(service) >= 0;
    var address = val('address');
    var clientName = val('clientName');
    var offer = val('offer');
    var guarantee = val('guarantee');

    // 1. Colors
    var primary = normalizeHex(val('primaryColor'));
    if (primary) html = colorize(html, primary);

    // 2. Hero subtext (user text wins; else the service default applies next)
    if (val('offerSubtext')) html = replaceAll(html, BASE.subtext, escapeHtml(val('offerSubtext')));

    // 3. Service copy pack + roadmap + optional offer/guarantee
    html = applyServicePack(html, service);
    html = applyRoadmap(html, service, offer);
    html = applyOfferGuarantee(html, offer, guarantee);

    // 4. Location: physical → city-aware studio text; online → mockup, no map
    if (isPhysical) {
      html = applyLocation(html, address);
    } else if (service === 'online_coaching') {
      html = applyOnlineSpace(html, !!address);
    }

    // 5. Two coaches (needs coach 1 name, coach 2 name + photo)
    var twoCoaches = data.twoCoaches === 'yes' || data.twoCoaches === 'on' || data.twoCoaches === true;
    if (twoCoaches && val('coachName') && val('coach2Name') && val('coach2Photo')) {
      html = applyTwoCoaches(html, val('coachName'), val('photo2Url'), val('coach2Name'), val('coach2Photo'));
    }

    // 6. Booking planner (single inline widget in the hero — CTAs scroll to it)
    var embed = parseEmbed(val('ghlEmbed'));
    var ORIG_URL = 'https://api.leadconnectorhq.com/widget/booking/lhumA8v6bLvnQ7v25jYY';
    var ORIG_HERO_ID = 'lhumA8v6bLvnQ7v25jYY_1784898793215';
    if (embed.src) html = replaceAll(html, ORIG_URL, escapeAttr(embed.src));
    if (embed.id) html = replaceAll(html, ORIG_HERO_ID, escapeAttr(embed.id));

    // 7. Map
    var ORIG_MAP = 'https://www.google.com/maps?q=PTF%20by%20Joep%2C%20Zuiderkade%203%2C%201948%20NG%20Beverwijk&z=15&output=embed';
    if (address || clientName) {
      var query = [clientName, address].filter(Boolean).join(', ');
      html = replaceAll(html, ORIG_MAP, 'https://www.google.com/maps?q=' + encodeURIComponent(query) + '&z=15&output=embed');
    }

    // 8. Media
    if (val('logoUrl')) html = replaceAll(html, 'https://www.ptf-by-joep.nl/wp-content/uploads/2024/01/PTF-by-Joep-Logo-150x150.png', escapeAttr(val('logoUrl')));
    if (val('photo1Url')) html = replaceAll(html, 'https://assets.cdn.filesafe.space/9fhovZYk1lVT2zNK01rv/media/69bd39a90e1bdb83c17a64fc.png', escapeAttr(val('photo1Url')));
    if (val('photo2Url')) html = replaceAll(html, COACH_PNG, escapeAttr(val('photo2Url')));

    // 9. Headline
    if (val('offerHeadline')) html = html.replace(/<h1>[\s\S]*?<\/h1>/, '<h1>' + escapeHtml(val('offerHeadline')) + '</h1>');

    // 10. Funnel step
    var funnel = val('funnelStep');
    var EYEBROW = '<span class="ptf-eyebrow">Stap 2 · Kies je trainingsmoment</span>';
    if (funnel && funnel.toLowerCase() !== 'skip') {
      html = replaceAll(html, EYEBROW, '<span class="ptf-eyebrow">' + escapeHtml(funnel) + '</span>');
    } else if (funnel.toLowerCase() === 'skip') {
      html = replaceAll(html, EYEBROW + '\n      ', '');
      html = replaceAll(html, EYEBROW, '');
    }

    // 11. Coach tag (single-coach path)
    if (val('coachName')) html = replaceAll(html, 'Joep · Oprichter &amp; Coach', escapeHtml(val('coachName')));

    // 12. CTA (base is neutral — no free-trial verb unless the user sets one)
    html = replaceAll(html, 'Plan je gratis proefperiode', val('ctaText') ? escapeHtml(val('ctaText')) : 'Plan je kennismaking');

    // 13. Address literal
    if (address) html = replaceAll(html, 'Zuiderkade 3, 1948 NG Beverwijk', escapeHtml(address));

    // 14. Client name (before coach first-name so it doesn't see "PTF By Joep")
    if (clientName) html = replaceAll(html, 'PTF By Joep', escapeHtml(clientName));

    // 15. Coach first name in headings/paragraph (single-coach path)
    if (val('coachName')) {
      var fn = firstNameOf(val('coachName'));
      if (fn) html = replaceAll(html, 'Joep', escapeHtml(fn));
    }

    return html;
  }

  window.LPGEN = { buildLandingPage: buildLandingPage, validate: validate };
})();

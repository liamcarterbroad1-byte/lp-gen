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
    ghlEmbed: 'GHL planner embed code',
    offerHeadline: 'Offer headline (H1)',
    offerSubtext: 'Offer subtext (under H1)',
    funnelStep: 'Funnel step label (top of hero)',
    address: 'Business address (street, zip, city)',
    ctaText: 'Main CTA button text',
  };

  var REQUIRED_FIELDS = ['clientName', 'primaryColor', 'ghlEmbed', 'offerHeadline'];
  var SERVICES = ['personal_training', 'small_group', 'online_coaching'];

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

  // ── Service-specific copy ───────────────────────────────────────────────────
  // The template ships as "small group". Each pack rewrites the small-group
  // defaults into the chosen service's wording. Small group applies nothing.
  var BASE = {
    subtext: 'Kies hieronder een moment dat jou uitkomt. Je traint samen in een kleine groep in onze studio in Beverwijk en ontvangt direct een bevestiging per mail.',
    coachPara: 'Bij <strong>PTF By Joep</strong> train je nooit anoniem. Omdat de groepen klein blijven, kent Joep jouw doelen, houdt hij je techniek scherp en past hij de oefeningen aan op jouw niveau. Of je nu net begint of al jaren traint — jij traint op jouw tempo, met begeleiding die je vooruit helpt.',
    testi1: '"Door de kleine groep krijg je echt persoonlijke begeleiding. Ik voel me fitter én sterker dan ooit."',
    testi2: '"De vaste momenten en de groep houden me op de been. Trainen is nu iets waar ik naar uitkijk."',
    faq2: 'Zeker. Elke oefening wordt aangepast op jouw niveau. Juist beginners halen veel uit de persoonlijke begeleiding in een kleine groep.',
    faq4a: 'We trainen bewust in kleine groepen, zodat er altijd persoonlijke aandacht is voor jouw techniek en doelen.',
    usp1: 'Kleine groepen, dus de coach ziet élke herhaling en stuurt direct bij.',
    usp3desc: 'Vaste trainingsmomenten en een stok achter de deur — zo blijf je gaan.',
    roadmap2desc: 'Ervaar direct hoe het is om te trainen in een kleine groep met persoonlijke aandacht.',
  };

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
      [BASE.roadmap2desc, 'Ervaar direct hoe het is om 1-op-1 te trainen met volledige aandacht.'],
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
      [BASE.subtext, 'Kies hieronder een moment voor je gratis kennismaking. We bespreken online jouw doelen en je ontvangt direct een bevestiging per mail.'],
      ['Trainen met resultaat, zonder sportschool-gevoel', 'Trainen met resultaat, waar en wanneer jij wilt'],
      ['Small-group training bij PTF By Joep in Beverwijk', 'Online coaching van PTF By Joep'],
      [BASE.usp1, 'Persoonlijke video-feedback, dus élke herhaling wordt gezien en direct bijgestuurd.'],
      ['Samen volhouden', 'Structuur &amp; voortgang'],
      [BASE.usp3desc, 'Een vast schema en check-ins die je scherp houden — zo blijf je gaan.'],
      [BASE.roadmap2desc, 'Ervaar direct hoe online coaching werkt, met persoonlijke aandacht.'],
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
      // Studio/location section reworded for online (layout kept)
      ['De studio', 'Hoe het werkt'],
      ['Onze studio in Beverwijk', 'Train waar en wanneer jij wilt'],
      ['Gratis parkeren voor de deur en makkelijk bereikbaar vanuit heel de IJmond.', 'Volg je persoonlijke programma thuis, in de sportschool of onderweg — jij bepaalt.'],
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
  function firstNameOf(coachName) {
    // "Mara · Oprichter & Coach" -> "Mara"; "John Smith - Coach" -> "John"
    var head = String(coachName).split(/[·\-–—,|]/)[0].trim();
    var tok = head.split(/\s+/)[0];
    return tok || '';
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
      ['#3F4633', oliveDark],
      ['#525A43', olive],
      ['#5E6750', oliveSoft],
      ['#47503A', oliveDarker],
      ['#EDEFE8', oliveLight],
      ['#FAFAF7', cream],
      ['#6d7a54', dot],
      ['#cdd6b8', urgencyDot],
    ];
    hexMap.forEach(function (m) { html = replaceAllCI(html, m[0], m[1]); });

    var rgbMap = [
      ['109,122,84', rgbTriplet(dot)],
      ['82,90,67', rgbTriplet(olive)],
      ['63,70,51', rgbTriplet(oliveDark)],
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
    var pack = SERVICE_COPY[service] || [];
    pack.forEach(function (pair) { html = replaceAll(html, pair[0], pair[1]); });
    return html;
  }

  // Online coaching has no physical studio: drop the map card, the address line,
  // and the footer address when no address was given (the section keeps its
  // reworded intro text).
  function stripPhysicalBlocks(html) {
    html = html.replace(/\s*<div class="ptf-map-card ptf-reveal">[\s\S]*?<\/div>/, '');
    html = html.replace(/\s*<p class="ptf-address">[\s\S]*?<\/p>/, '');
    html = replaceAll(html, '<br>Zuiderkade 3, 1948 NG Beverwijk', '');
    return html;
  }

  function buildLandingPage(data) {
    data = data || {};
    var html = window.PTF_TEMPLATE;
    function val(k) { return data[k] == null ? '' : String(data[k]).trim(); }

    var service = SERVICES.indexOf(data.service) >= 0 ? data.service : 'small_group';
    var address = val('address');
    var clientName = val('clientName');

    // 1. Colors
    var primary = normalizeHex(val('primaryColor'));
    if (primary) html = colorize(html, primary);

    // 2. Hero subtext (user text wins; else the service default applies below)
    if (val('offerSubtext')) html = replaceAll(html, BASE.subtext, escapeHtml(val('offerSubtext')));

    // 3. Service copy pack (rewrites remaining small-group defaults)
    html = applyServicePack(html, service);

    // 4. Online with no address → remove map + address blocks
    if (service === 'online_coaching' && !address) html = stripPhysicalBlocks(html);

    // 5. Booking planner
    var embed = parseEmbed(val('ghlEmbed'));
    var ORIG_URL = 'https://api.leadconnectorhq.com/widget/booking/lhumA8v6bLvnQ7v25jYY';
    var ORIG_HERO_ID = 'lhumA8v6bLvnQ7v25jYY_1784898793215';
    var ORIG_POPUP_ID = 'lhumA8v6bLvnQ7v25jYY_popup';
    if (embed.src) html = replaceAll(html, ORIG_URL, escapeAttr(embed.src));
    if (embed.id) {
      html = replaceAll(html, ORIG_POPUP_ID, escapeAttr(embed.id + '_popup'));
      html = replaceAll(html, ORIG_HERO_ID, escapeAttr(embed.id));
    }

    // 6. Map
    var ORIG_MAP = 'https://www.google.com/maps?q=PTF%20by%20Joep%2C%20Zuiderkade%203%2C%201948%20NG%20Beverwijk&z=15&output=embed';
    if (address || clientName) {
      var query = [clientName, address].filter(Boolean).join(', ');
      var newMap = 'https://www.google.com/maps?q=' + encodeURIComponent(query) + '&z=15&output=embed';
      html = replaceAll(html, ORIG_MAP, newMap);
    }

    // 7. Media
    if (val('logoUrl')) html = replaceAll(html, 'https://www.ptf-by-joep.nl/wp-content/uploads/2024/01/PTF-by-Joep-Logo-150x150.png', escapeAttr(val('logoUrl')));
    if (val('photo1Url')) html = replaceAll(html, 'https://assets.cdn.filesafe.space/9fhovZYk1lVT2zNK01rv/media/69bd39a90e1bdb83c17a64fc.png', escapeAttr(val('photo1Url')));
    if (val('photo2Url')) html = replaceAll(html, 'https://assets.cdn.filesafe.space/9fhovZYk1lVT2zNK01rv/media/69bd3dd68944bb8666d93138.png', escapeAttr(val('photo2Url')));

    // 8. Headline
    if (val('offerHeadline')) html = html.replace(/<h1>[\s\S]*?<\/h1>/, '<h1>' + escapeHtml(val('offerHeadline')) + '</h1>');

    // 9. Funnel step
    var funnel = val('funnelStep');
    var EYEBROW = '<span class="ptf-eyebrow">Stap 2 · Kies je trainingsmoment</span>';
    if (funnel && funnel.toLowerCase() !== 'skip') {
      html = replaceAll(html, EYEBROW, '<span class="ptf-eyebrow">' + escapeHtml(funnel) + '</span>');
    } else if (funnel.toLowerCase() === 'skip') {
      html = replaceAll(html, EYEBROW + '\n      ', '');
      html = replaceAll(html, EYEBROW, '');
    }

    // 10. Coach tag
    if (val('coachName')) html = replaceAll(html, 'Joep · Oprichter &amp; Coach', escapeHtml(val('coachName')));

    // 11. CTA
    if (val('ctaText')) html = replaceAll(html, 'Plan je gratis proefperiode', escapeHtml(val('ctaText')));

    // 12. Roadmap step titles (descriptions come from the service pack)
    ['Intake', 'Proefles', '2 Weken gratis &amp; vrijblijvend uitproberen', 'Exclusieve korting bij aanmelden'].forEach(function (orig, i) {
      var step = val('roadmap' + (i + 1));
      if (step) html = replaceAll(html, '<h3>' + orig + '</h3>', '<h3>' + escapeHtml(step) + '</h3>');
    });

    // 13. Address literal
    if (address) html = replaceAll(html, 'Zuiderkade 3, 1948 NG Beverwijk', escapeHtml(address));

    // 14. Client name (must run before the coach first-name pass so it doesn't
    //     see the "Joep" inside "PTF By Joep")
    if (clientName) html = replaceAll(html, 'PTF By Joep', escapeHtml(clientName));

    // 15. Coach first name in headings/paragraph (derived from the coach field)
    if (val('coachName')) {
      var fn = firstNameOf(val('coachName'));
      if (fn) html = replaceAll(html, 'Joep', escapeHtml(fn));
    }

    return html;
  }

  window.LPGEN = { buildLandingPage: buildLandingPage, validate: validate };
})();

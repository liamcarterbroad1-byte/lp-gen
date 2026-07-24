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

  function buildLandingPage(data) {
    data = data || {};
    var html = window.PTF_TEMPLATE;
    function val(k) { return data[k] == null ? '' : String(data[k]).trim(); }

    // 1. Colors
    var primary = normalizeHex(val('primaryColor'));
    if (primary) html = colorize(html, primary);

    // 2. Booking planner
    var embed = parseEmbed(val('ghlEmbed'));
    var ORIG_URL = 'https://api.leadconnectorhq.com/widget/booking/lhumA8v6bLvnQ7v25jYY';
    var ORIG_HERO_ID = 'lhumA8v6bLvnQ7v25jYY_1784898793215';
    var ORIG_POPUP_ID = 'lhumA8v6bLvnQ7v25jYY_popup';
    if (embed.src) html = replaceAll(html, ORIG_URL, escapeAttr(embed.src));
    if (embed.id) {
      html = replaceAll(html, ORIG_POPUP_ID, escapeAttr(embed.id + '_popup'));
      html = replaceAll(html, ORIG_HERO_ID, escapeAttr(embed.id));
    }

    // 3. Map
    var address = val('address');
    var clientName = val('clientName');
    var ORIG_MAP = 'https://www.google.com/maps?q=PTF%20by%20Joep%2C%20Zuiderkade%203%2C%201948%20NG%20Beverwijk&z=15&output=embed';
    if (address || clientName) {
      var query = [clientName, address].filter(Boolean).join(', ');
      var newMap = 'https://www.google.com/maps?q=' + encodeURIComponent(query) + '&z=15&output=embed';
      html = replaceAll(html, ORIG_MAP, newMap);
    }

    // 4. Media
    if (val('logoUrl')) html = replaceAll(html, 'https://www.ptf-by-joep.nl/wp-content/uploads/2024/01/PTF-by-Joep-Logo-150x150.png', escapeAttr(val('logoUrl')));
    if (val('photo1Url')) html = replaceAll(html, 'https://assets.cdn.filesafe.space/9fhovZYk1lVT2zNK01rv/media/69bd39a90e1bdb83c17a64fc.png', escapeAttr(val('photo1Url')));
    if (val('photo2Url')) html = replaceAll(html, 'https://assets.cdn.filesafe.space/9fhovZYk1lVT2zNK01rv/media/69bd3dd68944bb8666d93138.png', escapeAttr(val('photo2Url')));

    // 5. Headline
    if (val('offerHeadline')) html = html.replace(/<h1>[\s\S]*?<\/h1>/, '<h1>' + escapeHtml(val('offerHeadline')) + '</h1>');

    // 6. Subtext
    if (val('offerSubtext')) {
      html = replaceAll(html, 'Kies hieronder een moment dat jou uitkomt. Je traint samen in een kleine groep in onze studio in Beverwijk en ontvangt direct een bevestiging per mail.', escapeHtml(val('offerSubtext')));
    }

    // 7. Funnel step
    var funnel = val('funnelStep');
    var EYEBROW = '<span class="ptf-eyebrow">Stap 2 · Kies je trainingsmoment</span>';
    if (funnel && funnel.toLowerCase() !== 'skip') {
      html = replaceAll(html, EYEBROW, '<span class="ptf-eyebrow">' + escapeHtml(funnel) + '</span>');
    } else if (funnel.toLowerCase() === 'skip') {
      html = replaceAll(html, EYEBROW + '\n      ', '');
      html = replaceAll(html, EYEBROW, '');
    }

    // 8. Coach tag
    if (val('coachName')) html = replaceAll(html, 'Joep · Oprichter &amp; Coach', escapeHtml(val('coachName')));

    // 9. CTA
    if (val('ctaText')) html = replaceAll(html, 'Plan je gratis proefperiode', escapeHtml(val('ctaText')));

    // 10. Roadmap titles
    var roadmapTitles = ['Intake', 'Proefles', '2 Weken gratis &amp; vrijblijvend uitproberen', 'Exclusieve korting bij aanmelden'];
    roadmapTitles.forEach(function (orig, i) {
      var step = val('roadmap' + (i + 1));
      if (step) html = replaceAll(html, '<h3>' + orig + '</h3>', '<h3>' + escapeHtml(step) + '</h3>');
    });

    // 11. Address
    if (address) html = replaceAll(html, 'Zuiderkade 3, 1948 NG Beverwijk', escapeHtml(address));

    // 12. Client name
    if (clientName) html = replaceAll(html, 'PTF By Joep', escapeHtml(clientName));

    return html;
  }

  window.LPGEN = { buildLandingPage: buildLandingPage, validate: validate };
})();

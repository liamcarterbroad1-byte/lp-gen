const $ = (sel) => document.querySelector(sel);

const form = $('#briefForm');

// ── Color picker sync ──
const colorText = $('#primaryColor');
const colorPick = $('#primaryColorPick');
colorPick.addEventListener('input', () => { colorText.value = colorPick.value; schedulePreview(); });
colorText.addEventListener('input', () => {
  if (/^#[0-9a-fA-F]{6}$/.test(colorText.value.trim())) colorPick.value = colorText.value.trim();
});

// ── Two-coach fields toggle ──
const twoCoaches = $('#twoCoaches');
function syncTwoCoaches() { document.body.classList.toggle('show-two-coach', twoCoaches.checked); }
twoCoaches.addEventListener('change', syncTwoCoaches);
syncTwoCoaches();

// ── Advanced / detailed editor state ──
// color[section] = { theme?, bg?, text? } — each an optional hex override.
// reviews.mode: 'quote' (standard) | 'pictures' | 'videos'; each mode keeps
// its own list of URLs so switching back and forth doesn't lose them.
const advanced = { off: {}, color: {}, text: {}, reviews: { mode: 'quote', pictures: [], videos: [] } };

let uiLang = 'nl'; // 'nl' | 'en' — page output language

function baseData() {
  const data = {};
  new FormData(form).forEach((value, name) => { data[name] = value; });
  data.language = uiLang;
  return data;
}
function collectForm() {
  const data = baseData();
  data.advanced = advanced;
  return data;
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

// ── Live preview ─────────────────────────────────────────────────────────────
const livePreview = $('#livePreview');
const previewEmpty = $('#previewEmpty');
let lastCode = '';
let previewTimer = null;

function buildOrNull() {
  const data = collectForm();
  const missing = window.LPGEN.validate(data);
  if (missing.length) return { code: null, missing };
  try { return { code: window.LPGEN.buildLandingPage(data), missing: [] }; }
  catch (err) { return { code: null, missing: [(err && err.message) || 'Something went wrong'] }; }
}

function renderPreview() {
  const { code, missing } = buildOrNull();
  if (code == null) {
    livePreview.srcdoc = '';
    previewEmpty.textContent = 'Fill in the required fields (' + missing.join(', ') + ') to see your page here.';
    previewEmpty.hidden = false;
    return;
  }
  lastCode = code;
  // srcdoc inherits the parent origin (works from file:// or http). Pass the
  // fragment directly with a viewport meta — the parser hoists <link>/<style>
  // into <head> and renders the body.
  livePreview.srcdoc = '<meta name="viewport" content="width=device-width, initial-scale=1">' + code;
  previewEmpty.hidden = true;
  // Keep the code view in sync if it's open.
  if (!codeView.hidden) $('#outputCode').textContent = code;
}

function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 220);
}

// Any edit in the quick form updates the preview; service/offer/guarantee also
// change the standard copy, so drop text overrides and re-render the editor.
['input', 'change'].forEach((ev) => form.addEventListener(ev, (e) => {
  if (e.target && e.target.name && ['service', 'offer', 'guarantee'].includes(e.target.name)) {
    advanced.text = {};
    if (!advPanel.hidden) renderEditor();
  }
  schedulePreview();
}));

// ── Mode slide toggle (Quick ⇄ Advanced) ─────────────────────────────────────
const modeToggle = $('#modeToggle');
const advPanel = $('#advPanel');
let editorBuilt = false;

modeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  const mode = btn.dataset.mode;
  modeToggle.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
  modeToggle.classList.toggle('is-advanced', mode === 'advanced');
  if (mode === 'advanced') {
    renderEditor();
    form.hidden = true;
    advPanel.hidden = false;
  } else {
    advPanel.hidden = true;
    form.hidden = false;
  }
});

// ── Page language toggle (Dutch ⇄ English) ───────────────────────────────────
const langToggle = $('#langToggle');
langToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  uiLang = btn.dataset.lang === 'en' ? 'en' : 'nl';
  langToggle.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
  langToggle.classList.toggle('is-en', uiLang === 'en');
  // Standard copy changes with the language, so drop text overrides keyed to the
  // old language and rebuild the advanced editor if it's open.
  advanced.text = {};
  if (!advPanel.hidden) renderEditor();
  schedulePreview();
});

// ── Advanced editor rendering ────────────────────────────────────────────────
const advSections = $('#advSections');
const COLOR_DEFAULT = { theme: '#525a43', bg: '#ffffff', text: '#141511' };

function setColor(key, prop, val) {
  advanced.color[key] = advanced.color[key] || {};
  advanced.color[key][prop] = val;
}
function clearColor(key, prop) {
  if (!advanced.color[key]) return;
  delete advanced.color[key][prop];
  if (!Object.keys(advanced.color[key]).length) delete advanced.color[key];
}

function colorControl(key, prop, label) {
  const wrap = el('label', 'adv-color');
  wrap.appendChild(el('span', null, label));
  const inp = document.createElement('input');
  inp.type = 'color';
  const cur = advanced.color[key] && advanced.color[key][prop];
  inp.value = cur || (prop === 'theme' ? (colorText.value.trim() || COLOR_DEFAULT.theme) : COLOR_DEFAULT[prop]);
  inp.addEventListener('input', () => { setColor(key, prop, inp.value); schedulePreview(); });
  const reset = el('button', 'adv-reset', '×');
  reset.type = 'button'; reset.title = 'Reset ' + label.toLowerCase();
  reset.addEventListener('click', () => {
    clearColor(key, prop);
    inp.value = prop === 'theme' ? (colorText.value.trim() || COLOR_DEFAULT.theme) : COLOR_DEFAULT[prop];
    schedulePreview();
  });
  wrap.appendChild(inp);
  wrap.appendChild(reset);
  return wrap;
}

function renderEditor() {
  let structure;
  try { structure = window.LPGEN.describeEditor(baseData()); }
  catch (e) { structure = []; }
  advSections.innerHTML = '';
  if (!structure.length) {
    advSections.appendChild(el('p', 'note', 'Editor unavailable in this browser.'));
    return;
  }

  structure.forEach((sec) => {
    const card = el('div', 'adv-sec');
    const head = el('div', 'adv-sec-head');
    head.appendChild(el('strong', null, sec.label));

    const ctrls = el('div', 'adv-sec-ctrls');
    if (sec.toggle) {
      const lbl = el('label', 'check');
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = !advanced.off[sec.key];
      cb.addEventListener('change', () => { advanced.off[sec.key] = !cb.checked; schedulePreview(); });
      lbl.appendChild(cb); lbl.appendChild(document.createTextNode(' Show'));
      ctrls.appendChild(lbl);
    }
    if (sec.bg) {
      const colors = el('div', 'adv-colors');
      colors.appendChild(colorControl(sec.key, 'theme', 'Theme'));
      colors.appendChild(colorControl(sec.key, 'bg', 'Bg'));
      colors.appendChild(colorControl(sec.key, 'text', 'Text'));
      ctrls.appendChild(colors);
    }
    head.appendChild(ctrls);
    card.appendChild(head);

    const fields = el('div', 'adv-fields');
    sec.fields.forEach((f) => {
      const row = el('label', 'adv-field');
      row.appendChild(el('span', null, f.label));
      const long = f.value.length > 60;
      const input = document.createElement(long ? 'textarea' : 'input');
      if (long) input.rows = 2;
      input.value = advanced.text[f.id] != null ? advanced.text[f.id] : f.value;
      input.addEventListener('input', () => {
        if (input.value === f.value) delete advanced.text[f.id];
        else advanced.text[f.id] = input.value;
        schedulePreview();
      });
      row.appendChild(input);
      fields.appendChild(row);
    });

    card.appendChild(fields);
    advSections.appendChild(card);
  });
  editorBuilt = true;
}

// ── Reviews: Quotes / Pictures / Videos (quick editor) ───────────────────────
const reviewMode = $('#reviewMode');
const reviewMedia = $('#reviewMedia');
const REVIEW_HINT = {
  pictures: 'Add one image URL per review (jpg, png, webp). Portrait images work best.',
  videos: 'Add one video URL per review — YouTube, Vimeo or a direct .mp4.',
};
const REVIEW_PLACEHOLDER = {
  pictures: 'https://…/review.jpg',
  videos: 'YouTube, Vimeo or .mp4 URL',
};

function mediaListEditor(kind) {
  // kind: 'pictures' | 'videos' — edits advanced.reviews[kind] in place.
  const items = advanced.reviews[kind];
  const box = el('div', 'adv-video');
  box.appendChild(el('p', 'vrev-hint', REVIEW_HINT[kind]));
  const list = el('div', 'vrev-list');
  const add = el('button', 'vrev-add', '+ Add a review');
  add.type = 'button';

  function renumber() {
    list.querySelectorAll('.vrev-row').forEach((row, i) => { row.querySelector('.vrev-num').textContent = (i + 1); });
  }
  function addRow(value) {
    const row = el('div', 'vrev-row');
    row.appendChild(el('span', 'vrev-num', ''));
    const inp = document.createElement('input');
    inp.type = 'url'; inp.placeholder = REVIEW_PLACEHOLDER[kind];
    inp.value = value || '';
    inp.addEventListener('input', () => {
      const pos = Array.prototype.indexOf.call(list.children, row);
      items[pos] = inp.value.trim();
      schedulePreview();
    });
    const del = el('button', 'vrev-del', '×');
    del.type = 'button'; del.title = 'Remove review';
    del.addEventListener('click', () => {
      const pos = Array.prototype.indexOf.call(list.children, row);
      items.splice(pos, 1);
      row.remove();
      renumber();
      schedulePreview();
    });
    row.appendChild(inp); row.appendChild(del);
    list.appendChild(row);
    renumber();
  }

  items.forEach((u) => addRow(u));
  if (!items.length) { addRow(''); items.push(''); }

  add.addEventListener('click', () => { items.push(''); addRow(''); schedulePreview(); });
  box.appendChild(list);
  box.appendChild(add);
  return box;
}

function renderReviewMedia() {
  reviewMedia.innerHTML = '';
  const mode = advanced.reviews.mode;
  if (mode === 'pictures' || mode === 'videos') {
    reviewMedia.appendChild(mediaListEditor(mode));
  }
}

reviewMode.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  const mode = btn.dataset.rmode;
  advanced.reviews.mode = mode;
  reviewMode.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
  reviewMode.classList.remove('rm-quote', 'rm-pictures', 'rm-videos');
  reviewMode.classList.add('rm-' + mode);
  renderReviewMedia();
  schedulePreview();
});

// ── Floating code island ⇄ code view ─────────────────────────────────────────
const codeIsland = $('#codeIsland');
const codeView = $('#codeView');
const outputCode = $('#outputCode');
const copyBtn = $('#copyBtn');
const downloadBtn = $('#downloadBtn');
const backBtn = $('#backBtn');

function flashIsland(msg) {
  const orig = codeIsland.innerHTML;
  codeIsland.textContent = msg;
  setTimeout(() => { codeIsland.innerHTML = orig; }, 1800);
}

codeIsland.addEventListener('click', () => {
  const { code, missing } = buildOrNull();
  if (code == null) { flashIsland('Fill: ' + missing.join(', ')); return; }
  lastCode = code;
  outputCode.textContent = code;
  codeView.hidden = false;
  codeIsland.hidden = true;
});
backBtn.addEventListener('click', () => {
  codeView.hidden = true;
  codeIsland.hidden = false;
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(lastCode);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  } catch (_) {
    copyBtn.textContent = 'Select manually';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800);
  }
});

downloadBtn.addEventListener('click', () => {
  const name = ($('#clientName').value.trim() || 'landing-page')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const blob = new Blob([lastCode], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name || 'landing-page'}.html`;
  a.click();
  URL.revokeObjectURL(url);
});

// ── Preview width toggle ──
const pvWidth = $('#pvWidth');
pvWidth.addEventListener('click', () => {
  const desktop = $('.preview-panel').classList.toggle('pv-desktop');
  pvWidth.textContent = desktop ? 'Mobile' : 'Desktop';
});

// Initial render.
renderReviewMedia();
renderPreview();

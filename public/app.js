const $ = (sel) => document.querySelector(sel);

const form = $('#briefForm');
const outputCode = $('#outputCode');
const statusEl = $('#status');
const generateBtn = $('#generateBtn');
const copyBtn = $('#copyBtn');
const downloadBtn = $('#downloadBtn');

// ── Color picker sync ──
const colorText = $('#primaryColor');
const colorPick = $('#primaryColorPick');
colorPick.addEventListener('input', () => { colorText.value = colorPick.value; });
colorText.addEventListener('input', () => {
  if (/^#[0-9a-fA-F]{6}$/.test(colorText.value.trim())) colorPick.value = colorText.value.trim();
});

// ── Two-coach fields toggle ──
const twoCoaches = $('#twoCoaches');
function syncTwoCoaches() { document.body.classList.toggle('show-two-coach', twoCoaches.checked); }
twoCoaches.addEventListener('change', syncTwoCoaches);
syncTwoCoaches();

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ' ' + kind : '');
}

// ── Advanced / detailed editor state ──
const advanced = { off: {}, bg: {}, text: {}, video: { enabled: false, items: [] } };

function baseData() {
  const data = {};
  new FormData(form).forEach((value, name) => { data[name] = value; });
  return data;
}

function collectForm() {
  const data = baseData();
  data.advanced = advanced;
  return data;
}

let lastCode = '';

function updateOutputButtons() {
  const has = lastCode.trim().length > 0;
  copyBtn.disabled = !has;
  downloadBtn.disabled = !has;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const data = collectForm();
  const missing = window.LPGEN.validate(data);
  if (missing.length) {
    setStatus('Please fix: ' + missing.join(', ') + '.', 'error');
    return;
  }

  try {
    // Everything runs in the browser — no server, no network call.
    lastCode = window.LPGEN.buildLandingPage(data);
    outputCode.classList.remove('placeholder');
    outputCode.textContent = lastCode;
    $('#output').scrollTop = 0;
    updateOutputButtons();
    setStatus('Done. Copy into a GoHighLevel Custom Code element.', '');
  } catch (err) {
    setStatus((err && err.message) || 'Something went wrong.', 'error');
  }
});

// ── Output actions ──
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(lastCode);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  } catch (_) {
    setStatus('Copy failed — select the code manually.', 'error');
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

// ── Detailed editor ─────────────────────────────────────────────────────────
const advPanel = $('#advPanel');
const advSections = $('#advSections');
const detailBtn = $('#detailBtn');

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderEditor() {
  let structure;
  try { structure = window.LPGEN.describeEditor(baseData()); }
  catch (e) { structure = []; }
  advSections.innerHTML = '';
  if (!structure.length) {
    advSections.appendChild(el('p', 'note', 'Preview unavailable in this browser.'));
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
      cb.addEventListener('change', () => { advanced.off[sec.key] = !cb.checked; });
      lbl.appendChild(cb); lbl.appendChild(document.createTextNode(' Show'));
      ctrls.appendChild(lbl);
    }
    if (sec.bg) {
      const wrap = el('label', 'adv-bg');
      wrap.appendChild(document.createTextNode('Bg'));
      const col = document.createElement('input');
      col.type = 'color'; col.value = advanced.bg[sec.key] || '#ffffff';
      col.addEventListener('input', () => { advanced.bg[sec.key] = col.value; });
      const reset = el('button', 'adv-reset', '×'); reset.type = 'button'; reset.title = 'Reset background';
      reset.addEventListener('click', () => { delete advanced.bg[sec.key]; col.value = '#ffffff'; });
      wrap.appendChild(col); wrap.appendChild(reset);
      ctrls.appendChild(wrap);
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
      });
      row.appendChild(input);
      fields.appendChild(row);

      // Video-review carousel controls live under the Reviews section.
      if (sec.key === 'testimonials' && f === sec.fields[sec.fields.length - 1]) {
        const vBox = el('div', 'adv-video');
        const vLbl = el('label', 'check');
        const vCb = document.createElement('input');
        vCb.type = 'checkbox'; vCb.checked = advanced.video.enabled;
        vCb.addEventListener('change', () => { advanced.video.enabled = vCb.checked; });
        vLbl.appendChild(vCb); vLbl.appendChild(document.createTextNode(' Use a video review carousel instead'));
        vBox.appendChild(vLbl);
        const ta = document.createElement('textarea');
        ta.rows = 3; ta.placeholder = 'One video URL per line — YouTube, Vimeo, or a direct .mp4';
        ta.value = advanced.video.items.join('\n');
        ta.addEventListener('input', () => {
          advanced.video.items = ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
        });
        vBox.appendChild(ta);
        fields.appendChild(vBox);
      }
    });
    card.appendChild(fields);
    advSections.appendChild(card);
  });
}

detailBtn.addEventListener('click', () => {
  const open = advPanel.hasAttribute('hidden');
  if (open) { renderEditor(); advPanel.removeAttribute('hidden'); detailBtn.textContent = 'Hide editor'; }
  else { advPanel.setAttribute('hidden', ''); detailBtn.textContent = 'Detailed editor'; }
});

// Changing the service/offer changes the standard copy → re-render the open
// editor and drop text overrides that were keyed to the old copy.
['change', 'input'].forEach((ev) => form.addEventListener(ev, (e) => {
  if (!e.target || !e.target.name) return;
  if (['service', 'offer', 'guarantee'].includes(e.target.name)) {
    advanced.text = {};
    if (!advPanel.hasAttribute('hidden')) renderEditor();
  }
}));

// ── Live preview ────────────────────────────────────────────────────────────
const previewModal = $('#previewModal');
const pvFrame = $('#pvFrame');
const pvWidth = $('#pvWidth');

function buildOrNull() {
  const data = collectForm();
  const missing = window.LPGEN.validate(data);
  if (missing.length) { setStatus('Please fix: ' + missing.join(', ') + '.', 'error'); return null; }
  return window.LPGEN.buildLandingPage(data);
}

function closePreview() {
  previewModal.setAttribute('hidden', '');
  pvFrame.srcdoc = '';
}
$('#previewBtn').addEventListener('click', () => {
  const html = buildOrNull();
  if (html == null) return;
  // srcdoc inherits the parent origin, so this works whether the dashboard is
  // opened as a local file or served over http. Pass the fragment directly —
  // the parser builds a full document and hoists the <link>/<style> to <head>.
  pvFrame.srcdoc = '<meta name="viewport" content="width=device-width, initial-scale=1">' + html;
  previewModal.removeAttribute('hidden');
});
$('#pvClose').addEventListener('click', closePreview);
previewModal.addEventListener('click', (e) => { if (e.target === previewModal) closePreview(); });
pvWidth.addEventListener('click', () => {
  const desktop = previewModal.classList.toggle('pv-desktop');
  pvWidth.textContent = desktop ? 'Mobile' : 'Desktop';
});

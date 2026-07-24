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

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ' ' + kind : '');
}

function collectForm() {
  const data = {};
  new FormData(form).forEach((value, name) => { data[name] = value; });
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

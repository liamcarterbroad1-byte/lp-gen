const $ = (sel) => document.querySelector(sel);

const form = $('#briefForm');
const apiKeyInput = $('#apiKey');
const outputCode = $('#outputCode');
const statusEl = $('#status');
const generateBtn = $('#generateBtn');
const copyBtn = $('#copyBtn');
const downloadBtn = $('#downloadBtn');

const KEY_STORE = 'lpgen.apiKey';

// ── API key persistence (browser only) ──
apiKeyInput.value = localStorage.getItem(KEY_STORE) || '';
apiKeyInput.addEventListener('input', () => {
  localStorage.setItem(KEY_STORE, apiKeyInput.value.trim());
});
$('#toggleKey').addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

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
  data.apiKey = apiKeyInput.value.trim();
  return data;
}

let lastCode = '';

function updateOutputButtons() {
  const has = lastCode.trim().length > 0;
  copyBtn.disabled = !has;
  downloadBtn.disabled = !has;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = collectForm();
  if (!data.apiKey) {
    setStatus('Paste your Claude API key first (top right).', 'error');
    apiKeyInput.focus();
    return;
  }

  generateBtn.disabled = true;
  setStatus('Your Claude is writing the page', 'busy');
  outputCode.classList.remove('placeholder');
  outputCode.textContent = '';
  lastCode = '';
  updateOutputButtons();

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let msg = `Request failed (${res.status}).`;
      try { const j = await res.json(); if (j.error) msg = j.error; } catch (_) {}
      throw new Error(msg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      lastCode += decoder.decode(value, { stream: true });
      outputCode.textContent = lastCode;
      $('#output').scrollTop = $('#output').scrollHeight;
    }

    updateOutputButtons();
    setStatus('Done. Copy the code into a GoHighLevel Custom Code element.', '');
  } catch (err) {
    setStatus(err.message || 'Something went wrong.', 'error');
    if (!lastCode) {
      outputCode.classList.add('placeholder');
      outputCode.textContent = 'Fill in the brief and hit Generate. Your Claude will write the page here, live.';
    }
  } finally {
    generateBtn.disabled = false;
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

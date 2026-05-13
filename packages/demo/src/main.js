import './style.css';
import { TEMPLATES } from './templates.js';
import { callGenerateAPI } from './api.js';

// ── DOM Refs ──────────────────────────────────────────────
const form        = document.getElementById('generator-form');
const generateBtn = document.getElementById('generate-btn');
const btnLabel    = document.getElementById('btn-label');
const btnSpinner  = document.getElementById('btn-spinner');
const btnIcon     = generateBtn.querySelector('.btn-icon');

const emptyState   = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const errorState   = document.getElementById('error-state');
const resultState  = document.getElementById('result-state');

const steps = [1,2,3,4].map(n => document.getElementById(`step-${n}`));
const tokenInput = document.getElementById('api-token');
const tokenHint = document.getElementById('api-token-hint');
const tokenRequired = document.getElementById('api-token-required');

tokenHint.textContent = 'Optional: the demo can use your workspace .env token through the local proxy if you leave this blank.';
tokenRequired.classList.add('hidden');
tokenInput.placeholder = 'Optional - the local proxy can use your .env token';

// ── Loading Step Animator ─────────────────────────────────
let stepTimer = null;
function animateSteps() {
  let current = 0;
  steps.forEach(s => { s.classList.remove('active','done'); });
  steps[0].classList.add('active');
  stepTimer = setInterval(() => {
    if (current < steps.length - 1) {
      steps[current].classList.remove('active');
      steps[current].classList.add('done');
      current++;
      steps[current].classList.add('active');
    }
  }, 1800);
}
function stopSteps() {
  clearInterval(stepTimer);
  steps.forEach(s => s.classList.remove('active','done'));
}

// ── State Machine ─────────────────────────────────────────
function showState(name) {
  emptyState.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  resultState.classList.add('hidden');
  if (name === 'empty')   emptyState.classList.remove('hidden');
  if (name === 'loading') { loadingState.classList.remove('hidden'); animateSteps(); }
  if (name === 'error')   errorState.classList.remove('hidden');
  if (name === 'result')  resultState.classList.remove('hidden');
}

// ── KV Row Helper ─────────────────────────────────────────
function addKvRow(containerId) {
  const container = document.getElementById(containerId);
  const row = document.createElement('div');
  row.className = 'kv-row';
  row.innerHTML = `
    <input type="text" class="kv-key field-input" placeholder="key" />
    <input type="text" class="kv-value field-input" placeholder="value" />
    <button type="button" class="kv-remove" title="Remove">×</button>
  `;
  row.querySelector('.kv-remove').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function getKvData(containerId) {
  const rows = document.querySelectorAll(`#${containerId} .kv-row`);
  const obj = {};
  rows.forEach(row => {
    const k = row.querySelector('.kv-key').value.trim();
    const v = row.querySelector('.kv-value').value.trim();
    if (k && v) obj[k] = v;
  });
  return obj;
}

function setKvData(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const entries = Object.entries(data);
  if (entries.length === 0) entries.push(['','']);
  entries.forEach(([k, v]) => {
    const row = document.createElement('div');
    row.className = 'kv-row';
    row.innerHTML = `
      <input type="text" class="kv-key field-input" value="${k}" placeholder="key" />
      <input type="text" class="kv-value field-input" value="${v}" placeholder="value" />
      <button type="button" class="kv-remove" title="Remove">×</button>
    `;
    row.querySelector('.kv-remove').addEventListener('click', () => row.remove());
    container.appendChild(row);
  });
}

// ── Apply Template ────────────────────────────────────────
function applyTemplate(name) {
  const t = TEMPLATES[name];
  if (!t) return;
  document.getElementById('category').value   = t.category || '';
  document.getElementById('brand').value      = t.brand || '';
  document.getElementById('tone').value       = t.tone || 'professional';
  document.getElementById('features').value  = (t.features || []).join('\n');
  setKvData('attributes-container', t.attributes || {});
  setKvData('specs-container', t.specifications || {});
}

// ── Render Result ─────────────────────────────────────────
function renderResult(data) {
  document.getElementById('title-text').textContent       = data.title || '';
  document.getElementById('description-text').textContent = data.description || '';
  document.getElementById('meta-text').textContent        = data.metaDescription || '';

  document.getElementById('title-chars').textContent = `${(data.title||'').length} chars`;
  document.getElementById('desc-chars').textContent  = `${(data.description||'').length} chars`;
  document.getElementById('meta-chars').textContent  = `${(data.metaDescription||'').length} chars`;

  // Keywords
  const kwContainer = document.getElementById('keywords-container');
  kwContainer.innerHTML = (data.keywords || [])
    .map(kw => `<span class="keyword-tag">${kw}</span>`)
    .join('');

  // Quality score
  const scoreEl = document.getElementById('quality-value');
  const score = data.qualityScore ?? 85;
  scoreEl.textContent = `${score}/100`;
  scoreEl.style.color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)';

  // Google preview
  const category = document.getElementById('category').value;
  document.getElementById('meta-preview').innerHTML = `
    <div class="meta-preview-title">${data.title || ''}</div>
    <div class="meta-preview-url">https://yourstore.com/${category.toLowerCase().replace(/\s+/g,'-')}/</div>
    <div class="meta-preview-desc">${data.metaDescription || ''}</div>
  `;
}

// ── Copy Utility ──────────────────────────────────────────
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1800);
  });
}

function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Form Submit ───────────────────────────────────────────
async function handleSubmit() {
  const token = document.getElementById('api-token').value.trim();
  const category = document.getElementById('category').value.trim();

  if (!category) { showToast('Category is required', 'error'); return; }

  const productData = {
    category,
    brand:          document.getElementById('brand').value.trim() || undefined,
    tone:           document.getElementById('tone').value,
    language:       document.getElementById('language').value,
    attributes:     getKvData('attributes-container'),
    specifications: getKvData('specs-container'),
    features:       document.getElementById('features').value
                      .split('\n').map(f => f.trim()).filter(Boolean),
  };

  const config = {
    hfApiToken:   token,
    maxNewTokens: parseInt(document.getElementById('max-tokens')?.value) || 2048,
    temperature:  parseFloat(document.getElementById('temperature').value) || 0.3,
  };

  // UI: loading
  generateBtn.disabled = true;
  btnLabel.textContent = 'Generating...';
  btnIcon.style.display = 'none';
  btnSpinner.classList.remove('hidden');
  showState('loading');

  try {
    const result = await callGenerateAPI(productData, config);
    stopSteps();
    renderResult(result);
    showState('result');
    showToast('Content generated successfully!');
  } catch (err) {
    stopSteps();
    document.getElementById('error-message').textContent = err.message;
    showState('error');
    showToast(err.message, 'error');
  } finally {
    generateBtn.disabled = false;
    btnLabel.textContent = 'Generate Content';
    btnIcon.style.display = '';
    btnSpinner.classList.add('hidden');
  }
}

// ── Event Listeners ───────────────────────────────────────
form.addEventListener('submit', e => { e.preventDefault(); handleSubmit(); });

document.getElementById('add-attribute').addEventListener('click', () => addKvRow('attributes-container'));
document.getElementById('add-spec').addEventListener('click',      () => addKvRow('specs-container'));

// Add remove handler to initial kv rows
document.querySelectorAll('.kv-remove').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.kv-row').remove());
});

// Template chips (both header chips and empty state chips)
document.querySelectorAll('[data-template]').forEach(el => {
  el.addEventListener('click', () => {
    applyTemplate(el.dataset.template);
    showToast(`Template loaded: ${el.dataset.template}`);
  });
});

// Toggle password visibility
document.getElementById('toggle-token').addEventListener('click', () => {
  const inp = document.getElementById('api-token');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

// Temperature display
document.getElementById('temperature').addEventListener('input', e => {
  document.getElementById('temp-val').textContent = e.target.value;
});

// Copy buttons on result cards
document.addEventListener('click', e => {
  if (!e.target.classList.contains('copy-btn')) return;
  const targetId = e.target.dataset.target;
  const el = document.getElementById(targetId);
  if (!el) return;
  const text = targetId === 'keywords-container'
    ? [...el.querySelectorAll('.keyword-tag')].map(t => t.textContent).join(', ')
    : el.textContent;
  copyText(text, e.target);
});

// Copy all
document.getElementById('copy-all-btn').addEventListener('click', () => {
  const title = document.getElementById('title-text').textContent;
  const desc  = document.getElementById('description-text').textContent;
  const kws   = [...document.querySelectorAll('.keyword-tag')].map(t => t.textContent).join(', ');
  const meta  = document.getElementById('meta-text').textContent;
  const all   = `TITLE:\n${title}\n\nDESCRIPTION:\n${desc}\n\nKEYWORDS:\n${kws}\n\nMETA:\n${meta}`;
  navigator.clipboard.writeText(all).then(() => showToast('All content copied!'));
});

// Retry / Regenerate
document.getElementById('error-retry').addEventListener('click', handleSubmit);
document.getElementById('regenerate-btn').addEventListener('click', handleSubmit);

// Code tabs
document.querySelectorAll('.code-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    ['install','usage','output'].forEach(name => {
      const block = document.getElementById(`code-${name}`);
      block.classList.toggle('hidden', name !== tab.dataset.tab);
    });
  });
});

// Code copy buttons
document.querySelectorAll('.code-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = document.getElementById(`code-${btn.dataset.code}-content`);
    if (el) navigator.clipboard.writeText(el.textContent).then(() => showToast('Code copied!'));
  });
});

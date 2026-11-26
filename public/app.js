const $ = (s) => document.querySelector(s);
const { t, errMsg } = i18n;
const grid = $('#grid'), more = $('#more'), empty = $('#empty'), errBox = $('#error');
let page = 0, loading = false, token = 0;
let status = null, loaded = [], lastErr = null;

const DIFF = { Easy: 'E', Normal: 'N', Hard: 'H', Expert: 'X', ExpertPlus: 'X+' };
const isReady = () => !!(status && status.ready);

function toast(msg, bad = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.className = ''), 3500);
}

function card(m) {
  const li = document.createElement('li');
  li.className = 'card';

  const img = document.createElement('img');
  img.alt = '';
  img.loading = 'lazy';
  img.src = m.cover;
  img.onerror = () => img.remove();

  const info = document.createElement('div');
  info.className = 'info';
  const title = document.createElement('h2');
  title.textContent = m.name;
  const sub = document.createElement('p');
  const byMapper = t('by_mapper', { mapper: m.mapper });
  sub.textContent = m.artist ? `${m.artist} · ${byMapper}` : byMapper;
  const meta = document.createElement('p');
  meta.className = 'meta';
  const mins = Math.floor(m.duration / 60), secs = String(Math.round(m.duration % 60)).padStart(2, '0');
  const parts = [`${mins}:${secs}`];
  if (m.score !== null) parts.push(t('positive', { n: Math.round(m.score * 100) }));
  meta.textContent = parts.join(' · ');
  const diffs = document.createElement('div');
  diffs.className = 'diffs';
  for (const d of m.diffs) {
    const s = document.createElement('span');
    s.className = 'd-' + d;
    s.textContent = DIFF[d] || d;
    s.title = d;
    diffs.append(s);
  }
  info.append(title, sub, meta, diffs);

  const btn = document.createElement('button');
  btn.className = 'req';
  btn.textContent = t('request');
  btn.disabled = !isReady();
  btn.addEventListener('click', () => request(m, btn));

  li.append(img, info, btn);
  return li;
}

async function request(m, btn) {
  btn.disabled = true;
  btn.textContent = t('sending');
  try {
    const r = await fetch('/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw j;
    btn.textContent = t('requested');
    btn.classList.add('done');
    toast(t('sent_toast', { name: m.name }));
    setTimeout(() => { btn.textContent = t('request'); btn.classList.remove('done'); btn.disabled = !isReady(); }, 15000);
  } catch (e) {
    btn.textContent = t('request');
    btn.disabled = false;
    toast(errMsg(e), true);
  }
}

function renderStatus() {
  $('#status').textContent = !status ? t('status_loading')
    : status.ready ? t('status_ready', { channel: status.channel }) : t('status_not_ready');
}
function renderError() {
  errBox.hidden = !lastErr;
  if (lastErr) errBox.textContent = errMsg(lastErr);
}

async function load(reset) {
  if (loading && !reset) return;
  loading = true;
  const mine = reset ? ++token : token;
  if (reset) { page = 0; loaded = []; grid.replaceChildren(); more.hidden = true; empty.hidden = true; }
  lastErr = null;
  renderError();
  more.disabled = true;
  try {
    const qs = new URLSearchParams({ q: $('#q').value, sort: $('#sort').value, page });
    const r = await fetch('/api/maps?' + qs);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw j;
    if (mine !== token) return;
    loaded.push(...j.docs);
    grid.append(...j.docs.map(card));
    page++;
    more.hidden = !j.hasMore;
    empty.hidden = loaded.length > 0;
  } catch (e) {
    lastErr = e && e.code ? e : { code: 'beatsaver_down' };
    renderError();
  } finally {
    loading = false;
    more.disabled = false;
  }
}

async function loadStatus() {
  status = await fetch('/api/status').then((r) => r.json()).catch(() => ({ ready: false }));
  renderStatus();
  document.querySelectorAll('.req:not(.done)').forEach((b) => (b.disabled = !isReady()));
}

// Sprachwechsel: nur UI-Texte neu zeichnen, Map-Daten bleiben unverändert
i18n.onChange(() => {
  renderStatus();
  renderError();
  grid.replaceChildren(...loaded.map(card));
});

let debounce;
$('#q').addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(() => load(true), 350); });
$('#sort').addEventListener('change', () => load(true));
more.addEventListener('click', () => load(false));

i18n.init().then(() => { renderStatus(); return loadStatus(); }).then(() => load(true));

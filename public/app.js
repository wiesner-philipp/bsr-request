const $ = (s) => document.querySelector(s);
const { t, errMsg } = i18n;
const grid = $('#grid'), more = $('#more'), empty = $('#empty'), errBox = $('#error');
let page = 0, loading = false, token = 0;
let status = null, loaded = [], lastErr = null;
let view = location.hash === '#history' ? 'history' : 'maps';
let es = null;
const keyOf = (m) => `${m.requestedAt}-${m.id}`;

const DIFF = { Easy: 'E', Normal: 'N', Hard: 'H', Expert: 'X', ExpertPlus: 'X+' };
const isReady = () => !!(status && status.ready);
const fmtTime = (ts) => new Date(ts).toLocaleString(i18n.lang === 'de' ? 'de-DE' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

function toast(msg, bad = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.className = ''), 3500);
}

let audio = null, playingEl = null;

function stopPreview() {
  if (audio) { audio.pause(); audio = null; }
  if (playingEl) { playingEl.classList.remove('playing'); playingEl.setAttribute('aria-pressed', 'false'); playingEl = null; }
}

function togglePreview(m, el) {
  const same = playingEl === el;
  stopPreview();
  if (same) return;
  const a = new Audio(m.preview);
  a.volume = 0.6;
  audio = a;
  playingEl = el;
  el.classList.add('playing');
  el.setAttribute('aria-pressed', 'true');
  const fail = () => { if (audio === a) { stopPreview(); toast(t('preview_failed'), true); } };
  a.addEventListener('ended', () => { if (audio === a) stopPreview(); });
  a.addEventListener('error', fail);
  a.play().catch(fail);
}

function card(m) {
  const li = document.createElement('li');
  li.className = 'card';

  const img = document.createElement('img');
  img.alt = '';
  img.loading = 'lazy';
  if (m.cover) img.src = m.cover;
  img.onerror = () => img.remove();

  const info = document.createElement('div');
  info.className = 'info';
  const title = document.createElement('h2');
  title.textContent = m.missing ? `#${m.id}` : m.name;
  const sub = document.createElement('p');
  const byMapper = t('by_mapper', { mapper: m.mapper });
  sub.textContent = m.missing ? t('no_details') : m.artist ? `${m.artist} · ${byMapper}` : byMapper;
  const meta = document.createElement('p');
  meta.className = 'meta';
  const mins = Math.floor(m.duration / 60), secs = String(Math.round(m.duration % 60)).padStart(2, '0');
  const parts = [`${mins}:${secs}`];
  if (m.score != null) parts.push(t('positive', { n: Math.round(m.score * 100) }));
  meta.textContent = m.missing ? '' : parts.join(' · ');
  const diffs = document.createElement('div');
  diffs.className = 'diffs';
  for (const d of m.diffs || []) {
    const s = document.createElement('span');
    s.className = 'd-' + d;
    s.textContent = DIFF[d] || d;
    s.title = d;
    diffs.append(s);
  }
  info.append(title, sub, meta);
  if (m.requestedAt) {
    const when = document.createElement('p');
    when.className = 'when';
    when.textContent = t('requested_at', { when: fmtTime(m.requestedAt) });
    info.append(when);
  }
  info.append(diffs);

  const btn = document.createElement('button');
  btn.className = 'req';
  btn.textContent = t('request');
  btn.disabled = !isReady();
  btn.addEventListener('click', () => request(m, btn));

  const cover = document.createElement(m.preview ? 'button' : 'div');
  cover.className = 'cover';
  if (m.preview) {
    cover.type = 'button';
    cover.setAttribute('aria-label', t('preview', { name: m.name }));
    cover.setAttribute('aria-pressed', 'false');
    cover.addEventListener('click', () => togglePreview(m, cover));
  }
  cover.append(img);

  li.append(cover, info, btn);
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
function renderEmpty() {
  empty.textContent = t(view === 'history' ? 'empty_history' : 'empty');
}
// Live-Verlauf: nur verbunden, solange der Verlauf-Tab offen ist
function syncLive() {
  if (view !== 'history') {
    if (es) { es.close(); es = null; }
    return;
  }
  if (es) return;
  let opened = false;
  es = new EventSource('/api/history/stream');
  // Nach einem Verbindungsabbruch könnten Events fehlen, daher neu laden
  es.onopen = () => { if (opened) load(true); opened = true; };
  es.addEventListener('add', (e) => {
    const m = JSON.parse(e.data);
    if (loaded.some((x) => keyOf(x) === keyOf(m))) return;
    loaded.unshift(m);
    const li = card(m);
    li.classList.add('fresh');
    grid.prepend(li);
    empty.hidden = true;
  });
  es.addEventListener('update', (e) => {
    const m = JSON.parse(e.data);
    const i = loaded.findIndex((x) => keyOf(x) === keyOf(m));
    if (i < 0) return;
    loaded[i] = m;
    grid.children[i].replaceWith(card(m));
  });
}
function renderTabs() {
  document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.view === view)));
  $('.controls').hidden = view === 'history';
  renderEmpty();
  syncLive();
}
function setView(v) {
  if (v === view) return;
  view = v;
  window.history.replaceState(null, '', v === 'history' ? '#history' : location.pathname + location.search);
  renderTabs();
  load(true);
}
function renderError() {
  errBox.hidden = !lastErr;
  if (lastErr) errBox.textContent = errMsg(lastErr);
}

async function load(reset) {
  if (loading && !reset) return;
  loading = true;
  const mine = reset ? ++token : token;
  if (reset) { stopPreview(); page = 0; loaded = []; grid.replaceChildren(); more.hidden = true; empty.hidden = true; }
  lastErr = null;
  renderError();
  more.disabled = true;
  try {
    const url = view === 'history'
      ? '/api/history?' + new URLSearchParams({ page })
      : '/api/maps?' + new URLSearchParams({ q: $('#q').value, sort: $('#sort').value, page });
    const r = await fetch(url);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw j;
    if (mine !== token) return;
    const docs = j.docs.filter((d) => !loaded.some((x) => keyOf(x) === keyOf(d)));
    loaded.push(...docs);
    grid.append(...docs.map(card));
    page++;
    more.hidden = !j.hasMore;
    renderEmpty();
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
  stopPreview();
  renderStatus();
  renderEmpty();
  renderError();
  grid.replaceChildren(...loaded.map(card));
});

let debounce;
$('#q').addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(() => load(true), 350); });
$('#sort').addEventListener('change', () => load(true));
more.addEventListener('click', () => load(false));
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
window.addEventListener('hashchange', () => setView(location.hash === '#history' ? 'history' : 'maps'));

i18n.init().then(() => { renderStatus(); renderTabs(); return loadStatus(); }).then(() => load(true));

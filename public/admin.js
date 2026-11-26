const $ = (s) => document.querySelector(s);
const { t, errMsg } = i18n;
let pollTimer, lastCfg = null, deviceMsg = null;

async function api(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && url !== '/api/admin/login') { showLogin(); throw { code: 'not_logged_in' }; }
  if (!r.ok) throw j;
  return j;
}

function showLogin() {
  clearTimeout(pollTimer);
  $('#panel').hidden = true;
  $('#login').hidden = false;
}

function renderState(c) {
  const s = $('#state');
  s.textContent = c.connected ? t('connected_as', { login: c.login }) : t('not_connected');
  s.className = 'pill ' + (c.connected ? 'on' : 'off');
  $('#connect').textContent = t(c.connected ? 'reconnect' : 'connect');
  $('#disconnect').hidden = !c.connected;
}

function render(c) {
  lastCfg = c;
  $('#clientId').value = c.clientId;
  $('#channel').value = c.channel;
  $('#template').value = c.messageTemplate;
  $('#ipCd').value = c.ipCooldownSec;
  $('#mapCd').value = c.mapCooldownSec;
  $('#defaultLang').value = c.defaultLang;
  renderState(c);
}

function renderDevice() {
  $('#deviceMsg').textContent = !deviceMsg ? '' : deviceMsg.key ? t(deviceMsg.key) : errMsg(deviceMsg.err);
}

async function init() {
  try {
    render(await api('GET', '/api/admin/config'));
    $('#login').hidden = true;
    $('#panel').hidden = false;
  } catch { showLogin(); }
}

$('#loginBtn').addEventListener('click', async () => {
  try {
    await api('POST', '/api/admin/login', { password: $('#pw').value });
    $('#pw').value = '';
    init();
  } catch (e) { alert(errMsg(e)); }
});
$('#pw').addEventListener('keydown', (e) => e.key === 'Enter' && $('#loginBtn').click());
$('#logout').addEventListener('click', async () => { await api('POST', '/api/admin/logout'); showLogin(); });

async function save() {
  const msg = $('#saveMsg');
  try {
    render(await api('PUT', '/api/admin/config', {
      clientId: $('#clientId').value,
      channel: $('#channel').value,
      messageTemplate: $('#template').value,
      ipCooldownSec: $('#ipCd').value,
      mapCooldownSec: $('#mapCd').value,
      defaultLang: $('#defaultLang').value,
    }));
    msg.textContent = t('saved');
    return true;
  } catch (e) {
    msg.textContent = errMsg(e);
    return false;
  }
}
$('#save').addEventListener('click', save);

$('#connect').addEventListener('click', async () => {
  if (!(await save())) return;
  try {
    const d = await api('POST', '/api/admin/twitch/start');
    $('#userCode').textContent = d.user_code;
    $('#verify').href = d.verification_uri;
    deviceMsg = { key: 'device_waiting' };
    renderDevice();
    $('#device').hidden = false;
    poll(d.interval);
  } catch (e) { $('#saveMsg').textContent = errMsg(e); }
});

function poll(interval) {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    try {
      const r = await api('POST', '/api/admin/twitch/poll');
      if (r.status === 'pending') return poll(interval);
      if (r.status === 'ok') {
        $('#device').hidden = true;
        return render(await api('GET', '/api/admin/config'));
      }
      deviceMsg = r.status === 'expired' ? { key: 'device_expired' } : { err: r };
    } catch (e) { deviceMsg = { err: e }; }
    renderDevice();
  }, interval * 1000);
}

$('#disconnect').addEventListener('click', async () => render(await api('POST', '/api/admin/twitch/logout')));

// Sprachwechsel: dynamische Texte neu zeichnen, Eingaben bleiben erhalten
i18n.onChange(() => {
  if (lastCfg) renderState(lastCfg);
  renderDevice();
  $('#saveMsg').textContent = '';
});

i18n.init().then(init);

import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || '/data';
const CFG_FILE = path.join(DATA_DIR, 'config.json');
const PORT = Number(process.env.PORT) || 3000;
const TW_SCOPE = 'user:write:chat';
const TW_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

// Fehler tragen nur einen Code (+ Parameter). Übersetzt wird im Browser.
class HttpError extends Error {
  constructor(status, code, params = {}) { super(code); this.status = status; this.code = code; this.params = params; }
}

/* ---------- Config (JSON-Datei im Volume) ---------- */
const defaults = {
  clientId: '',
  channel: '',
  defaultLang: 'de',
  messageTemplate: '!bsr {code}',
  ipCooldownSec: 60,
  mapCooldownSec: 300,
  adminPassword: '',
  auth: null, // { access_token, refresh_token, expires_at, user_id, login }
};
fs.mkdirSync(DATA_DIR, { recursive: true });
let cfg = { ...defaults };
try { cfg = { ...defaults, ...JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')) }; } catch { /* erster Start */ }
const save = () => fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });

if (!process.env.ADMIN_PASSWORD && !cfg.adminPassword) {
  cfg.adminPassword = crypto.randomBytes(9).toString('base64url');
  save();
  console.log(`\n  Kein ADMIN_PASSWORD gesetzt. Generiertes Admin-Passwort: ${cfg.adminPassword}\n`);
}
const adminPassword = () => process.env.ADMIN_PASSWORD || cfg.adminPassword;

const publicConfig = () => ({
  clientId: cfg.clientId,
  channel: cfg.channel,
  defaultLang: cfg.defaultLang,
  messageTemplate: cfg.messageTemplate,
  ipCooldownSec: cfg.ipCooldownSec,
  mapCooldownSec: cfg.mapCooldownSec,
  connected: !!cfg.auth,
  login: cfg.auth?.login || null,
});

/* ---------- Express ---------- */
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1');
app.use(express.json({ limit: '10kb' }));

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    if (!e.status) {
      console.error(e);
      const net = e.cause?.code || e.name === 'TimeoutError';
      return res.status(net ? 502 : 500).json({ code: net ? 'external_unreachable' : 'internal_error' });
    }
    res.status(e.status).json({ code: e.code, params: e.params });
  });

/* ---------- Admin-Login (Session-Cookie) ---------- */
const sessions = new Map(); // sid -> Ablaufzeit
const fails = new Map(); // ip -> { n, until }

const getCookie = (req, name) => {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
};
const sha = (s) => crypto.createHash('sha256').update(s).digest();

const requireAdmin = (req, res, next) => {
  const exp = sessions.get(getCookie(req, 'sid'));
  if (exp && exp > Date.now()) return next();
  res.status(401).json({ code: 'not_logged_in' });
};

app.post('/api/admin/login', wrap(async (req, res) => {
  const f = fails.get(req.ip);
  if (f && f.n >= 5 && f.until > Date.now()) throw new HttpError(429, 'too_many_attempts');
  const ok = crypto.timingSafeEqual(sha(String(req.body?.password || '')), sha(adminPassword()));
  if (!ok) {
    fails.set(req.ip, { n: (f?.n || 0) + 1, until: Date.now() + 10 * 60_000 });
    throw new HttpError(401, 'wrong_password');
  }
  fails.delete(req.ip);
  const sid = crypto.randomBytes(24).toString('base64url');
  sessions.set(sid, Date.now() + 8 * 3600_000);
  res.setHeader('Set-Cookie', `sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${req.secure ? '; Secure' : ''}`);
  res.json({ ok: true });
}));

app.post('/api/admin/logout', (req, res) => {
  sessions.delete(getCookie(req, 'sid'));
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/admin/config', requireAdmin, (req, res) => res.json(publicConfig()));

app.put('/api/admin/config', requireAdmin, wrap(async (req, res) => {
  const b = req.body || {};
  const clientId = String(b.clientId ?? '').trim();
  const channel = String(b.channel ?? '').trim().replace(/^#/, '').toLowerCase();
  const template = String(b.messageTemplate ?? '').trim();
  const defaultLang = ['de', 'en'].includes(b.defaultLang) ? b.defaultLang : cfg.defaultLang;
  const ip = Number(b.ipCooldownSec);
  const map = Number(b.mapCooldownSec);

  if (channel && !/^[a-z0-9_]{1,25}$/.test(channel)) throw new HttpError(400, 'bad_channel');
  if (!template.includes('{code}') || template.length > 200) throw new HttpError(400, 'bad_template');
  if (![ip, map].every((n) => Number.isFinite(n) && n >= 0 && n <= 86400)) throw new HttpError(400, 'bad_cooldown');

  if (clientId !== cfg.clientId) cfg.auth = null; // Token gehört zur alten Client-ID
  Object.assign(cfg, { clientId, channel, defaultLang, messageTemplate: template, ipCooldownSec: ip, mapCooldownSec: map });
  save();
  res.json(publicConfig());
}));

/* ---------- Twitch: Device-Code-Login & Token-Verwaltung ---------- */
const twForm = async (url, params) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};

let pending = null; // laufender Device-Code-Login

app.post('/api/admin/twitch/start', requireAdmin, wrap(async (req, res) => {
  if (!cfg.clientId) throw new HttpError(400, 'need_client_id');
  const { status, json } = await twForm('https://id.twitch.tv/oauth2/device', { client_id: cfg.clientId, scopes: TW_SCOPE });
  if (status !== 200) throw new HttpError(502, 'twitch_login_rejected', { detail: json.message || '' });
  pending = { device_code: json.device_code, expires: Date.now() + json.expires_in * 1000 };
  res.json({ user_code: json.user_code, verification_uri: json.verification_uri, interval: json.interval || 5 });
}));

app.post('/api/admin/twitch/poll', requireAdmin, wrap(async (req, res) => {
  if (!pending) return res.json({ status: 'idle' });
  if (Date.now() > pending.expires) { pending = null; return res.json({ status: 'expired' }); }
  const { status, json } = await twForm(TW_TOKEN_URL, {
    client_id: cfg.clientId,
    scopes: TW_SCOPE,
    device_code: pending.device_code,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  });
  if (status === 200) {
    const v = await fetch('https://id.twitch.tv/oauth2/validate', { headers: { Authorization: `OAuth ${json.access_token}` } });
    const info = await v.json().catch(() => ({}));
    if (!v.ok) { pending = null; return res.json({ status: 'error', code: 'token_check_failed' }); }
    cfg.auth = {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: Date.now() + json.expires_in * 1000,
      user_id: info.user_id,
      login: info.login,
    };
    pending = null;
    save();
    return res.json({ status: 'ok', login: info.login });
  }
  if (['authorization_pending', 'slow_down'].includes(json.message)) return res.json({ status: 'pending' });
  pending = null;
  res.json({ status: 'error', code: 'twitch_error', params: { detail: json.message || '' } });
}));

app.post('/api/admin/twitch/logout', requireAdmin, (req, res) => {
  cfg.auth = null; pending = null; save();
  res.json(publicConfig());
});

let refreshing = null;
const refreshToken = async () => {
  const { status, json } = await twForm(TW_TOKEN_URL, {
    client_id: cfg.clientId, grant_type: 'refresh_token', refresh_token: cfg.auth.refresh_token,
  });
  if (status !== 200) {
    cfg.auth = null; save();
    throw new HttpError(503, 'login_expired');
  }
  // Twitch rotiert das Refresh-Token, daher immer beide speichern
  cfg.auth = { ...cfg.auth, access_token: json.access_token, refresh_token: json.refresh_token, expires_at: Date.now() + json.expires_in * 1000 };
  save();
  return cfg.auth.access_token;
};
const getToken = async () => {
  if (!cfg.auth) throw new HttpError(503, 'twitch_not_connected');
  if (cfg.auth.expires_at > Date.now() + 60_000) return cfg.auth.access_token;
  refreshing ??= refreshToken().finally(() => { refreshing = null; });
  return refreshing;
};

const idCache = new Map();
const broadcasterId = async (token) => {
  if (idCache.has(cfg.channel)) return idCache.get(cfg.channel);
  const r = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(cfg.channel)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Client-Id': cfg.clientId },
  });
  const id = (await r.json().catch(() => ({}))).data?.[0]?.id;
  if (!id) throw new HttpError(502, 'channel_not_found', { channel: cfg.channel });
  idCache.set(cfg.channel, id);
  return id;
};

const sendChat = async (message, retry = true) => {
  const token = await getToken();
  const bid = await broadcasterId(token);
  const r = await fetch('https://api.twitch.tv/helix/chat/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Client-Id': cfg.clientId, 'Content-Type': 'application/json' },
    body: JSON.stringify({ broadcaster_id: bid, sender_id: cfg.auth.user_id, message }),
  });
  if (r.status === 401 && retry) { cfg.auth.expires_at = 0; return sendChat(message, false); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, 'twitch_rejected', { detail: j.message || '' });
  const d = j.data?.[0];
  if (d && !d.is_sent) throw new HttpError(502, 'twitch_dropped', { detail: d.drop_reason?.message || '' });
};

/* ---------- Öffentliche API ---------- */
app.get('/api/status', (req, res) => res.json({ ready: !!(cfg.auth && cfg.channel), channel: cfg.channel, defaultLang: cfg.defaultLang }));

const mapCache = new Map();
app.get('/api/maps', wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  const sort = ['Latest', 'Rating', 'Relevance', 'Curated'].includes(req.query.sort) ? req.query.sort : 'Latest';
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 0, 0), 500);
  const key = `${sort}|${page}|${q}`;
  const hit = mapCache.get(key);
  if (hit && hit.t > Date.now() - 60_000) return res.json(hit.data);

  const url = `https://api.beatsaver.com/search/text/${page}?sortOrder=${sort}&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'bsr-party-requests/1.0' }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new HttpError(502, 'beatsaver_down');
  const docs = ((await r.json()).docs || []).map((d) => {
    const v = d.versions?.[0] || {};
    return {
      id: d.id,
      name: d.metadata?.songName || d.name,
      artist: d.metadata?.songAuthorName || '',
      mapper: d.uploader?.name || d.metadata?.levelAuthorName || '',
      duration: d.metadata?.duration || 0,
      score: d.stats?.score ?? null,
      cover: v.coverURL || '',
      diffs: [...new Set((v.diffs || []).map((x) => x.difficulty))],
    };
  });
  const data = { docs, hasMore: docs.length >= 20 };
  if (mapCache.size > 500) mapCache.clear();
  mapCache.set(key, { t: Date.now(), data });
  res.json(data);
}));

const ipLast = new Map();
const mapLast = new Map();
setInterval(() => {
  const old = Date.now() - 86400_000;
  for (const m of [ipLast, mapLast]) for (const [k, t] of m) if (t < old) m.delete(k);
  for (const [k, t] of sessions) if (t < Date.now()) sessions.delete(k);
}, 600_000).unref();

app.post('/api/request', wrap(async (req, res) => {
  const id = String(req.body?.id || '').toLowerCase();
  if (!/^[0-9a-f]{1,8}$/.test(id)) throw new HttpError(400, 'invalid_code');
  if (!cfg.auth || !cfg.channel) throw new HttpError(503, 'not_setup');

  const now = Date.now();
  const ipWait = (ipLast.get(req.ip) || 0) + cfg.ipCooldownSec * 1000 - now;
  if (ipWait > 0) throw new HttpError(429, 'wait_ip', { s: Math.ceil(ipWait / 1000) });
  const mapWait = (mapLast.get(id) || 0) + cfg.mapCooldownSec * 1000 - now;
  if (mapWait > 0) throw new HttpError(429, 'wait_map');

  const prevIp = ipLast.get(req.ip);
  const prevMap = mapLast.get(id);
  ipLast.set(req.ip, now); mapLast.set(id, now); // vorab setzen gegen Doppelklicks
  try {
    await sendChat(cfg.messageTemplate.replaceAll('{code}', id));
  } catch (e) {
    prevIp ? ipLast.set(req.ip, prevIp) : ipLast.delete(req.ip);
    prevMap ? mapLast.set(id, prevMap) : mapLast.delete(id);
    throw e;
  }
  res.json({ ok: true });
}));

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.listen(PORT, () => console.log(`Läuft auf Port ${PORT}`));

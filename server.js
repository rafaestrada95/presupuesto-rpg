/* Budgy · servidor
   - Sirve la app (index.html, íconos, manifest, sw.js).
   - Guarda las suscripciones a notificaciones y manda los avisos:
     · recordatorio diario a la hora que elige cada persona (se salta si ya anotó ese día)
     · aviso un día antes de que venza un pago
   Variables de entorno:
     PORT               puerto (Railway lo asigna solo)
     VAPID_PUBLIC_KEY   llaves para notificaciones; si faltan se generan y se
     VAPID_PRIVATE_KEY  guardan en DATA_DIR (conviene fijarlas en Railway)
     VAPID_SUBJECT      contacto del remitente, ej. mailto:tu@correo.com
     DATA_DIR           carpeta donde se guardan los datos (usa un Volume de Railway)
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const KEYS_FILE = path.join(DATA_DIR, 'vapid.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

/* ── Llaves VAPID ── */
function loadKeys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  try { return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')); } catch (e) { /* se generan abajo */ }
  const keys = webpush.generateVAPIDKeys();
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys));
  console.log('[budgy] Se generaron llaves VAPID nuevas. Para que no cambien entre despliegues, agrega en Railway:');
  console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
  return keys;
}
const KEYS = loadKeys();
webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:budgy@example.com', KEYS.publicKey, KEYS.privateKey);

/* ── Suscripciones (archivo JSON; con un Volume de Railway sobrevive a los despliegues) ── */
let subs = {};
try { subs = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8')); } catch (e) { subs = {}; }
let saveTimer = null;
function saveSubs() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = SUBS_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(subs));
    fs.renameSync(tmp, SUBS_FILE);
  }, 300);
}
const keyOf = endpoint => Buffer.from(String(endpoint)).toString('base64').slice(-48);

/* ── Hora local de cada persona ── */
function localParts(tz, now = new Date()) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  } catch (e) {
    return localParts('America/Mexico_City', now);
  }
  const g = t => parts.find(p => p.type === t).value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, day: +g('day'), hour: +g('hour'), minute: +g('minute') };
}
const fmt = n => '$' + Math.round(+n || 0).toLocaleString('es-MX');
const DAILY_TEXTS = [
  '¿Gastaste algo hoy? Anótalo en 10 segundos.',
  'Un minuto hoy = sabes exacto cuánto puedes gastar mañana.',
  'Tu racha te espera. Anota lo de hoy y listo.',
  '¿Café, súper, gasolina? Anótalo antes de que se te olvide.'
];

/* ── Qué avisos tocan ahora para una suscripción ── */
function dueNotifications(s, now = new Date()) {
  const out = [];
  const t = localParts(s.tz, now);
  const p = s.prefs || {};
  const hour = Number.isInteger(p.hour) ? p.hour : 21;
  if (p.daily !== false && t.hour === hour && s.lastDaily !== t.date && s.lastLogDate !== t.date) {
    out.push({
      mark: { lastDaily: t.date },
      payload: { title: 'Budgy', body: DAILY_TEXTS[t.day % DAILY_TEXTS.length], url: './?quick=1', tag: 'budgy-diario' }
    });
  }
  if (p.payments !== false && t.hour === 9 && s.lastPayments !== t.date) {
    const tomorrow = localParts(s.tz, new Date(now.getTime() + 864e5)).day;
    const soon = (s.payments || []).filter(x => !x.paid && +x.day === tomorrow);
    if (soon.length) {
      const body = soon.length === 1 ? `Mañana vence ${soon[0].name}${soon[0].amount ? ` (${fmt(soon[0].amount)})` : ''}.` : `Mañana vencen ${soon.length} pagos: ${soon.map(x => x.name).join(', ')}.`;
      out.push({ mark: { lastPayments: t.date }, payload: { title: 'Pago por vencer', body, url: './', tag: 'budgy-pagos' } });
    } else out.push({ mark: { lastPayments: t.date }, payload: null });
  }
  return out;
}

async function send(k, payload) {
  const s = subs[k];
  if (!s) return false;
  try {
    await webpush.sendNotification(s.subscription, JSON.stringify(payload), { TTL: 60 * 60 * 6 });
    return true;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) { delete subs[k]; saveSubs(); }
    else console.error('[budgy] push', err.statusCode || '', err.body || err.message);
    return false;
  }
}
async function tick(now = new Date()) {
  for (const k of Object.keys(subs)) {
    for (const n of dueNotifications(subs[k], now)) {
      Object.assign(subs[k], n.mark);
      saveSubs();
      if (n.payload) await send(k, n.payload);
    }
  }
}

/* ── HTTP ── */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8' };
const PUBLIC = new Set(['index.html', 'sw.js', 'manifest.webmanifest']);
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 1e5) { reject(new Error('muy grande')); req.destroy(); } });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(e); } });
  });
}
function cleanPayments(list) {
  return (Array.isArray(list) ? list : []).slice(0, 40).map(x => ({ name: String(x.name || '').slice(0, 40), day: Math.max(1, Math.min(31, +x.day || 0)), amount: Math.max(0, +x.amount || 0), paid: !!x.paid })).filter(x => x.name && x.day);
}
async function api(req, res, url) {
  if (url.pathname === '/api/push/key' && req.method === 'GET') return json(res, 200, { key: KEYS.publicKey });
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  let body;
  try { body = await readBody(req); } catch (e) { return json(res, 400, { error: 'Datos inválidos' }); }
  const sub = body.subscription;
  const endpoint = (sub && sub.endpoint) || body.endpoint;
  if (!endpoint || !/^https:\/\//.test(endpoint)) return json(res, 400, { error: 'Falta la suscripción' });
  const k = keyOf(endpoint);
  if (url.pathname === '/api/push/subscribe' || url.pathname === '/api/push/sync') {
    const prev = subs[k] || {};
    if (!sub && !prev.subscription) return json(res, 404, { error: 'No existe la suscripción' });
    const p = body.prefs || prev.prefs || {};
    subs[k] = {
      ...prev,
      subscription: sub || prev.subscription,
      tz: String(body.tz || prev.tz || 'America/Mexico_City').slice(0, 60),
      prefs: { hour: Math.max(0, Math.min(23, parseInt(p.hour, 10) || 21)), daily: p.daily !== false, payments: p.payments !== false },
      payments: body.payments ? cleanPayments(body.payments) : prev.payments || [],
      lastLogDate: body.lastLogDate || prev.lastLogDate || null,
      updatedAt: new Date().toISOString()
    };
    saveSubs();
    return json(res, 200, { ok: true });
  }
  if (url.pathname === '/api/push/unsubscribe') {
    delete subs[k];
    saveSubs();
    return json(res, 200, { ok: true });
  }
  if (url.pathname === '/api/push/test') {
    const ok = await send(k, { title: 'Budgy', body: '¡Listo! Así te van a llegar tus avisos.', url: './', tag: 'budgy-prueba' });
    return json(res, ok ? 200 : 410, { ok });
  }
  return json(res, 404, { error: 'No encontrado' });
}
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const allowed = PUBLIC.has(rel) || /^icons\/[\w.-]+\.png$/.test(rel);
  if (!allowed) rel = 'index.html';
  const file = path.join(ROOT, rel);
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    const ext = path.extname(file);
    const fresh = rel === 'index.html' || rel === 'sw.js' || rel === 'manifest.webmanifest';
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': fresh ? 'no-cache' : 'public, max-age=604800' });
    res.end(buf);
  });
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return api(req, res, url).catch(e => { console.error(e); json(res, 500, { error: 'Error del servidor' }); });
  serveStatic(req, res, url);
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`[budgy] escuchando en ${PORT} · ${Object.keys(subs).length} suscripciones`));
  setInterval(() => tick().catch(e => console.error('[budgy] tick', e)), 60 * 1000);
}
module.exports = { server, dueNotifications, localParts, tick, _subs: () => subs, _setSender: fn => { webpush.sendNotification = fn; } };

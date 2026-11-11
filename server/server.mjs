// Agentka web server (Hetzner, Nürnberg — EU).
//
// 1. Serves the prebuilt site from SITE_DIR (index.html for every unknown path, long cache for /assets).
// 2. POST /api/prijava — a sign-up from the registration form:
//    - checks the fields and the consent box, drops bots (honeypot field, rate limit per IP),
//    - saves the sign-up in SQLite at DATA_DIR/agentka.db (a persistent volume in Coolify),
//    - sends two e-mails through Resend from noreply@agentka.si:
//        a) a notice to NOTIFY_EMAIL (the owner) with all fields, reply goes to the visitor,
//        b) a confirmation to the visitor, reply goes to NOTIFY_EMAIL.
//    The sign-up is saved even when e-mail fails; the failure is logged and stored on the row.
//
// Settings (environment variables, set in Coolify):
//   RESEND_API_KEY  required for e-mail (without it sign-ups are only saved)
//   NOTIFY_EMAIL    where the owner gets notices (without it no owner notice is sent)
//   MAIL_FROM       default "Agentka <noreply@agentka.si>"
//   DATA_DIR        default /data      SITE_DIR default ./site      PORT default 80
//   RESEND_API_URL  default https://api.resend.com/emails (tests point it at a local mock)
//   RETENTION_DAYS  default 730 — older sign-ups are deleted automatically
import http from 'node:http';
import { createReadStream, mkdirSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const PORT = Number(process.env.PORT || 80);
const SITE_DIR = resolve(process.env.SITE_DIR || './site');
const DATA_DIR = resolve(process.env.DATA_DIR || '/data');
const RESEND_API_URL = process.env.RESEND_API_URL || 'https://api.resend.com/emails';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const NOTIFY_EMAIL = (process.env.NOTIFY_EMAIL || '').trim();
const MAIL_FROM = process.env.MAIL_FROM || 'Agentka <noreply@agentka.si>';
const RETENTION_DAYS = Number(process.env.RETENTION_DAYS || 730);
const CONSENT_VERSION = '2026-11-11';

/* ------------------------------------------------------------------ database */

mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(join(DATA_DIR, 'agentka.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS prijave (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    ime TEXT NOT NULL,
    podjetje TEXT NOT NULL,
    email TEXT NOT NULL,
    spletna_stran TEXT NOT NULL DEFAULT '',
    soglasje_verzija TEXT NOT NULL,
    soglasje_cas TEXT NOT NULL,
    ip TEXT NOT NULL DEFAULT '',
    mail_status TEXT NOT NULL DEFAULT 'pending'
  )`);
const insertRow = db.prepare(
  `INSERT INTO prijave (created_at, ime, podjetje, email, spletna_stran, soglasje_verzija, soglasje_cas, ip)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);
const setMailStatus = db.prepare('UPDATE prijave SET mail_status = ? WHERE id = ?');
const purgeOld = db.prepare(`DELETE FROM prijave WHERE created_at < ?`);

function purge() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
  const r = purgeOld.run(cutoff);
  if (r.changes) console.log(`retention: deleted ${r.changes} sign-ups older than ${RETENTION_DAYS} days`);
}
purge();
setInterval(purge, 86_400_000).unref();

/* ---------------------------------------------------------------- validation */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '');

function validate(body) {
  const data = {
    ime: clean(body.ime, 120),
    podjetje: clean(body.podjetje, 160),
    email: clean(body.email, 200).toLowerCase(),
    spletna_stran: clean(body.spletna_stran, 300),
  };
  const errors = {};
  if (!data.ime) errors.ime = 'Vpišite svoje ime in priimek.';
  if (!data.podjetje) errors.podjetje = 'Vpišite ime podjetja.';
  if (!EMAIL_RE.test(data.email)) errors.email = 'E-naslov ni pravilno zapisan. Primer: ime@podjetje.si';
  if (body.soglasje !== true) errors.soglasje = 'Za prijavo potrdite soglasje.';
  return { data, errors };
}

/* ---------------------------------------------------------------- rate limit */

const hits = new Map(); // ip -> timestamps (ms) in the last hour
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3_600_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

/* --------------------------------------------------------------------- email */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function sendMail({ to, subject, text, html, replyTo }) {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, text, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function sendMails(id, d) {
  if (!RESEND_API_KEY) {
    setMailStatus.run('skipped: no RESEND_API_KEY', id);
    console.warn(`sign-up #${id}: saved, e-mail skipped (RESEND_API_KEY is not set)`);
    return;
  }
  const results = [];
  if (NOTIFY_EMAIL) {
    const rows = [
      ['Ime', d.ime],
      ['Podjetje', d.podjetje],
      ['E-naslov', d.email],
      ['Spletna stran', d.spletna_stran || '—'],
    ];
    try {
      await sendMail({
        to: NOTIFY_EMAIL,
        replyTo: d.email,
        subject: `Nova prijava na agentka.si: ${d.podjetje}`,
        text: `Nova prijava #${id}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nOdgovor na to sporočilo gre neposredno prijavljenemu.`,
        html: `<p>Nova prijava #${id}</p><table>${rows
          .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#48596a">${esc(k)}</td><td>${esc(v)}</td></tr>`)
          .join('')}</table><p style="color:#48596a">Odgovor na to sporočilo gre neposredno prijavljenemu.</p>`,
      });
      results.push('owner ok');
    } catch (e) {
      results.push(`owner failed: ${e.message}`);
    }
  } else {
    results.push('owner skipped: no NOTIFY_EMAIL');
  }
  try {
    const text = [
      `Pozdravljeni, ${d.ime},`,
      '',
      'hvala za prijavo na Agentko. Prejeli smo vaše podatke in se vam oglasimo v najkrajšem času, da se dogovorimo za začetek.',
      '',
      'Če želite, da vaše podatke izbrišemo, odgovorite na to sporočilo.',
      '',
      'Lep pozdrav,',
      'Agentka',
      'https://agentka.si',
    ].join('\n');
    await sendMail({
      to: d.email,
      replyTo: NOTIFY_EMAIL || undefined,
      subject: 'Hvala za prijavo na Agentko',
      text,
      html: text
        .split('\n\n')
        .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
        .join(''),
    });
    results.push('visitor ok');
  } catch (e) {
    results.push(`visitor failed: ${e.message}`);
  }
  const status = results.join('; ');
  setMailStatus.run(status, id);
  console.log(`sign-up #${id}: ${status}`);
}

/* ---------------------------------------------------------------------- http */

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req, limit = 10_000) {
  return new Promise((ok, fail) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        fail(new Error('too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => ok(Buffer.concat(chunks).toString('utf8')));
    req.on('error', fail);
  });
}

async function handleSignup(req, res) {
  // Traefik (Coolify) appends the real client address as the LAST entry; earlier entries can be forged.
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').pop().trim();
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { ok: false, message: 'Napačna zahteva.' });
  }
  if (!body || typeof body !== 'object') return json(res, 400, { ok: false, message: 'Napačna zahteva.' });
  // Honeypot: people never see this field; bots fill it. Answer "ok" so bots learn nothing.
  if (clean(body.website_hp, 200)) return json(res, 200, { ok: true });
  if (limited(ip)) return json(res, 429, { ok: false, message: 'Preveč poskusov. Poskusite znova čez eno uro.' });
  const { data, errors } = validate(body);
  const version = /^\d{4}-\d{2}-\d{2}$/.test(String(body.soglasje_verzija)) ? body.soglasje_verzija : CONSENT_VERSION;
  if (Object.keys(errors).length) return json(res, 400, { ok: false, errors });
  const now = new Date().toISOString();
  const { lastInsertRowid } = insertRow.run(now, data.ime, data.podjetje, data.email, data.spletna_stran, version, now, ''); // IP is used only for the rate limit, never stored
  const id = Number(lastInsertRowid);
  console.log(`sign-up #${id} saved`);
  await sendMails(id, data).catch((e) => console.error(`sign-up #${id}: mail error`, e));
  return json(res, 200, { ok: true });
}

function serveStatic(req, res) {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  let file = normalize(join(SITE_DIR, path));
  if (file !== SITE_DIR && !file.startsWith(SITE_DIR + sep)) {
    res.writeHead(403).end();
    return;
  }
  let st;
  try {
    st = statSync(file);
    if (st.isDirectory()) {
      file = join(file, 'index.html');
      st = statSync(file);
    }
  } catch {
    file = join(SITE_DIR, 'index.html'); // SPA fallback
    st = statSync(file);
  }
  const immutable = path.startsWith('/assets/');
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
    'Content-Length': st.size,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  if (url === '/api/prijava') {
    if (req.method !== 'POST') return json(res, 405, { ok: false });
    return handleSignup(req, res).catch((e) => {
      console.error('sign-up error', e);
      json(res, 500, { ok: false, message: 'Prijave ni bilo mogoče shraniti. Poskusite znova.' });
    });
  }
  if (url === '/api/health') return json(res, 200, { ok: true });
  if (url.startsWith('/api/')) return json(res, 404, { ok: false });
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`agentka server on :${PORT}, site ${SITE_DIR}, data ${DATA_DIR}`);
  console.log(`e-mail: ${RESEND_API_KEY ? 'on' : 'OFF (no RESEND_API_KEY)'}, owner notices: ${NOTIFY_EMAIL ? 'on' : 'OFF (no NOTIFY_EMAIL)'}`);
});

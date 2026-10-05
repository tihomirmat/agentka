// Full-page screenshots of EVERY screen of the built app, for design review and regression.
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/sweep.mjs
//
// Env: SWEEP_BASE (default http://localhost:4173), SWEEP_OUT (default ../shots/review),
//      SWEEP_COMBOS (default "1440-light,400-light,1440-dark,400-dark"),
//      SWEEP_ONLY (comma list of screen-name prefixes, e.g. "app-nastavitve,carovnik").
// One line per screen. Problems (each makes the exit code 1):
//   OVERFLOW  the page is wider than the window
//   FRAME     an app / admin / wizard page makes the DOCUMENT taller than the window, so the
//             frame (sidebar, top bar) can scroll away — only <main> may scroll there
//   EXTERNAL  a request left the app's own origin (the build must be self-contained, fonts too)
//   console and page errors
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { findChrome, frameProblem, login, registerFresh, settle, watchExternalRequests } from './lib.mjs';

const BASE = process.env.SWEEP_BASE ?? 'http://localhost:4173';
const OUT = resolve(process.env.SWEEP_OUT ?? '../shots/review');
const COMBOS = (process.env.SWEEP_COMBOS ?? '1440-light,400-light,1440-dark,400-dark').split(',').map((c) => {
  const [w, theme] = c.trim().split('-');
  return { width: Number(w), height: Number(w) >= 900 ? 900 : 800, theme, tag: c.trim() };
});
const ONLY = (process.env.SWEEP_ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const wanted = (name) => ONLY.length === 0 || ONLY.some((p) => name.startsWith(p));
const TILE = 1800;

const PUBLIC_ROUTES = [
  ['landing', '/'],
  ['cenik', '/cenik'],
  ['prijava', '/prijava'],
  ['registracija', '/registracija'],
  ['404', '/ta-stran-ne-obstaja'],
];
const APP_ROUTES = [
  ['app-pregled', '/app/pregled'],
  ['app-viri', '/app/viri'],
  ['app-termini', '/app/termini'],
  ['app-obvestila', '/app/obvestila'],
  ['app-pogovori', '/app/pogovori'],
  ['app-pogovor-rezervacija', '/app/pogovori/conv_spl_c01'],
  ['app-pogovor-vprasanje', '/app/pogovori/conv_spl_c02'],
  ['app-kontakti', '/app/kontakti'],
  ['app-rezervacije', '/app/rezervacije'],
  ['app-namestitev', '/app/namestitev'],
  ['app-narocnina', '/app/narocnina'],
  ['app-nastavitve', '/app/nastavitve'],
  ['admin-racuni', '/admin'],
  ['admin-racun-zapadlo', '/admin/racuni/acc_zobna_vidmar'],
  ['admin-paketi', '/admin/paketi'],
];

/** The app scrolls inside <main>, so "full page" means: grow the viewport to the content height. */
async function contentHeight(page) {
  return page.evaluate(() => {
    let max = document.documentElement.scrollHeight;
    for (const el of document.querySelectorAll('main, [data-scroll-root], body *')) {
      const cs = getComputedStyle(el);
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4) {
        const top = el.getBoundingClientRect().top;
        max = Math.max(max, Math.ceil(top + el.scrollHeight));
      }
    }
    return max;
  });
}
async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

let problems = 0;
const lines = [];
/** `frame: true` for routes inside AppShell / AdminShell / WizardShell. */
async function shoot(page, combo, name, { frame = false } = {}) {
  await settle(page);
  const flags = [];
  // The frame is measured at the real window size, BEFORE the viewport is grown for the picture.
  if (frame) {
    const bad = await frameProblem(page);
    if (bad) flags.push(`FRAME ${bad}`);
  }
  const over = await overflow(page);
  const base = page.viewportSize();
  const h = Math.min(await contentHeight(page), 9000);
  if (h > base.height) {
    await page.setViewportSize({ width: base.width, height: h });
    await page.waitForTimeout(250);
  }
  const over2 = await overflow(page);
  const worst = Math.max(over, over2);
  if (worst > 0) flags.push(`OVERFLOW ${worst}px`);
  const file = `${OUT}/${name}-${combo.tag}`;
  const total = page.viewportSize().height;
  if (total <= TILE * 1.2) {
    await page.screenshot({ path: `${file}.png` });
  } else {
    const tiles = Math.ceil(total / TILE);
    for (let i = 0; i < tiles; i++) {
      await page.screenshot({ path: `${file}-${String(i + 1).padStart(2, '0')}.png`, clip: { x: 0, y: i * TILE, width: base.width, height: Math.min(TILE, total - i * TILE) } });
    }
  }
  await page.setViewportSize(base);
  problems += flags.length;
  const line = `${name}-${combo.tag}: ${flags.length ? flags.join(', ') : 'ok'} (height ${total}${frame ? ', frame checked' : ''})`;
  lines.push(line);
  console.log(line);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: findChrome() });
for (const combo of COMBOS) {
  const newContext = async () => {
    const context = await browser.newContext({ viewport: { width: combo.width, height: combo.height }, colorScheme: combo.theme, deviceScaleFactor: 1, locale: 'sl-SI', timezoneId: 'Europe/Ljubljana' });
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') { problems++; console.log(`  console error [${combo.tag}] ${page.url()}: ${m.text()}`); } });
    page.on('pageerror', (e) => { problems++; console.log(`  page error [${combo.tag}] ${page.url()}: ${e.message}`); });
    const external = watchExternalRequests(page, BASE);
    const close = async () => {
      for (const url of new Set(external())) { problems++; console.log(`  EXTERNAL request [${combo.tag}]: ${url}`); }
      await context.close();
    };
    return { page, close };
  };

  // 1. Logged out: public pages (they scroll as a document; no frame check).
  if (PUBLIC_ROUTES.some(([name]) => wanted(name))) {
    const { page, close } = await newContext();
    for (const [name, route] of PUBLIC_ROUTES) {
      if (!wanted(name)) continue;
      await page.goto(`${BASE}/#${route}`);
      await shoot(page, combo, name);
    }
    await close();
  }

  // 2. Fresh customer: register through the real form, walk the wizard, then the empty app.
  if (['carovnik-1', 'carovnik-2', 'carovnik-3', 'carovnik-4', 'carovnik-5', 'prazno-pregled', 'prazno-pogovori'].some(wanted)) {
    const { page, close } = await newContext();
    await registerFresh(page, BASE);
    for (let step = 1; step <= 5; step++) {
      if (!wanted(`carovnik-${step}`)) continue;
      await page.goto(`${BASE}/#/zacetek/${step}`);
      await shoot(page, combo, `carovnik-${step}`, { frame: true });
    }
    for (const [name, route] of [['prazno-pregled', '/app/pregled'], ['prazno-pogovori', '/app/pogovori']]) {
      if (!wanted(name)) continue;
      await page.goto(`${BASE}/#${route}`);
      await shoot(page, combo, name, { frame: true });
    }
    await close();
  }

  // 3. Sample customer (also platform admin): every app and admin screen.
  if (APP_ROUTES.some(([name]) => wanted(name))) {
    const { page, close } = await newContext();
    await login(page, BASE);
    for (const [name, route] of APP_ROUTES) {
      if (!wanted(name)) continue;
      await page.goto(`${BASE}/#${route}`);
      await shoot(page, combo, name, { frame: true });
    }
    await close();
  }
}
await browser.close();
console.log(`\n${lines.length} screenshots in ${OUT}. Problems: ${problems}.`);
process.exit(problems > 0 ? 1 : 0);

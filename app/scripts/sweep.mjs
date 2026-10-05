// Full-page screenshots of EVERY screen of the built app, for design review and regression.
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/sweep.mjs
//
// Env: SWEEP_BASE (default http://localhost:4173), SWEEP_OUT (default ../shots/review),
//      SWEEP_COMBOS (default "1440-light,400-light,1440-dark,400-dark").
// Prints one line per screen: ok / OVERFLOW, and counts console and page errors. Exit code 1 on any problem.
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.env.SWEEP_BASE ?? 'http://localhost:4173';
const OUT = resolve(process.env.SWEEP_OUT ?? '../shots/review');
const COMBOS = (process.env.SWEEP_COMBOS ?? '1440-light,400-light,1440-dark,400-dark').split(',').map((c) => {
  const [w, theme] = c.trim().split('-');
  return { width: Number(w), height: Number(w) >= 900 ? 900 : 800, theme, tag: c.trim() };
});
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

function findChrome() {
  return execSync('find /opt/pw-browsers -name chrome -type f | head -1').toString().trim() || undefined;
}
function localFontCss() {
  const sources = [
    ['@fontsource-variable/bricolage-grotesque', 'opsz.css'],
    ['@fontsource-variable/instrument-sans', 'wght.css'],
    ['@fontsource-variable/instrument-sans', 'wght-italic.css'],
    ['@fontsource/ibm-plex-mono', '400.css'],
    ['@fontsource/ibm-plex-mono', '500.css'],
  ];
  return sources
    .map(([pkg, file]) =>
      readFileSync(resolve('node_modules', pkg, file), 'utf8')
        .replace(/ Variable'/g, "'")
        .replace(/url\(\.\/files\//g, `url(https://fonts.gstatic.com/local/${pkg}/`),
    )
    .join('\n');
}
async function serveFontsLocally(context) {
  const css = localFontCss();
  await context.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: css }));
  await context.route('https://fonts.gstatic.com/**', (r) => {
    const m = new URL(r.request().url()).pathname.match(/^\/local\/(.+)\/([^/]+)$/);
    if (!m) return r.abort();
    try {
      return r.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body: readFileSync(resolve('node_modules', m[1], 'files', m[2])) });
    } catch {
      return r.abort();
    }
  });
}
async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(450);
}
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
async function shoot(page, combo, name) {
  await settle(page);
  const over = await overflow(page);
  const base = page.viewportSize();
  const h = Math.min(await contentHeight(page), 9000);
  if (h > base.height) {
    await page.setViewportSize({ width: base.width, height: h });
    await page.waitForTimeout(250);
  }
  const over2 = await overflow(page);
  const worst = Math.max(over, over2);
  if (worst > 0) problems++;
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
  const line = `${name}-${combo.tag}: ${worst > 0 ? 'OVERFLOW ' + worst + 'px' : 'ok'} (height ${total})`;
  lines.push(line);
  console.log(line);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: findChrome() });
for (const combo of COMBOS) {
  const newContext = async () => {
    const context = await browser.newContext({ viewport: { width: combo.width, height: combo.height }, colorScheme: combo.theme, deviceScaleFactor: 1, locale: 'sl-SI', timezoneId: 'Europe/Ljubljana' });
    await serveFontsLocally(context);
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') { problems++; console.log(`  console error [${combo.tag}] ${page.url()}: ${m.text()}`); } });
    page.on('pageerror', (e) => { problems++; console.log(`  page error [${combo.tag}] ${page.url()}: ${e.message}`); });
    return { context, page };
  };

  // 1. Logged out: public pages.
  {
    const { context, page } = await newContext();
    for (const [name, route] of PUBLIC_ROUTES) {
      await page.goto(`${BASE}/#${route}`);
      await shoot(page, combo, name);
    }
    await context.close();
  }

  // 2. Fresh customer: register through the real form, walk the wizard, then the empty app.
  {
    const { context, page } = await newContext();
    await page.goto(`${BASE}/#/registracija`);
    await settle(page);
    const fill = async (label, value) => { const f = page.getByLabel(label, { exact: false }).first(); if (await f.count()) await f.fill(value); };
    await fill('Vaše ime', 'Nina Zupan');
    await fill('Ime podjetja', 'Cvetličarna Marjetica');
    await fill('Naslov spletne strani', 'cvetlicarna-marjetica.si');
    await fill('E-naslov', 'nina@example.si');
    await fill('Geslo', 'predogled-123');
    const terms = page.getByRole('checkbox').first();
    if (await terms.count()) await terms.check().catch(async () => { await terms.click(); });
    await page.getByRole('button', { name: /Ustvari račun/ }).click();
    await page.waitForURL(/#\/zacetek\/1/, { timeout: 8000 });
    for (let step = 1; step <= 5; step++) {
      await page.goto(`${BASE}/#/zacetek/${step}`);
      await shoot(page, combo, `carovnik-${step}`);
    }
    await page.goto(`${BASE}/#/app/pregled`);
    await shoot(page, combo, 'prazno-pregled');
    await page.goto(`${BASE}/#/app/pogovori`);
    await shoot(page, combo, 'prazno-pogovori');
    await context.close();
  }

  // 3. Sample customer (also platform admin): every app and admin screen.
  {
    const { context, page } = await newContext();
    await page.goto(`${BASE}/#/prijava`);
    await settle(page);
    await page.getByLabel('E-naslov').fill('marko.jereb@example.si');
    await page.getByLabel('Geslo', { exact: true }).fill('predogled-123');
    await page.getByRole('button', { name: 'Prijava', exact: true }).click();
    await page.waitForURL(/#\/app\/pregled/, { timeout: 8000 });
    for (const [name, route] of APP_ROUTES) {
      await page.goto(`${BASE}/#${route}`);
      await shoot(page, combo, name);
    }
    await context.close();
  }
}
await browser.close();
console.log(`\n${lines.length} screenshots in ${OUT}. Problems: ${problems}.`);
process.exit(problems > 0 ? 1 : 0);

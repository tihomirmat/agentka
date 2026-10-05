// Screenshots of the built app for design review.
//
//   npm run build && npx vite preview --port 4173 &     (in one terminal)
//   npm run shots                                        (in another)
//
// Options (env): SHOTS_BASE (default http://localhost:4173), SHOTS_OUT (default ../shots/foundation),
// SHOTS_ROUTES (comma list of hash routes to capture after login, default "/app/pregled").
// SHOTS_REAL_FONTS=1 loads the fonts from Google. By default the Google Fonts request made by
// index.html is answered from node_modules (@fontsource, the same font files), because build
// machines often cannot reach fonts.googleapis.com. The <link> tag itself is still exercised.
// Uses the Chromium that is already on the machine; it never downloads a browser.
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:4173';
const OUT = resolve(process.env.SHOTS_OUT ?? '../shots/foundation');
const APP_ROUTES = (process.env.SHOTS_ROUTES ?? '/app/pregled').split(',').map((r) => r.trim()).filter(Boolean);
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '400', width: 400, height: 800 },
];
const THEMES = ['light', 'dark'];
const TILE = 1600; // long pages are cut into tiles this tall so they stay readable

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    return execSync('find /opt/pw-browsers -name chrome -type f | head -1').toString().trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Elements that stick out of the viewport on the right and are not inside a scroll box. */
async function overflowReport(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const pageOverflow = document.documentElement.scrollWidth - vw;
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 0.5) continue;
      let p = el.parentElement;
      let inScroller = false;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') {
          inScroller = true;
          break;
        }
        p = p.parentElement;
      }
      if (!inScroller) {
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)}`);
      }
      if (offenders.length >= 5) break;
    }
    return { vw, pageOverflow, offenders };
  });
}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}

async function shoot(page, name, { full }) {
  const report = await overflowReport(page);
  const flag = report.pageOverflow > 0 || report.offenders.length > 0 ? 'OVERFLOW' : 'ok';
  console.log(`${name}: ${flag} (page overflow ${report.pageOverflow}px)${report.offenders.length ? ' ' + JSON.stringify(report.offenders) : ''}`);
  if (!full) {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    return;
  }
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const width = page.viewportSize().width;
  if (height <= TILE * 1.25) {
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    return;
  }
  const tiles = Math.ceil(height / TILE);
  for (let i = 0; i < tiles; i++) {
    const y = i * TILE;
    await page.screenshot({
      path: `${OUT}/${name}-${String(i + 1).padStart(2, '0')}.png`,
      fullPage: true,
      clip: { x: 0, y, width, height: Math.min(TILE, height - y) },
    });
  }
}

const REAL_FONTS = process.env.SHOTS_REAL_FONTS === '1';
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: findChrome(),
  // Only HTTPS goes through the proxy; the local preview is fetched directly.
  args: REAL_FONTS && proxy ? [`--proxy-server=https=${proxy.replace(/^https?:\/\//, '')}`] : [],
});

/** The three families as one stylesheet, with file URLs we answer ourselves. */
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
  await context.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: css }),
  );
  await context.route('https://fonts.gstatic.com/**', (route) => {
    const m = new URL(route.request().url()).pathname.match(/^\/local\/(.+)\/([^/]+)$/);
    if (!m) return route.abort();
    try {
      const body = readFileSync(resolve('node_modules', m[1], 'files', m[2]));
      return route.fulfill({
        status: 200,
        contentType: 'font/woff2',
        headers: { 'access-control-allow-origin': '*' },
        body,
      });
    } catch {
      return route.abort();
    }
  });
}
console.log(REAL_FONTS ? 'Fonts: from Google Fonts.' : 'Fonts: Google Fonts request answered from node_modules (@fontsource).');

let problems = 0;
for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: theme,
      deviceScaleFactor: 1,
      locale: 'sl-SI',
      timezoneId: 'Europe/Ljubljana',
    });
    if (!REAL_FONTS) await serveFontsLocally(context);
    const page = await context.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') {
        problems++;
        console.log(`  console error [${vp.name} ${theme}]: ${m.text()}`);
      }
    });
    page.on('pageerror', (e) => {
      problems++;
      console.log(`  page error [${vp.name} ${theme}]: ${e.message}`);
    });
    const tag = `${vp.name}-${theme}`;

    await page.goto(`${BASE}/#/_ui`);
    await settle(page);
    const fonts = await page.evaluate(() =>
      [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')))].join(', ') || 'NONE',
    );
    console.log(`fonts loaded [${tag}] ${fonts}`);
    await shoot(page, `ui-${tag}`, { full: true });

    await page.goto(`${BASE}/#/`);
    await settle(page);
    await shoot(page, `landing-${tag}`, { full: true });

    // Sign in through the real form.
    await page.goto(`${BASE}/#/prijava`);
    await settle(page);
    await page.getByLabel('E-naslov').fill('marko.jereb@example.si');
    await page.getByLabel('Geslo').fill('predogled-123');
    await page.getByRole('button', { name: 'Prijava' }).click();
    await page.waitForURL(/#\/app\/pregled/);
    for (const route of APP_ROUTES) {
      await page.goto(`${BASE}/#${route}`);
      await settle(page);
      const slug = route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-');
      await shoot(page, `${slug}-${tag}`, { full: false });
    }
    if (vp.width < 900) {
      await page.getByRole('button', { name: 'Odpri meni' }).click();
      await page.waitForTimeout(350);
      await shoot(page, `app-drawer-${tag}`, { full: false });
    }
    await context.close();
  }
}
await browser.close();
console.log(problems ? `Done with ${problems} console/page error(s).` : 'Done, no console errors.');

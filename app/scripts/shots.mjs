// Screenshots of the built app for design review.
//
//   npm run build && npx vite preview --port 4173 &     (in one terminal)
//   npm run shots                                        (in another)
//
// Options (env): SHOTS_BASE (default http://localhost:4173), SHOTS_OUT (default ../shots/foundation),
// SHOTS_ROUTES (comma list of hash routes to capture after login, default "/app/pregled").
// The fonts are part of the build (src/styles/fonts.css), so nothing is fetched from a font
// host and nothing is intercepted here; the script prints which font families really loaded.
// Uses the Chromium that is already on the machine; it never downloads a browser.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { findChrome, loadedFonts, login, settle, watchExternalRequests } from './lib.mjs';

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:4173';
const OUT = resolve(process.env.SHOTS_OUT ?? '../shots/foundation');
const APP_ROUTES = (process.env.SHOTS_ROUTES ?? '/app/pregled').split(',').map((r) => r.trim()).filter(Boolean);
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '400', width: 400, height: 800 },
];
const THEMES = ['light', 'dark'];
const TILE = 1600; // long pages are cut into tiles this tall so they stay readable

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

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: findChrome() });

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
    const external = watchExternalRequests(page, BASE);
    const tag = `${vp.name}-${theme}`;

    await page.goto(`${BASE}/#/_ui`);
    await settle(page, 350);
    console.log(`fonts loaded [${tag}] ${await loadedFonts(page)}`);
    await shoot(page, `ui-${tag}`, { full: true });

    await page.goto(`${BASE}/#/`);
    await settle(page, 350);
    await shoot(page, `landing-${tag}`, { full: true });

    // Sign in through the real form (exact field labels, the form's own submit button).
    await login(page, BASE);
    for (const route of APP_ROUTES) {
      await page.goto(`${BASE}/#${route}`);
      await settle(page, 350);
      const slug = route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-');
      await shoot(page, `${slug}-${tag}`, { full: false });
    }
    if (vp.width < 900) {
      await page.getByRole('button', { name: 'Odpri meni', exact: true }).click();
      await page.waitForTimeout(350);
      await shoot(page, `app-drawer-${tag}`, { full: false });
    }
    for (const url of new Set(external())) {
      problems++;
      console.log(`  EXTERNAL request [${tag}]: ${url}`);
    }
    await context.close();
  }
}
await browser.close();
console.log(problems ? `Done with ${problems} problem(s).` : 'Done, no console errors, no external requests.');
process.exit(problems ? 1 : 0);

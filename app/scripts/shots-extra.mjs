// Extra review shots of the foundation: shells that need a login and open overlays.
// Same server as shots.mjs:  npx vite preview --port 4173 &  node scripts/shots-extra.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { findChrome, login } from './lib.mjs';

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:4173';
const OUT = resolve(process.env.SHOTS_OUT ?? '../shots/foundation');
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: findChrome() });

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

for (const theme of ['light', 'dark']) {
  for (const vp of [
    { name: '1440', width: 1440, height: 900 },
    { name: '400', width: 400, height: 800 },
  ]) {
    const context = await browser.newContext({ viewport: vp, colorScheme: theme, locale: 'sl-SI', timezoneId: 'Europe/Ljubljana' });
    const page = await context.newPage();
    page.on('console', (m) => m.type() === 'error' && console.log('  console error:', m.text()));
    page.on('pageerror', (e) => console.log('  page error:', e.message));
    const tag = `${vp.name}-${theme}`;
    const snap = async (name) => {
      await page.waitForTimeout(400);
      console.log(`${name}-${tag}: page overflow ${await overflow(page)}px`);
      await page.screenshot({ path: `${OUT}/${name}-${tag}.png` });
    };

    await page.goto(`${BASE}/#/ni-take-strani`);
    await snap('x-404');

    // guard: a protected address without a login must land on /prijava
    await page.goto(`${BASE}/#/app/kontakti`);
    await page.waitForURL(/#\/prijava/);
    console.log(`guard-${tag}: /app/kontakti without login → ${new URL(page.url()).hash}`);
    await page.locator('form button[type="submit"]').first().click(); // empty form → error
    await snap('x-login-error');
    await login(page, BASE, { expectUrl: /#\/app\/kontakti/ });
    console.log(`guard-${tag}: after login → ${new URL(page.url()).hash}`);

    await page.goto(`${BASE}/#/admin`);
    await snap('x-admin');
    await page.goto(`${BASE}/#/zacetek/3`);
    await snap('x-wizard');

    // user menu
    await page.goto(`${BASE}/#/app/pregled`);
    if (vp.width < 900) await page.getByRole('button', { name: 'Odpri meni' }).click();
    await page.getByRole('button', { name: /Marko Jereb/ }).click();
    await snap('x-usermenu');
    await page.keyboard.press('Escape');

    // overlays in the gallery
    await page.goto(`${BASE}/#/_ui`);
    await page.getByRole('button', { name: 'Odpri okno' }).click();
    await snap('x-dialog');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Odpri nevarno potrditev' }).click();
    await snap('x-confirm');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Uspeh', exact: true }).click();
    await page.getByRole('button', { name: 'Napaka', exact: true }).click();
    await page.getByRole('button', { name: 'Nevtralno obvestilo', exact: true }).click();
    await page.getByRole('combobox', { name: 'Glas agenta' }).scrollIntoViewIfNeeded();
    await page.getByRole('combobox', { name: 'Glas agenta' }).click();
    await snap('x-select-toasts');
    await page.keyboard.press('Escape');

    // keyboard focus ring
    await page.goto(`${BASE}/#/prijava`);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await snap('x-focus');
    await context.close();
  }
}
await browser.close();

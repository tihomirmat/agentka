// Shared pieces of the screenshot / sweep scripts.
import { execSync } from 'node:child_process';

/** The Chromium that is already on the machine; the scripts never download a browser. */
export function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    return execSync('find /opt/pw-browsers -name chrome -type f | head -1').toString().trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function settle(page, ms = 450) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}

/** Font families that really loaded (the build serves them itself — no font host is involved). */
export async function loadedFonts(page) {
  return page.evaluate(
    () => [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')))].join(', ') || 'NONE',
  );
}

/**
 * Counts every request that leaves the app's own origin. The build is self-contained
 * (fonts included), so there must be none. Returns a function that gives the list so far.
 */
export function watchExternalRequests(page, base) {
  const origin = new URL(base).origin;
  const seen = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) return;
    if (!url.startsWith(origin)) seen.push(url);
  });
  return () => seen;
}

/**
 * Signs in through the real form. The two fields are found by their EXACT labels and the
 * form is sent with its submit button, whatever the button says — so the page is free to
 * word its buttons and its other controls ("Pokaži geslo", "Prijava z Googlom" …).
 */
export async function login(page, base, { email = 'marko.jereb@example.si', password = 'predogled-123', expectUrl = /#\/app\/pregled/ } = {}) {
  if (!/#\/prijava/.test(page.url())) await page.goto(`${base}/#/prijava`);
  await settle(page, 200);
  await page.getByLabel('E-naslov', { exact: true }).fill(email);
  await page.getByLabel('Geslo', { exact: true }).fill(password);
  await page.locator('form button[type="submit"]').first().click();
  if (expectUrl) await page.waitForURL(expectUrl, { timeout: 8000 });
}

/** Creates a fresh trial account through the real sign-up form and lands in the wizard. */
export async function registerFresh(page, base, who = {}) {
  const v = { owner: 'Nina Zupan', business: 'Cvetličarna Marjetica', website: 'cvetlicarna-marjetica.si', email: 'nina@example.si', password: 'predogled-123', ...who };
  await page.goto(`${base}/#/registracija`);
  await settle(page, 200);
  // Each field is optional for the script: the form may or may not have it (yet).
  const fill = async (label, value) => {
    const exact = page.getByLabel(label, { exact: true });
    const field = (await exact.count()) ? exact.first() : page.getByLabel(label, { exact: false }).first();
    if (await field.count()) await field.fill(value);
  };
  await fill('Vaše ime in priimek', v.owner);
  await fill('Ime podjetja', v.business);
  await fill('Naslov spletne strani', v.website);
  await fill('E-naslov', v.email);
  await fill('Geslo', v.password);
  const terms = page.getByRole('checkbox').first();
  if (await terms.count()) await terms.check().catch(async () => { await terms.click(); });
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/#\/zacetek\/1/, { timeout: 8000 });
}

/**
 * THE FRAME CHECK. In the app, the admin area and the wizard only <main> scrolls; the
 * document itself must be exactly as tall as the window, or the whole frame (sidebar, top
 * bar) can scroll out of view. Returns null when fine, otherwise a description.
 */
export async function frameProblem(page) {
  const m = await page.evaluate(() => ({ doc: document.documentElement.scrollHeight, body: document.body.scrollHeight, win: window.innerHeight }));
  return m.doc === m.win && m.body === m.win ? null : `document ${m.doc}px / body ${m.body}px in a ${m.win}px window`;
}

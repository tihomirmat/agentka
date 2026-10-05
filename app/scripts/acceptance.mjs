// Stage 1 acceptance checks (docs/SPEC.md §9, stage 1). Every check has a control that can fail.
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/acceptance.mjs
//
// Env: ACC_BASE (default http://localhost:4173).
import { chromium } from 'playwright';
import { findChrome, login, registerFresh, settle } from './lib.mjs';

const BASE = process.env.ACC_BASE ?? 'http://localhost:4173';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const browser = await chromium.launch({ executablePath: findChrome() });
const fresh = async (width = 1440, height = 900) => {
  const context = await browser.newContext({ viewport: { width, height }, locale: 'sl-SI', timezoneId: 'Europe/Ljubljana' });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return { context, page, errors };
};
const go = async (page, route) => { await page.goto(`${BASE}/#${route}`); await settle(page); };
const hash = (page) => new URL(page.url()).hash;

// 1. Protected screens need login.
{
  const { context, page, errors } = await fresh();
  const protectedRoutes = ['/app/pregled', '/app/kontakti', '/app/pogovori', '/app/nastavitve', '/admin', '/admin/paketi'];
  for (const r of protectedRoutes) {
    await go(page, r);
    check(`logged out: ${r} sends to the login page`, hash(page).startsWith('#/prijava'), hash(page));
  }
  // Control: a public page must NOT redirect (proves the check above is not always true).
  await go(page, '/cenik');
  check('control: logged out, /cenik stays on /cenik', hash(page) === '#/cenik', hash(page));
  // After login the guard lets the same route through.
  await login(page, BASE);
  await go(page, '/app/kontakti');
  check('logged in: /app/kontakti opens', hash(page) === '#/app/kontakti', hash(page));
  check('no console errors in the login journey', errors.length === 0, errors.join(' | '));
  await context.close();
}

// 2. Unknown address shows the 404 page (control for "every screen opens").
{
  const { context, page } = await fresh();
  await go(page, '/ta-stran-ne-obstaja');
  const text = await page.locator('body').innerText();
  check('unknown address shows the not-found page', /ne obstaja|ni mogoče najti|404/i.test(text), text.slice(0, 80).replace(/\n/g, ' '));
  await context.close();
}

// 3. Sample data is visible in the lists.
{
  const { context, page } = await fresh();
  await login(page, BASE);
  await go(page, '/app/kontakti');
  const leadRows = await page.locator('tbody tr').count();
  check('Kontakti lists the sample contacts', leadRows >= 5, `${leadRows} rows`);
  await go(page, '/app/pogovori');
  const convLinks = await page.locator('a[href*="#/app/pogovori/"]').count();
  check('Pogovori lists the sample conversations', convLinks >= 10, `${convLinks} conversation links`);
  await go(page, '/admin');
  const adminText = await page.locator('main').innerText();
  check('admin lists the three sample accounts', ['Spletnost', 'Frizerski salon Lana', 'Zobna ordinacija Vidmar'].every((n) => adminText.includes(n)));
  // Privacy control: admin pages must not show any visitor e-mail from the sample conversations.
  await go(page, '/admin/racuni/acc_spletnost');
  const detail = await page.locator('main').innerText();
  check('admin account detail shows no visitor e-mail', !/maja\.kovac@example\.si|luka\.kranjc@example\.si/i.test(detail));
  await context.close();
}

// 4. Forms save and reload their values (Nastavitve → business name).
{
  const { context, page } = await fresh();
  await login(page, BASE);
  await go(page, '/app/nastavitve');
  const field = page.getByLabel('Ime podjetja', { exact: true }).first();
  const original = await field.inputValue();
  // Control: change WITHOUT saving, reload → old value is back.
  await field.fill('Neshranjeno ime');
  await page.reload(); await settle(page);
  const afterUnsaved = await page.getByLabel('Ime podjetja', { exact: true }).first().inputValue();
  check('control: an unsaved change is gone after reload', afterUnsaved === original, `"${afterUnsaved}"`);
  // Real check: change, save, reload → new value stays.
  const f2 = page.getByLabel('Ime podjetja', { exact: true }).first();
  await f2.fill('Spletnost d.o.o.');
  await page.getByRole('button', { name: 'Shrani spremembe' }).first().click();
  await settle(page, 700);
  await page.reload(); await settle(page);
  const afterSaved = await page.getByLabel('Ime podjetja', { exact: true }).first().inputValue();
  check('a saved change is still there after reload', afterSaved === 'Spletnost d.o.o.', `"${afterSaved}"`);
  await context.close();
}

// 5. Wizard: can be left and resumed at the saved step; "Preskoči" moves on without saving.
{
  const { context, page, errors } = await fresh();
  await registerFresh(page, BASE);
  check('registration opens wizard step 1', hash(page) === '#/zacetek/1', hash(page));
  await page.getByRole('button', { name: /^Preskoči/ }).first().click();
  await settle(page);
  check('"Preskoči" on step 1 opens step 2', hash(page) === '#/zacetek/2', hash(page));
  await page.getByRole('button', { name: /^Preskoči/ }).first().click();
  await settle(page);
  check('"Preskoči" on step 2 opens step 3', hash(page) === '#/zacetek/3', hash(page));
  // Leave the wizard, then come back without a step number.
  await go(page, '/app/pregled');
  check('the app opens while setup is unfinished', hash(page) === '#/app/pregled', hash(page));
  await go(page, '/zacetek');
  check('returning to /zacetek resumes at step 3', hash(page) === '#/zacetek/3', hash(page));
  // Control: an invalid step number does not open a broken page.
  await go(page, '/zacetek/9');
  check('control: /zacetek/9 falls back to the saved step', hash(page) === '#/zacetek/3', hash(page));
  // The fresh account's lists are empty and say what to do next.
  await go(page, '/app/pogovori');
  const empty = await page.locator('main').innerText();
  check('fresh account: Pogovori shows an empty state with a next step', /Namest|namest/.test(empty) && !/conv_/.test(empty), empty.slice(0, 90).replace(/\n/g, ' '));
  check('no console errors in the wizard journey', errors.length === 0, errors.join(' | '));
  await context.close();
}

// 6. Finishing the wizard: with a page the agent goes live, without one it stays a draft.
{
  const { context, page } = await fresh();
  await registerFresh(page, BASE);
  await page.getByRole('button', { name: 'Uvozi stran' }).first().click();
  await page.getByRole('switch').first().waitFor({ timeout: 15000 });
  await settle(page, 600);
  await go(page, '/zacetek/5');
  await page.getByRole('button', { name: 'Končaj nastavitev' }).click();
  await page.waitForURL(/#\/app\/pregled/, { timeout: 8000 });
  await settle(page, 600);
  const top = await page.locator('header').first().innerText();
  check('finished with an imported page: agent is active', /aktiven/i.test(top), top.replace(/\n/g, ' ').slice(0, 90));
  await context.close();
}
{
  const { context, page } = await fresh();
  await registerFresh(page, BASE);
  await go(page, '/zacetek/5');
  await page.getByRole('button', { name: 'Končaj nastavitev' }).click();
  await page.waitForURL(/#\/app\/pregled/, { timeout: 8000 });
  await settle(page, 600);
  const top = await page.locator('header').first().innerText();
  check('control: finished without any page: agent stays a draft', /osnutek/i.test(top) && !/aktiven/i.test(top), top.replace(/\n/g, ' ').slice(0, 90));
  await context.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);

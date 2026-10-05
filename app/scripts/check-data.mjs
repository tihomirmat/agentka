// Checks of the data layer (src/data/*), run in Node against the same code the screens use.
//
//   node scripts/check-data.mjs            all checks; exit code 1 when one fails
//   node scripts/check-data.mjs --leak     CONTROL: feeds the admin-privacy check a response that
//                                          contains a visitor's e-mail address — it must FAIL
//
// The api module is bundled with esbuild (already installed with Vite) into
// node_modules/.cache/check-data/ and imported from there; `window` and localStorage are
// replaced by small stand-ins, nothing else is mocked.
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.TZ = 'Europe/Ljubljana';
const LEAK_CONTROL = process.argv.includes('--leak');

/* ------------------------------------------------------------------ set-up */

const memory = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => void memory.set(k, String(v)),
  removeItem: (k) => void memory.delete(k),
};

const outDir = resolve('node_modules/.cache/check-data');
mkdirSync(outDir, { recursive: true });
const outfile = resolve(outDir, 'data.mjs');
await build({
  stdin: {
    contents: `
      export * as api from './src/data/api.ts';
      export * as format from './src/data/format.ts';
      export * as labels from './src/data/labels.ts';
      export { getState, setState } from './src/data/store.ts';
    `,
    resolveDir: resolve('.'),
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  external: ['react'],
  logLevel: 'silent',
});
const { api, format, labels, getState, setState } = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);

let failed = 0;
let passed = 0;
function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`ok    ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? `\n      ${detail}` : ''}`);
  }
}
async function throwsWith(fn) {
  try {
    await fn();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}
const SAMPLE = 'acc_spletnost';
const VIDMAR = 'acc_zobna_vidmar';

/* ----------------------------------------------------- admin privacy (R5) */

/** Everything that identifies a visitor or belongs to a conversation, taken from the raw store. */
function visitorNeedles(db) {
  const needles = new Map(); // text → what it is
  const add = (text, what) => {
    if (typeof text === 'string' && text.trim().length >= 5) needles.set(text.trim(), what);
  };
  for (const c of db.conversations) {
    add(c.visitor_name, 'visitor name');
    add(c.visitor_email, 'visitor e-mail');
    add(c.visitor_phone, 'visitor phone');
    add(c.summary, 'conversation summary');
    add(c.topic, 'conversation topic');
    add(c.agreed, 'what was agreed');
    for (const t of c.transcript) if (t.text.length >= 25) add(t.text, 'transcript line');
  }
  for (const l of db.leads) {
    add(l.name, 'contact name');
    add(l.email, 'contact e-mail');
    add(l.phone, 'contact phone');
    add(l.what_they_wanted, 'contact wish');
  }
  for (const b of db.bookings) {
    add(b.customer_name, 'booking name');
    add(b.customer_email, 'booking e-mail');
    add(b.customer_phone, 'booking phone');
  }
  for (const e of db.emailLog) if (e.kind === 'visitor_confirmation') add(e.to, 'visitor e-mail (log)');
  return needles;
}

/** Returns the list of visitor details found in the JSON of an admin response. */
function findLeaks(response, needles) {
  const json = JSON.stringify(response);
  const hits = [];
  for (const [text, what] of needles) {
    // Compare as JSON would print it (quotes and line breaks escaped).
    if (json.includes(JSON.stringify(text).slice(1, -1))) hits.push(`${what}: "${text.slice(0, 60)}"`);
  }
  return hits;
}

await api.login('kdorkoli@example.si', 'predogled-123');
{
  const db = getState();
  const needles = visitorNeedles(db);
  check(
    `privacy: sample store gives the check something to find (${needles.size} visitor details, 1+ failed visitor e-mail)`,
    needles.size > 100 && db.emailLog.some((e) => e.status === 'failed' && e.kind === 'visitor_confirmation'),
  );

  // Control 1 (always runs): the scanner itself must be able to fail.
  const someEmail = db.conversations.find((c) => c.visitor_email).visitor_email;
  const leaky = { errors: [{ at: null, kind: 'email', text: `E-pošta za ${someEmail} ni bila dostavljena.` }] };
  check('privacy control: the scanner flags a response that contains a visitor e-mail', findLeaks(leaky, needles).length === 1);
  check('privacy control: the scanner passes a response without visitor details', findLeaks({ errors: [{ text: 'E-pošta obiskovalcu ni bila dostavljena.' }] }, needles).length === 0);

  const list = await api.adminListAccounts();
  const responses = [['adminListAccounts()', list]];
  for (const row of list) responses.push([`adminGetAccount(${row.account.id})`, await api.adminGetAccount(row.account.id)]);
  if (LEAK_CONTROL) {
    // Control 2 (--leak): what the old data layer returned — an error line naming the visitor.
    const detail = structuredClone(responses[1][1]);
    detail.errors.push({ at: null, kind: 'email', text: `E-pošta za ${someEmail} ni bila dostavljena.` });
    responses[1] = [`${responses[1][0]} + injected visitor e-mail (control)`, detail];
  }
  for (const [name, response] of responses) {
    const hits = findLeaks(response, needles);
    check(`privacy: ${name} contains no visitor detail`, hits.length === 0, hits.slice(0, 5).join(' | '));
  }

  const detail = await api.adminGetAccount(SAMPLE);
  check('privacy: admin detail has no transcripts, no user list', !('recent_conversations' in detail) && !('users' in detail) && !('instructions' in detail.agent));
  check('privacy: failed visitor e-mail is still reported, without the address', detail.errors.some((e) => e.kind === 'email' && /^E-pošta obiskovalcu ni bila dostavljena\. Razlog: /.test(e.text)), JSON.stringify(detail.errors));
  check('admin: owner is the only person named', detail.owner_name === 'Marko Jereb' && detail.owner_email === 'marko.jereb@example.si' && detail.team_size === 3);
  const vid = await api.adminGetAccount(VIDMAR);
  const sourceError = vid.errors.find((e) => e.kind === 'source');
  check('admin (R55): a source that was never read carries no invented time', sourceError && sourceError.at === null && vid.sources_failed === 1, JSON.stringify(sourceError));
  check('admin: paused-by reason is exposed', vid.agent_status === 'paused' && vid.agent_paused_by === 'payment');
}

/* --------------------------------------- one way of counting (R12, R43) */
{
  const stats = await api.getOverviewStats();
  const detail = await api.adminGetAccount(SAMPLE);
  const db = getState();
  const account = db.accounts.find((a) => a.id === SAMPLE);
  const inPeriod = (iso) => iso >= account.period_start && iso <= account.period_end;
  const convs = db.conversations.filter((c) => c.account_id === SAMPLE && inPeriod(c.started_at));
  const ids = new Set(convs.map((c) => c.id));
  const expectedBookings = db.bookings.filter((b) => b.account_id === SAMPLE && b.status !== 'cancelled' && ids.has(b.conversation_id)).length;
  check(`counts: Pregled bookings are counted in the period, cancelled left out (${stats.bookings})`, stats.bookings === expectedBookings && expectedBookings > 0);
  check('counts: admin period numbers equal the customer Pregled numbers', JSON.stringify(detail.period.conversations) === JSON.stringify(stats.counts) && detail.period.leads === stats.leads && detail.period.bookings === stats.bookings);
  const all = api.summarizeConversations(await api.listConversations());
  const o = all.by_outcome;
  check(`counts: outcomes add up to the total (${o.question}+${o.lead}+${o.booking}=${all.total}); with_contact is a separate number (${all.with_contact})`, o.question + o.lead + o.booking === all.total && all.with_contact === o.lead + o.booking);
  // Control that can fail: shorten the period to the last 3 days. The numbers must follow the
  // period (the old code counted every booking ever made, whatever the period).
  const before = account.period_start;
  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
  setState((prev) => ({ ...prev, accounts: prev.accounts.map((a) => (a.id === SAMPLE ? { ...a, period_start: threeDaysAgo } : a)) }));
  const short = await api.getOverviewStats();
  const shortAdmin = await api.adminGetAccount(SAMPLE);
  setState((prev) => ({ ...prev, accounts: prev.accounts.map((a) => (a.id === SAMPLE ? { ...a, period_start: before } : a)) }));
  check(
    `counts control: a 3-day period gives smaller numbers (pogovori ${stats.conversations}→${short.conversations}, rezervacije ${stats.bookings}→${short.bookings}), same in admin`,
    short.conversations > 0 && short.conversations < stats.conversations && short.bookings > 0 && short.bookings < stats.bookings && shortAdmin.period.bookings === short.bookings && shortAdmin.period.conversations.total === short.conversations,
    JSON.stringify(short),
  );
}

/* ------------------------------------------------ pauses are kept apart */
{
  let r = await api.pauseAgent();
  let agent = await api.getAgent();
  check('pause: customer pause sets paused_by "customer"', agent.status === 'paused' && agent.paused_by === 'customer' && r.simulated);
  await api.adminSetPaused(SAMPLE, true);
  agent = await api.getAgent();
  check('pause: admin pause on top outranks it', agent.paused_by === 'admin' && agent.pause_reasons.length === 2);
  const msg = await throwsWith(() => api.resumeAgent());
  agent = await api.getAgent();
  check('pause: the customer cannot undo the admin pause (readable refusal)', agent.status === 'paused' && agent.paused_by === 'admin' && /skrbnik/.test(msg ?? ''), msg ?? 'no error thrown');
  check('pause: …but the customer pause itself was lifted', !agent.pause_reasons.includes('customer'));
  r = await api.adminSetPaused(SAMPLE, false);
  agent = await api.getAgent();
  check('pause: admin resume lifts the admin pause → active', agent.status === 'active' && agent.paused_by === null);
  const refused = await throwsWith(() => api.adminSetPaused(VIDMAR, false));
  const vid = await api.adminGetAccount(VIDMAR);
  check('pause: admin cannot resume an agent stopped by a failed payment', vid.agent_status === 'paused' && /plačil/.test(refused ?? ''), refused ?? 'no error thrown');
  // legacy call site (Nastavitve): updateAgent({ status }) goes through the same rules
  await api.updateAgent({ status: 'paused' });
  agent = await api.getAgent();
  const legacyPaused = agent.paused_by === 'customer';
  await api.updateAgent({ status: 'active' });
  agent = await api.getAgent();
  check('pause: updateAgent({status}) is the customer switch', legacyPaused && agent.status === 'active');
}

/* -------------------------------------------- in-app preview replies (R2) */
{
  const price = await api.previewAgentReply('Koliko stane spletna stran?');
  check('preview: price question is answered from the account\'s "Cenik storitev"', /890 €/.test(price.text), price.text);
  const general = await api.previewAgentReply('Koliko stane?');
  check('preview: »Koliko stane?« lists lines of the price list', /890 €/.test(general.text) && /Za katero storitev/.test(general.text), general.text);
  const unknown = await api.previewAgentReply('Ali imate parkirišče?');
  check('preview: unknown → "Tega podatka nimam. Želite, da vas pokličemo?"', unknown.text === 'Tega podatka nimam. Želite, da vas pokličemo?', unknown.text);
  const texts = [];
  for (const q of ['Koliko stane?', 'Kdaj ste odprti?', 'Želim termin', 'Kdo si?', 'Hvala', 'Dober dan', 'Kakšen je vaš telefon?']) texts.push((await api.previewAgentReply(q)).text);
  const ownerTalk = texts.filter((t) => /(vašega cenika|viri znanja|virih znanja|predogled|vzorčn)/i.test(t));
  check('preview: no reply speaks to the owner or about the preview', ownerTalk.length === 0, ownerTalk.join(' | '));
}

/* ------------------------------------------------- landing demo (R2), logged out */
await api.logout();
{
  const p = await api.demoAgentReply('Koliko stane?');
  check('demo: »Koliko stane?« gives the salon\'s prices', /25 €/.test(p.text) && /55 €/.test(p.text), p.text);
  const h = await api.demoAgentReply('Kdaj ste odprti?');
  check('demo: opening hours', /8:00/.test(h.text) && /sobot/.test(h.text), h.text);
  const w = await api.demoAgentReply('Kje ste?');
  check('demo: where the salon is', /Vzorčni ulici/.test(w.text), w.text);
  const s1 = await api.demoAgentReply('Želim rezervirati termin.');
  check('demo: booking offers two times', s1.state === 'slot' && /jutri ob 9:00/.test(s1.text) && /v soboto ob 11:00/.test(s1.text), s1.text);
  const s2 = await api.demoAgentReply('V soboto ob 11', s1.state);
  const s3 = await api.demoAgentReply('Ana Novak', s2.state);
  const s4 = await api.demoAgentReply('ana@example.si', s3.state);
  check('demo: slot → name → typed e-mail → honest end', s2.state === 'name' && /v soboto ob 11:00/.test(s2.text) && s3.state === 'contact' && s4.state === undefined && /termin ni rezerviran/.test(s4.text), [s2.text, s3.text, s4.text].join(' | '));
  const u = await api.demoAgentReply('Ali imate darilne bone?');
  check('demo: unknown → says so and offers a call', /Tega podatka nimam/.test(u.text), u.text);
  const all = [p, h, w, s1, s2, s3, u].map((r) => r.text).filter((t) => /(vašega cenika|viri znanja|virih znanja)/i.test(t));
  check('demo: no reply speaks to the owner', all.length === 0, all.join(' | '));
  const terms = await api.getTrialTerms();
  check(`trial (R7): terms are readable logged out → "${format.formatTrialTerms(terms)}"`, terms.days === 14 && terms.minutes === 30 && format.formatTrialTerms(terms) === '14 dni in 30 minut pogovorov');
  check('preview reply does not need a login either', (await api.previewAgentReply('Koliko stane?')).text.length > 0);
}

/* ------------------------- new account: register, import, activation (R3, R11, R27) */
{
  const bad = await throwsWith(() => api.register({ ownerName: '', businessName: 'Frizerski studio Zala', website: '', email: 'zala@example.si', password: 'predogled-123' }));
  check('register: the person\'s name is required', /ime in priimek/.test(bad ?? ''), bad ?? 'no error');
  const session = await api.register({ ownerName: 'Zala Kralj', businessName: 'Frizerski studio Zala', website: 'www.Studio-Zala.si/cenik?x=1', email: 'zala@example.si', password: 'predogled-123' });
  const account = await api.getAccount();
  let agent = await api.getAgent();
  const team = await api.listTeam();
  check('register (R27): one call saves owner name, business, website and domain', session.userName === 'Zala Kralj' && team[0].name === 'Zala Kralj' && account.name === 'Frizerski studio Zala' && account.website_url === 'https://studio-zala.si' && agent.allowed_domain === 'studio-zala.si', JSON.stringify({ session, url: account.website_url, domain: agent.allowed_domain }));
  check('new agent is a draft with a correct greeting', agent.status === 'draft' && agent.first_message === 'Pozdravljeni, sem Jan, AI pomočnik podjetja Frizerski studio Zala. Kako vam lahko pomagam?', agent.first_message);
  check('greeting helper (S16): a female voice makes it "AI pomočnica"', api.defaultFirstMessage('Tina', 'Studio Zala', 'voice_sl_tina') === 'Pozdravljeni, sem Tina, AI pomočnica podjetja Studio Zala. Kako vam lahko pomagam?');

  let ready = await api.getAgentReadiness();
  check('readiness (R3): without sources the agent cannot be activated', ready.canActivate === false && ready.missing.length === 1 && ready.missing[0].key === 'sources' && ready.missing[0].action.to === '/app/viri');
  const refused = await throwsWith(() => api.activateAgent());
  check('activateAgent refuses with a readable sentence', /Agenta še ni mogoče vklopiti/.test(refused ?? ''), refused ?? 'no error');
  await api.setOnboardingStep('done');
  agent = await api.getAgent();
  check('finishing the wizard WITHOUT sources keeps the agent "Osnutek"', agent.status === 'draft');
  await api.setOnboardingStep(1);

  const noPrice = await api.previewAgentReply('Koliko stane striženje?');
  check('preview: account without a price list → "Tega podatka nimam…"', noPrice.text === 'Tega podatka nimam. Želite, da vas pokličemo?', noPrice.text);

  const result = await api.importWebsite('www.Studio-Zala.si/cenik?x=1');
  const pages = (await api.listSources()).filter((s) => s.type === 'website_page');
  const titles = pages.map((p) => p.title);
  const foreign = titles.filter((t) => /(Google oglaševanje|Facebook|Marketing plan|BuWizz|Sample Page|2970|YouTube)/.test(t));
  check(`import (R11): a new account gets a neutral page list (${titles.length} pages), never the agency's`, foreign.length === 0 && ['Domov', 'Storitve', 'Cenik', 'O nas', 'Kontakt', 'Politika zasebnosti', 'Piškotki'].every((t) => titles.includes(t)) && titles.filter((t) => t.startsWith('Blog')).length === 2, titles.join(', '));
  const legal = pages.filter((p) => /Politika|Piškotki/.test(p.title));
  check('import: the two legal pages are pre-excluded with a reason', legal.length === 2 && legal.every((p) => !p.included && p.status === 'excluded' && /Pravna stran/.test(p.note ?? '')) && pages.filter((p) => !p.included).length === 2);
  check('import: one host spelling in rows and message', pages.every((p) => format.domainOf(p.url) === 'studio-zala.si') && result.message.includes('studio-zala.si') && !result.message.includes('www.'), result.message);
  await api.toggleSource(legal[0].id, true);
  check('import: including a suggested-out page clears the suggestion', (await api.listSources()).find((s) => s.id === legal[0].id).note === null);

  ready = await api.getAgentReadiness();
  check('readiness: with sources nothing is missing', ready.canActivate && ready.missing.length === 0);
  await api.setOnboardingStep('done');
  agent = await api.getAgent();
  check('finishing the wizard WITH sources activates the agent (R3)', agent.status === 'active' && agent.paused_by === null);

  const invite = await api.inviteMember('nova@example.si');
  const invited = (await api.listTeam()).find((u) => u.status === 'invited');
  check('invite (R77): the invited person is listed under the address', invited.name === 'nova@example.si' && invite.simulated);

  const del = await api.deleteAccount();
  const db = getState();
  check('deleteAccount: account and its rows are gone and the session ended', !db.session.loggedIn && !db.accounts.some((a) => a.id === account.id) && !db.sources.some((s) => s.account_id === account.id) && !db.users.some((u) => u.account_id === account.id) && del.ok, del.message);
}

/* ---------------------------------------- sample account, login, wording */
{
  const session = await api.login('ana.novak@frizer.si', 'predogled-123');
  check('login (R58): name and address belong to the same sample person', session.userName === 'Marko Jereb' && session.email === 'marko.jereb@example.si');
  const again = await api.importWebsite('spletnost.si');
  const titles = (await api.listSources()).filter((s) => s.type === 'website_page').map((p) => p.title);
  check('import: the sample customer keeps its own page list', titles.includes('Google oglaševanje') && again.message.includes('spletnost.si'));
  await api.deleteAccount();
  check('deleteAccount on the sample customer logs out', !getState().session.loggedIn && !getState().accounts.some((a) => a.id === SAMPLE));
  await api.login('marko.jereb@example.si', 'predogled-123');
  check('…and the next login restores the sample customer', getState().accounts.some((a) => a.id === SAMPLE) && (await api.listConversations()).length === 20);

  const messages = [];
  messages.push((await api.syncWebsite()).message);
  messages.push((await api.sendTestEmail()).message);
  messages.push((await api.connectCalendar()).message);
  messages.push((await api.disconnectCalendar()).message);
  messages.push((await api.changePlan('pro')).message);
  messages.push((await api.openBillingPortal()).message);
  const requested = (await api.listBookings()).find((b) => b.status === 'requested');
  messages.push((await api.confirmBooking(requested.id)).message);
  messages.push((await api.cancelBooking(requested.id)).message);
  messages.push((await api.inviteMember('se.ena@example.si')).message);
  messages.push((await api.adminSetPaused(SAMPLE, true)).message);
  messages.push((await api.adminSetPaused(SAMPLE, false)).message);
  const jargon = messages.filter((m) => /(strežnik|faz[ai]|Stripe|simulir)/i.test(m));
  check(`wording (R13): ${messages.length} simulated results, none says "strežnik", "faza", "Stripe", "simulirano"`, jargon.length === 0, jargon.join(' | '));
  const shape = messages.filter((m) => !/^Predogled: .+\. V polni različici .+\.$/.test(m));
  check('wording (R13): every one reads "Predogled: … V polni različici …"', shape.length === 0, shape.join(' | '));
  const csv = await api.exportLeadsCsv();
  check('wording (T4): CSV header says "E-naslov"', csv.csv.startsWith('"Ime";"E-naslov";"Telefon"'));
  check('wording (T4, S32): the default owner e-mail says "E-naslov:" and "prepis"; one copy for the screens', api.DEFAULT_EMAIL_TEMPLATES.owner.includes('E-naslov: {{eposta}}') && api.DEFAULT_EMAIL_TEMPLATES.owner.includes('Celoten prepis pogovora') && (await api.getNotificationSettings()).owner_template === api.DEFAULT_EMAIL_TEMPLATES.owner);
  const voices = await api.listVoices();
  check('voices (R29) are named by character, not by person', voices.every((v) => /glas/.test(v.name)) && !voices.some((v) => /^(Jan|Tina|Ana|Peter)$/.test(v.name)));
}

/* ------------------------------------------------------- dates and labels */
{
  const now = new Date(2026, 9, 5, 12, 0); // Monday, 5 Oct 2026
  const at = (d, h, m) => new Date(2026, 9, d, h, m);
  const got = [
    format.formatRelativeDateTime(at(5, 10, 12), now),
    format.formatRelativeDateTime(at(4, 15, 40), now),
    format.formatRelativeDateTime(at(3, 13, 22), now),
    format.formatRelativeDateTime(at(6, 9, 5), now),
    format.formatRelativeDateTime(at(7, 14, 0), now),
    format.formatRelativeDateTime(new Date(2025, 11, 31, 8, 0), now),
  ];
  const want = ['danes ob 10:12', 'včeraj ob 15:40', 'sob., 3. okt. ob 13:22', 'jutri ob 09:05', 'sre., 7. okt. ob 14:00', 'sre., 31. dec. 2025 ob 08:00'];
  check('dates (R17): danes · včeraj · jutri · weekday + date, 24-hour time', JSON.stringify(got) === JSON.stringify(want), got.join(' | '));
  check('dates: no "predvčerajšnjim" / "pojutrišnjem" anywhere', ![-2, 2].some((d) => /predvčeraj|pojutri/.test(format.formatRelativeDay(at(5 + d, 9, 0), now))));
  check('duration (R16): "8 min 18 s", never "08:18"', format.formatDuration(498) === '8 min 18 s' && format.formatDuration(45) === '45 s' && format.formatDuration(480) === '8 min' && format.formatTimecode(84) === '01:24');
  check('days left (S18): one set of forms', [1, 2, 3, 5].map((n) => format.formatDaysLeft(n)).join(', ') === 'še 1 dan, še 2 dneva, še 3 dnevi, še 5 dni');
  check('time select helpers: 24-hour clock strings', format.minutesToClock(16 * 60) === '16:00' && format.clockToMinutes('08:30') === 510);
  check('labels: every agent state has its explanation; trial has one name', ['draft', 'active', 'paused', 'error'].every((s) => labels.AGENT_STATUS_HELP[s].length > 20) && labels.TRIAL.name === 'Brezplačni preizkus' && labels.ACCOUNT_STATUS.trial.label === 'Preizkus');
  check('labels (R21): owner e-mail is "Obvestilo vam" in the app, "Obvestilo podjetju" on public pages', labels.EMAIL_KIND.owner_notification === 'Obvestilo vam' && labels.EMAIL_KIND_PUBLIC.owner_notification === 'Obvestilo podjetju');
  check('labels: all four pause reasons are explained', ['customer', 'admin', 'limit', 'payment'].every((r) => labels.PAUSED_BY[r].help.length > 20));
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);

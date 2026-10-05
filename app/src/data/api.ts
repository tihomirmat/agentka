/**
 * The ONLY module screens import for data.
 *
 * Every function is async and returns a copy of the data, exactly like the future HTTP
 * API will (stage 2 swaps the bodies for fetch calls; names and shapes stay).
 * All reads and writes are scoped to the logged-in account, like the server will do.
 *
 * Actions that would call ElevenLabs, Google, Stripe or send e-mail are SIMULATED in
 * stage 1. They return an ActionResult whose `message` says so in plain Slovenian
 * ("Predogled: …"). Show that message to the person as it is — do not replace it with
 * a generic "Uspešno".
 */
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { BRAND } from '../brand';
import { formatNumber } from './format';
import { LEAD_STATUS, PAUSED_BY, PAUSED_BY_ADMIN } from './labels';
import {
  assistantNoun,
  DEFAULT_OWNER_TEMPLATE,
  DEFAULT_VISITOR_TEMPLATE,
  buildGenericWebsitePages,
  buildWebsitePages,
  createEmptyAccountBundle,
  createSampleDb,
  defaultFirstMessage,
  defaultInstructions,
  DEMO_SALON,
  LOGGED_OUT_SESSION,
  planByKey,
  SAMPLE_COST_PER_MINUTE_EUR,
  SAMPLE_LOGIN_USER,
  SAMPLE_VOICES,
  SPLETNOST_ID,
  TRIAL_DAYS,
  TRIAL_MINUTES,
  WIDGET_COLORS,
} from './sample';
import { getState, resetSampleData as resetStore, setState, useRevision, useStore } from './store';
import type {
  Account,
  ActionResult,
  AdminAccountDetail,
  AdminAccountRow,
  AdminErrorLine,
  Agent,
  AgentReadiness,
  Booking,
  BookingSettings,
  CalendarConnection,
  Conversation,
  ConversationCounts,
  Db,
  EmailLog,
  Id,
  InstallStatus,
  Invoice,
  KnowledgeSource,
  Lead,
  LeadStatus,
  NotificationSettings,
  OnboardingStep,
  OverviewStats,
  PausedBy,
  Plan,
  PlanKey,
  Session,
  TrialTerms,
  User,
  Voice,
} from './types';

export type * from './types';
/** Pure helpers screens may call directly (no request): the default greeting and its noun. */
export { WIDGET_COLORS, SAMPLE_VOICES, assistantNoun, defaultFirstMessage };

/**
 * The texts of the two e-mails every account starts with ("Ponastavi na privzeto besedilo").
 * The one copy — do not write the default texts out in a page.
 */
export const DEFAULT_EMAIL_TEMPLATES: { visitor: string; owner: string } = {
  visitor: DEFAULT_VISITOR_TEMPLATE,
  owner: DEFAULT_OWNER_TEMPLATE,
};

/* ------------------------------------------------------------------ basics */

const LATENCY_MS = 120;

/** Thrown by api functions. `message` is a finished Slovenian sentence you can show. */
export class ApiError extends Error {
  code: 'unauthenticated' | 'forbidden' | 'not_found' | 'invalid';
  constructor(code: ApiError['code'], message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Runs `fn` after the simulated network delay and returns a deep copy of its result. */
async function call<T>(fn: () => T, ms: number = LATENCY_MS): Promise<T> {
  await wait(ms);
  return structuredClone(fn());
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): Id {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1296)
    .toString(36)
    .padStart(2, '0')}`;
}

function simulated(message: string, ok = true): ActionResult {
  return { ok, message, simulated: true };
}

function done(message: string): ActionResult {
  return { ok: true, message, simulated: false };
}

/** The logged-in account and its agent; throws when nobody is logged in. */
function scope(db: Db = getState()) {
  if (!db.session.loggedIn) {
    throw new ApiError('unauthenticated', 'Niste prijavljeni. Prijavite se in poskusite znova.');
  }
  const accountId = db.session.accountId;
  const account = db.accounts.find((a) => a.id === accountId);
  const agent = db.agents.find((a) => a.account_id === accountId);
  if (!account || !agent) {
    throw new ApiError('not_found', 'Uporabniškega računa ni bilo mogoče najti. Prijavite se znova.');
  }
  return { db, accountId, account, agent };
}

function requireAdmin(db: Db = getState()): void {
  if (!db.session.loggedIn || db.session.role !== 'admin') {
    throw new ApiError('forbidden', 'Ta del je namenjen samo skrbniku platforme.');
  }
}

function patchAccount(id: Id, patch: Partial<Account>): void {
  setState((prev) => ({
    ...prev,
    accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  }));
}

function patchAgent(accountId: Id, patch: Partial<Agent>): void {
  setState((prev) => ({
    ...prev,
    agents: prev.agents.map((a) => (a.account_id === accountId ? { ...a, ...patch } : a)),
  }));
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * "www.Studio-Zala.si/cenik?x=1" → { url: "https://studio-zala.si", host: "studio-zala.si" };
 * null when it is not an address. ONE spelling of the host everywhere (no "www.", no path):
 * the field, the page rows, the allowed domain and the messages all show the same thing.
 */
function parseWebsite(input: string): { url: string; host: string } | null {
  let clean = input.trim();
  if (!clean) return null;
  if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
  try {
    const host = new URL(clean).hostname.toLowerCase().replace(/^www\./, '');
    if (!host.includes('.')) return null;
    return { url: `https://${host}`, host };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------ agent pauses */

/** The weightiest reason is the one shown; a failed payment outranks everything else. */
const PAUSE_PRIORITY: PausedBy[] = ['payment', 'limit', 'admin', 'customer'];

/**
 * Adds or lifts ONE pause reason and derives status and paused_by from what is left.
 * A draft agent stays a draft (there is nothing to pause yet); a paused agent becomes
 * active only when the last reason is gone — so lifting one pause never undoes another.
 */
function withPause(agent: Agent, reason: PausedBy, on: boolean): Agent {
  const rest = agent.pause_reasons.filter((r) => r !== reason);
  const reasons = on ? [...rest, reason] : rest;
  const main = PAUSE_PRIORITY.find((r) => reasons.includes(r)) ?? null;
  let status = agent.status;
  if (reasons.length > 0 && status !== 'draft') status = 'paused';
  if (reasons.length === 0 && status === 'paused') status = 'active';
  return { ...agent, pause_reasons: reasons, paused_by: status === 'paused' ? main : null, status };
}

function setPause(accountId: Id, reason: PausedBy, on: boolean): void {
  setState((prev) => ({
    ...prev,
    agents: prev.agents.map((a) => (a.account_id === accountId ? withPause(a, reason, on) : a)),
  }));
}

function includedSources(db: Db, accountId: Id): KnowledgeSource[] {
  return db.sources.filter((s) => s.account_id === accountId && s.included && s.status !== 'error');
}

/* ----------------------------------------------------------------- session */

/** Synchronous session for guards and shells. Screens may use it too. */
export function useSession(): Session {
  return useStore((db) => db.session);
}

export function getSession(): Promise<Session> {
  return call(() => getState().session);
}

/**
 * Stage 1: any non-empty e-mail and password signs in as the sample customer (with admin
 * access). The session carries the SAMPLE person's own address, never the typed one — the
 * name and the address under it always belong together.
 */
export async function login(email: string, password: string): Promise<Session> {
  await wait(LATENCY_MS * 3);
  if (!email.trim() || !password) {
    throw new ApiError('invalid', 'Vpišite e-naslov in geslo.');
  }
  if (!isEmail(email)) {
    throw new ApiError('invalid', 'E-naslov ni pravilno zapisan. Primer: ime@podjetje.si');
  }
  const session: Session = {
    loggedIn: true,
    role: 'admin',
    userName: SAMPLE_LOGIN_USER.name,
    email: SAMPLE_LOGIN_USER.email,
    accountId: SPLETNOST_ID,
    onboardingStep: 'done',
  };
  setState((prev) => ({ ...restoreSampleAccount(prev), session }));
  return structuredClone(session);
}

/** If the sample customer was deleted (deleteAccount), a new login brings it back fresh. */
function restoreSampleAccount(db: Db): Db {
  if (db.accounts.some((a) => a.id === SPLETNOST_ID)) return db;
  const fresh = createSampleDb();
  const mine = <T extends { account_id: Id }>(rows: T[]) => rows.filter((r) => r.account_id === SPLETNOST_ID);
  return {
    ...db,
    accounts: [...fresh.accounts.filter((a) => a.id === SPLETNOST_ID), ...db.accounts],
    users: [...mine(fresh.users), ...db.users],
    agents: [...mine(fresh.agents), ...db.agents],
    bookingSettings: [...mine(fresh.bookingSettings), ...db.bookingSettings],
    calendarConnections: [...mine(fresh.calendarConnections), ...db.calendarConnections],
    notificationSettings: [...mine(fresh.notificationSettings), ...db.notificationSettings],
    sources: [...mine(fresh.sources), ...db.sources],
    conversations: [...mine(fresh.conversations), ...db.conversations],
    leads: [...mine(fresh.leads), ...db.leads],
    bookings: [...mine(fresh.bookings), ...db.bookings],
    emailLog: [...mine(fresh.emailLog), ...db.emailLog],
    invoices: [...mine(fresh.invoices), ...db.invoices],
    installCodeCopied: { ...db.installCodeCopied, [SPLETNOST_ID]: true },
  };
}

export async function logout(): Promise<void> {
  await wait(LATENCY_MS);
  setState((prev) => ({ ...prev, session: { ...LOGGED_OUT_SESSION } }));
}

export interface RegisterInput {
  /** the person's own first and last name */
  ownerName: string;
  businessName: string;
  /** with or without https://; may be empty — the wizard asks again in step 1 */
  website: string;
  email: string;
  password: string;
}

/**
 * Stage 1: creates a new, empty trial account in the browser and starts the wizard at step 1.
 * Everything the sign-up form asks is saved in this one call: the person's name becomes the
 * owner (never the business name), the website lands on the account and its domain becomes
 * the allowed domain of the widget.
 */
export async function register(input: RegisterInput): Promise<Session> {
  await wait(LATENCY_MS * 3);
  if (!input.ownerName.trim()) {
    throw new ApiError('invalid', 'Vpišite svoje ime in priimek.');
  }
  if (!input.businessName.trim()) {
    throw new ApiError('invalid', 'Vpišite ime podjetja.');
  }
  const site = input.website.trim() ? parseWebsite(input.website) : { url: '', host: '' };
  if (!site) {
    throw new ApiError('invalid', 'Naslov spletne strani ni pravilno zapisan. Primer: vasepodjetje.si');
  }
  if (!isEmail(input.email)) {
    throw new ApiError('invalid', 'E-naslov ni pravilno zapisan. Primer: ime@podjetje.si');
  }
  if (input.password.length < 8) {
    throw new ApiError('invalid', 'Geslo naj ima vsaj 8 znakov.');
  }
  const bundle = createEmptyAccountBundle({
    businessName: input.businessName.trim(),
    userName: input.ownerName.trim(),
    email: input.email.trim(),
    websiteUrl: site.url,
    allowedDomain: site.host,
  });
  const session: Session = {
    loggedIn: true,
    role: 'customer',
    userName: bundle.user.name,
    email: bundle.user.email,
    accountId: bundle.account.id,
    onboardingStep: 1,
  };
  setState((prev) => ({
    ...prev,
    session,
    accounts: [...prev.accounts, bundle.account],
    users: [...prev.users, bundle.user],
    agents: [...prev.agents, bundle.agent],
    bookingSettings: [...prev.bookingSettings, bundle.bookingSettings],
    notificationSettings: [...prev.notificationSettings, bundle.notifications],
  }));
  return structuredClone(session);
}

/**
 * Saves how far the person got in the wizard.
 *
 * Finishing it ('done') ALSO switches the agent on — when it has at least one included
 * knowledge source. Without one the agent stays an "Osnutek": an agent that knows nothing
 * must not go live by accident. Ask api.getAgentReadiness() what is missing and show it.
 */
export function setOnboardingStep(step: OnboardingStep): Promise<Session> {
  return call(() => {
    const { db, accountId, agent } = scope();
    const activate = step === 'done' && agent.status === 'draft' && includedSources(db, accountId).length > 0;
    setState((prev) => ({
      ...prev,
      session: { ...prev.session, onboardingStep: step },
      agents: activate
        ? prev.agents.map((a) => (a.account_id === accountId ? { ...a, status: 'active' as const } : a))
        : prev.agents,
    }));
    return getState().session;
  });
}

/** Throws away every change made in this browser and loads fresh sample data. */
export function resetSampleData(): Promise<ActionResult> {
  return call(() => {
    resetStore();
    return done('Vzorčni podatki so ponastavljeni.');
  });
}

/* ----------------------------------------------------------------- account */

export function getAccount(): Promise<Account> {
  return call(() => scope().account);
}

export type AccountPatch = Partial<Pick<Account, 'name' | 'website_url' | 'language' | 'timezone'>>;

export function updateAccount(patch: AccountPatch): Promise<Account> {
  return call(() => {
    const { accountId } = scope();
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new ApiError('invalid', 'Ime podjetja ne sme biti prazno.');
    }
    const clean: AccountPatch = { ...patch };
    if (clean.website_url !== undefined && clean.website_url.trim()) {
      const site = parseWebsite(clean.website_url);
      if (!site) {
        throw new ApiError('invalid', 'Naslov spletne strani ni pravilno zapisan. Primer: vasepodjetje.si');
      }
      clean.website_url = site.url;
    }
    patchAccount(accountId, clean);
    if (patch.name !== undefined) patchAgent(accountId, { business_name: patch.name });
    return scope().account;
  });
}

/**
 * Deletes the logged-in account with everything that belongs to it and ends the session
 * (the caller is logged out; the route guard then leads to Prijava). In stage 1 "everything"
 * is the sample store of this browser; the sample customer comes back at the next login.
 */
export function deleteAccount(): Promise<ActionResult> {
  return call(() => {
    const { accountId, account } = scope();
    const others = <T extends { account_id: Id }>(rows: T[]) => rows.filter((r) => r.account_id !== accountId);
    setState((prev) => {
      const { [accountId]: _gone, ...installCodeCopied } = prev.installCodeCopied;
      return {
        ...prev,
        session: { ...LOGGED_OUT_SESSION },
        accounts: prev.accounts.filter((a) => a.id !== accountId),
        users: others(prev.users),
        agents: others(prev.agents),
        bookingSettings: others(prev.bookingSettings),
        calendarConnections: others(prev.calendarConnections),
        notificationSettings: others(prev.notificationSettings),
        sources: others(prev.sources),
        conversations: others(prev.conversations),
        leads: others(prev.leads),
        bookings: others(prev.bookings),
        emailLog: others(prev.emailLog),
        invoices: others(prev.invoices),
        installCodeCopied,
      };
    });
    return simulated(
      `Predogled: uporabniški račun ${account.name} je izbrisan iz vzorčnih podatkov v tem brskalniku in odjavljeni ste. V polni različici se trajno izbrišejo agent, viri znanja, pogovori, kontakti in rezervacije.`,
    );
  });
}

export function listTeam(): Promise<User[]> {
  return call(() => {
    const { db, accountId } = scope();
    return db.users.filter((u) => u.account_id === accountId);
  });
}

export function inviteMember(email: string): Promise<ActionResult> {
  return call(() => {
    const { db, accountId } = scope();
    const address = email.trim();
    if (!isEmail(address)) {
      throw new ApiError('invalid', 'E-naslov ni pravilno zapisan. Primer: ime@podjetje.si');
    }
    if (db.users.some((u) => u.account_id === accountId && u.email === address)) {
      throw new ApiError('invalid', 'Ta oseba je že na seznamu.');
    }
    const user: User = {
      id: newId('usr'),
      account_id: accountId,
      // Until the invitation is accepted we know nothing but the address, so it is the name too.
      name: address,
      email: address,
      account_role: 'member',
      status: 'invited',
      created_at: nowIso(),
    };
    setState((prev) => ({ ...prev, users: [...prev.users, user] }));
    return simulated(
      `Predogled: ${address} je dodan na seznam, vabilo pa ni bilo poslano. V polni različici oseba prejme e-pošto s povezavo za dostop.`,
    );
  });
}

export function removeMember(id: Id): Promise<ActionResult> {
  return call(() => {
    const { db, accountId } = scope();
    const user = db.users.find((u) => u.id === id && u.account_id === accountId);
    if (!user) throw new ApiError('not_found', 'Te osebe ni več na seznamu.');
    if (user.account_role === 'owner') {
      throw new ApiError('invalid', 'Lastnika uporabniškega računa ni mogoče odstraniti.');
    }
    setState((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== id) }));
    return done(`${user.name} nima več dostopa do uporabniškega računa.`);
  });
}

/* ------------------------------------------------------------------- agent */

export function getAgent(): Promise<Agent> {
  return call(() => scope().agent);
}

export type AgentPatch = Partial<
  Pick<
    Agent,
    | 'name'
    | 'business_name'
    | 'voice_id'
    | 'language'
    | 'first_message'
    | 'instructions'
    | 'status'
    | 'allowed_domain'
    | 'widget_accent_color'
    | 'widget_text_input'
    | 'widget_position'
    | 'auto_sync_days'
  >
>;

/**
 * `status` in a patch is understood as the CUSTOMER's own switch:
 *   'paused' → pauseAgent(),  'active' → resumeAgent() (or activateAgent() for a draft).
 * It can therefore fail with a readable sentence, e.g. when a failed payment still holds
 * the agent. Prefer the explicit functions below in new code.
 */
export function updateAgent(patch: AgentPatch): Promise<Agent> {
  return call(() => {
    const { accountId, agent } = scope();
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new ApiError('invalid', 'Ime agenta ne sme biti prazno.');
    }
    const { status, ...clean }: AgentPatch = { ...patch };
    if (clean.allowed_domain !== undefined) {
      clean.allowed_domain = clean.allowed_domain
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '');
    }
    if (status !== undefined && status !== agent.status) {
      if (status === 'paused') pauseNow();
      else if (status === 'active') switchOnNow();
      else throw new ApiError('invalid', 'Tega stanja agenta ni mogoče nastaviti ročno.');
    }
    // Instructions that are still the generated ones follow the voice ("Ste AI pomočnik" /
    // "AI pomočnica"), like the greeting does; instructions the person wrote are left alone.
    if (
      clean.voice_id !== undefined &&
      clean.voice_id !== agent.voice_id &&
      clean.instructions === undefined &&
      agent.instructions === defaultInstructions(agent.business_name, agent.voice_id)
    ) {
      clean.instructions = defaultInstructions(clean.business_name ?? agent.business_name, clean.voice_id);
    }
    patchAgent(accountId, clean);
    return scope().agent;
  });
}

/* ---- switching the agent on and off (customer side) ---- */

const NO_SOURCES_TEXT =
  'Agent še nima nobenega vključenega vira znanja, zato obiskovalcem ne bi znal odgovoriti.';

/** What is still missing before the agent may go live. Today: at least one included source. */
export function getAgentReadiness(): Promise<AgentReadiness> {
  return call(() => {
    const { db, accountId, agent } = scope();
    const missing: AgentReadiness['missing'] = [];
    if (includedSources(db, accountId).length === 0) {
      missing.push({
        key: 'sources',
        title: 'Viri znanja',
        text: NO_SOURCES_TEXT,
        action: { label: 'Dodaj vire znanja', to: '/app/viri' },
      });
    }
    return { status: agent.status, canActivate: missing.length === 0, missing };
  });
}

function stillHeldBy(agent: Agent): string {
  const reason = agent.paused_by;
  return reason ? `Agent ostaja ustavljen. ${PAUSED_BY[reason].help}` : 'Agent ostaja ustavljen.';
}

function switchOnNow(): ActionResult {
  const { db, accountId, agent } = scope();
  if (agent.status === 'active') return done('Agent je že aktiven.');
  if (includedSources(db, accountId).length === 0) {
    throw new ApiError(
      'invalid',
      `Agenta še ni mogoče vklopiti. ${NO_SOURCES_TEXT} Dodajte spletno stran, datoteko ali besedilo v razdelku Viri znanja.`,
    );
  }
  if (agent.status === 'paused') {
    setPause(accountId, 'customer', false);
    const after = scope().agent;
    if (after.status === 'paused') throw new ApiError('invalid', stillHeldBy(after));
    return simulated(
      'Predogled: agent je znova označen kot aktiven. V polni različici od tega trenutka spet odgovarja obiskovalcem.',
    );
  }
  // draft or error → active (other pauses, if any, come into force at once)
  setState((prev) => ({
    ...prev,
    agents: prev.agents.map((a) => {
      if (a.account_id !== accountId) return a;
      const main = PAUSE_PRIORITY.find((r) => a.pause_reasons.includes(r)) ?? null;
      return main ? { ...a, status: 'paused' as const, paused_by: main } : { ...a, status: 'active' as const };
    }),
  }));
  const after = scope().agent;
  if (after.status === 'paused') throw new ApiError('invalid', stillHeldBy(after));
  return simulated(
    'Predogled: agent je označen kot aktiven. V polni različici od tega trenutka odgovarja obiskovalcem na spletni strani, kjer je nameščen pripomoček.',
  );
}

function pauseNow(): ActionResult {
  const { accountId, agent } = scope();
  if (agent.status === 'draft') {
    throw new ApiError('invalid', 'Agent je še osnutek in ne odgovarja obiskovalcem, zato ga ni treba ustaviti.');
  }
  setPause(accountId, 'customer', true);
  return simulated(
    'Predogled: agent je označen kot začasno ustavljen. V polni različici pripomoček obiskovalcem pove, da pomočnik trenutno ni na voljo.',
  );
}

/**
 * "Vklopi agenta": a draft becomes active. Refuses with a readable sentence when the agent
 * has no included knowledge source (see getAgentReadiness).
 */
export function activateAgent(): Promise<ActionResult> {
  return call(() => switchOnNow(), 400);
}

/** The customer's own pause. It is lifted only by resumeAgent(), never by the admin or a payment. */
export function pauseAgent(): Promise<ActionResult> {
  return call(() => pauseNow(), 400);
}

/**
 * Lifts the customer's own pause. If something else still holds the agent (failed payment,
 * used-up minutes, a pause by the platform admin), it throws and says which one and what ends it.
 */
export function resumeAgent(): Promise<ActionResult> {
  return call(() => switchOnNow(), 400);
}

export function listVoices(): Promise<Voice[]> {
  return call(() => SAMPLE_VOICES);
}

/* ---- sample replies of the widget preview ---- */

export interface AgentReply {
  text: string;
  simulated: true;
}

const DONT_KNOW = 'Tega podatka nimam. Želite, da vas pokličemo?';
const PRICE_STOP = new Set(['koliko', 'stane', 'stanejo', 'cena', 'cene', 'ceno', 'cenik', 'kaksna', 'kakšna', 'vasa', 'vaša', 'prosim', 'zanima']);

function stem(word: string): string {
  return word.slice(0, 5);
}

/** Lines of a price list of the form "Storitev: cena". */
function priceLines(text: string): { label: string; line: string }[] {
  return text
    .split('\n')
    .map((l) => l.trim().replace(/[.;]$/, ''))
    .filter((l) => /^[^:]{3,60}:\s*\S/.test(l) && /(\d|brezplač)/i.test(l))
    .map((line) => ({ label: line.slice(0, line.indexOf(':')), line }));
}

function answerPrice(question: string, sources: KnowledgeSource[]): string {
  const list = sources.find((s) => s.type === 'text' && s.content && /cenik|cene/i.test(s.title));
  const lines = list?.content ? priceLines(list.content) : [];
  if (lines.length === 0) return DONT_KNOW;
  const wanted = question
    .toLowerCase()
    .split(/[^a-zčšžćđ0-9]+/i)
    .filter((w) => w.length >= 4 && !PRICE_STOP.has(w))
    .map(stem);
  let best: { line: string; score: number } | null = null;
  for (const l of lines) {
    const label = l.label.toLowerCase();
    const score = wanted.filter((w) => label.includes(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { line: l.line, score };
  }
  if (best) return `V našem ceniku piše: »${best.line}«. Vam lahko pomagam še s čim?`;
  const some = lines.slice(0, 3).map((l) => l.line).join('; ');
  return `Cena je odvisna od storitve. Iz našega cenika: ${some}. Za katero storitev vas zanima cena?`;
}

/**
 * Reply of the agent in the IN-APP test widget (Pregled, wizard step 5, Namestitev).
 * Stage 1 has no ElevenLabs, so the sentence is picked by keyword — but it is always what the
 * VISITOR would hear, in the business's voice, and it uses the account's own sources where
 * it can: a price question is answered from an included text source called "Cenik …";
 * a wish for an appointment follows the account's booking mode. What is not in the sources
 * gets the agent's honest "Tega podatka nimam."
 * The landing page has its own demo: demoAgentReply.
 */
export function previewAgentReply(question: string): Promise<AgentReply> {
  return call(() => {
    const db = getState();
    const loggedIn = db.session.loggedIn;
    const agent = loggedIn ? db.agents.find((a) => a.account_id === db.session.accountId) : undefined;
    const sources = agent ? includedSources(db, agent.account_id) : [];
    const mode = agent ? db.bookingSettings.find((b) => b.account_id === agent.account_id)?.mode : undefined;
    const q = question.toLowerCase();
    let text = DONT_KNOW;
    if (/(cen|stane|koliko|drag|plača)/.test(q)) {
      text = answerPrice(question, sources);
    } else if (/(termin|sestan|posvet|rezerv|naroč)/.test(q)) {
      text =
        mode === 'auto'
          ? 'Z veseljem vam poiščem prost termin. Kateri dan vam najbolj ustreza?'
          : 'Lahko zapišem vašo željo za termin, potrdili vam jo bomo po e-pošti. Kateri dan in ura vam ustrezata?';
    } else if (/(kdo si|kdo ste|robot|človek|umetna|\bai\b)/.test(q)) {
      text = agent
        ? `Sem ${agent.name}, ${assistantNoun(agent.voice_id)} podjetja ${agent.business_name}. Nisem človek, odgovarjam pa iz vsebine naše spletne strani.`
        : 'Sem AI pomočnik, ne človek.';
    } else if (/(kontakt|telefon|poklič|kje ste|naslov|e-pošt|mail)/.test(q)) {
      text = sources.some((s) => s.type === 'website_page' && /kontakt/i.test(s.title))
        ? 'Podatke za stik najdete na naši strani Kontakt. Lahko pa mi pustite svojo telefonsko številko in vas pokličemo.'
        : DONT_KNOW;
    } else if (/(hvala|adijo|nasvidenje|lep dan)/.test(q)) {
      text = 'Prosim. Lep dan želim!';
    } else if (/(živjo|zdravo|pozdrav|dober dan)/.test(q)) {
      text = 'Pozdravljeni. Kaj vas zanima?';
    }
    return { text, simulated: true as const };
  }, 700);
}

/** Where the scripted landing-page conversation stands; pass it back with the next question. */
export type DemoState = 'slot' | 'name' | 'contact';

export interface DemoReply extends AgentReply {
  /** undefined = no step is open */
  state?: DemoState;
}

/**
 * Reply of the landing-page demo: the assistant of the FICTIONAL "Frizerski salon Lana".
 * Works without a login. The salon, its prices, hours, address and free times are invented
 * sample content (sample.ts → DEMO_SALON); nothing is booked and nothing typed is stored.
 * The conversation can run the whole way a real one does — price, opening hours, two offered
 * times, name, typed e-mail — and ends by saying plainly that this was a demonstration.
 */
export function demoAgentReply(question: string, state?: DemoState): Promise<DemoReply> {
  return call((): DemoReply => {
    const d = DEMO_SALON;
    const q = question.toLowerCase().trim();
    const reply = (text: string, next?: DemoState): DemoReply => ({ text, simulated: true, state: next });
    const wantsBooking = /(termin|rezerv|naroč|prost|kdaj lahko pridem|pridem)/.test(q);

    if (state === 'contact') {
      return reply(
        'Hvala. V pravem pogovoru bi zdaj termin vpisal v koledar salona in vam poslal potrditev. To je predstavitev: termin ni rezerviran in vaših podatkov nismo shranili.',
      );
    }
    if (state === 'name' && q.length > 1 && !q.includes('?')) {
      return reply(
        `Hvala, ${question.trim().replace(/[.!]+$/, '')}. Prosim, vpišite še e-naslov, kamor pošljemo potrditev. V tej predstavitvi je lahko izmišljen.`,
        'contact',
      );
    }
    if (state === 'slot') {
      const first = /(prv|9|devet|jutri)/.test(q);
      const second = /(drug|11|enajst|sobot)/.test(q);
      if (first || second) {
        return reply(`Dobro, ${first ? d.slots[0] : d.slots[1]}. Kako vam je ime?`, 'name');
      }
      if (/(ne ustreza|noben|drugi dan|kasneje|popoldne)/.test(q)) {
        return reply(
          'Drugih prostih terminov ta teden nimam. Lahko zapišem vašo željo in salon vam jo potrdi po e-pošti. Kako vam je ime?',
          'name',
        );
      }
    }

    if (wantsBooking) {
      return reply(`Prosta termina sta ${d.slots[0]} in ${d.slots[1]}. Kateri vam ustreza?`, 'slot');
    }
    if (/(cen|stane|koliko|drag|plača)/.test(q)) {
      const hit = d.prices.find((p) => p.match.test(q));
      if (hit) return reply(`${hit.sentence} Vam poiščem prost termin?`);
      return reply(`${d.priceSummary} Katera storitev vas zanima?`);
    }
    if (/(odprt|delovni čas|delate|urnik|do kdaj|od kdaj|sobot|nedelj)/.test(q)) {
      return reply(d.hours);
    }
    if (/(kje|naslov|lokacij|parkir|kako pridem)/.test(q)) {
      return reply(d.address);
    }
    if (/(kdo si|kdo ste|robot|človek|umetna|\bai\b)/.test(q)) {
      return reply(`Sem AI pomočnik, ne človek. Odgovarjam iz vsebine spletne strani salona ${d.shortName}.`);
    }
    if (/(hvala|adijo|nasvidenje|lep dan)/.test(q)) {
      return reply('Prosim. Lep dan želim!');
    }
    if (/(živjo|zdravo|pozdrav|dober dan)/.test(q)) {
      return reply('Pozdravljeni. Vas zanimajo cene, delovni čas ali prost termin?');
    }
    return reply('Tega podatka nimam. Želite, da vas pokličemo? Pustite ime in telefonsko številko.');
  }, 700);
}

/* --------------------------------------------------------------- knowledge */

export function listSources(): Promise<KnowledgeSource[]> {
  return call(() => {
    const { db, accountId } = scope();
    return db.sources.filter((s) => s.account_id === accountId);
  });
}

export function toggleSource(id: Id, included: boolean): Promise<KnowledgeSource> {
  return call(() => {
    const { db, accountId } = scope();
    const source = db.sources.find((s) => s.id === id && s.account_id === accountId);
    if (!source) throw new ApiError('not_found', 'Tega vira ni več na seznamu.');
    setState((prev) => ({
      ...prev,
      sources: prev.sources.map((s) =>
        s.id === id
          ? {
              ...s,
              included,
              status: included ? 'pending' : 'excluded',
              error: null,
              // The person decided for themselves; the import's suggestion no longer applies.
              note: null,
            }
          : s,
      ),
    }));
    // The real sync is asynchronous; here the row settles after a moment.
    if (included) {
      window.setTimeout(() => {
        setState((prev) => ({
          ...prev,
          sources: prev.sources.map((s) =>
            s.id === id && s.status === 'pending'
              ? { ...s, status: 'synced', last_synced_at: nowIso() }
              : s,
          ),
        }));
      }, 1200);
    }
    return getState().sources.find((s) => s.id === id) as KnowledgeSource;
  });
}

function addSource(partial: Pick<KnowledgeSource, 'type' | 'title' | 'content' | 'file_url' | 'chars'>) {
  const { accountId, agent } = scope();
  const source: KnowledgeSource = {
    id: newId('src'),
    account_id: accountId,
    agent_id: agent.id,
    url: null,
    included: true,
    status: 'synced',
    elevenlabs_doc_id: null,
    last_synced_at: nowIso(),
    error: null,
    note: null,
    ...partial,
  };
  setState((prev) => ({ ...prev, sources: [...prev.sources, source] }));
  return source;
}

export function addTextSource(input: { title: string; content: string }): Promise<KnowledgeSource> {
  return call(() => {
    if (!input.title.trim()) throw new ApiError('invalid', 'Vpišite naslov besedila.');
    if (!input.content.trim()) throw new ApiError('invalid', 'Vpišite besedilo, ki naj ga agent pozna.');
    return addSource({
      type: 'text',
      title: input.title.trim(),
      content: input.content,
      file_url: null,
      chars: input.content.length,
    });
  });
}

export function updateTextSource(
  id: Id,
  input: { title: string; content: string },
): Promise<KnowledgeSource> {
  return call(() => {
    const { db, accountId } = scope();
    const source = db.sources.find(
      (s) => s.id === id && s.account_id === accountId && s.type === 'text',
    );
    if (!source) throw new ApiError('not_found', 'Tega besedila ni več na seznamu.');
    if (!input.title.trim()) throw new ApiError('invalid', 'Vpišite naslov besedila.');
    setState((prev) => ({
      ...prev,
      sources: prev.sources.map((s) =>
        s.id === id
          ? {
              ...s,
              title: input.title.trim(),
              content: input.content,
              chars: input.content.length,
              last_synced_at: nowIso(),
            }
          : s,
      ),
    }));
    return getState().sources.find((s) => s.id === id) as KnowledgeSource;
  });
}

/** Stage 1 keeps only the file name; the file itself is not uploaded anywhere. */
export function addFileSource(name: string, sizeBytes = 0): Promise<KnowledgeSource> {
  return call(() => {
    const clean = name.trim();
    if (!/\.(pdf|docx|txt)$/i.test(clean)) {
      throw new ApiError('invalid', 'Dodate lahko datoteke PDF, DOCX ali TXT.');
    }
    return addSource({
      type: 'file',
      title: clean,
      content: null,
      file_url: `sample://files/${clean}`,
      chars: sizeBytes > 0 ? Math.round(sizeBytes / 6) : 4200,
    });
  });
}

export function removeSource(id: Id): Promise<ActionResult> {
  return call(() => {
    const { db, accountId } = scope();
    const source = db.sources.find((s) => s.id === id && s.account_id === accountId);
    if (!source) throw new ApiError('not_found', 'Tega vira ni več na seznamu.');
    setState((prev) => ({ ...prev, sources: prev.sources.filter((s) => s.id !== id) }));
    return done(`Vir »${source.title}« je odstranjen. Agent ga ne uporablja več.`);
  });
}

/** Re-reads the included website pages. Simulated: pages go to "pending", then "synced". */
export async function syncWebsite(): Promise<ActionResult> {
  await wait(LATENCY_MS);
  const { accountId, db } = scope();
  const pages = db.sources.filter(
    (s) => s.account_id === accountId && s.type === 'website_page' && s.included,
  );
  if (pages.length === 0) {
    throw new ApiError(
      'invalid',
      'Ni strani, ki bi jih agent lahko znova prebral. Najprej uvozite spletno stran ali vključite vsaj eno stran.',
    );
  }
  const ids = new Set(pages.map((p) => p.id));
  setState((prev) => ({
    ...prev,
    sources: prev.sources.map((s) => (ids.has(s.id) ? { ...s, status: 'pending', error: null } : s)),
  }));
  await wait(1600);
  const at = nowIso();
  setState((prev) => ({
    ...prev,
    sources: prev.sources.map((s) =>
      ids.has(s.id) && s.status === 'pending' ? { ...s, status: 'synced', last_synced_at: at } : s,
    ),
    agents: prev.agents.map((a) => (a.account_id === accountId ? { ...a, last_sync_at: at } : a)),
  }));
  return simulated(
    `Predogled: strani niso bile znova prebrane. V polni različici agent ob tem prebere trenutno vsebino vseh vključenih strani (zdaj jih je ${formatNumber(pages.length)}).`,
  );
}

/**
 * Wizard step 1 and "Uvozi stran". Simulated — no website is read in stage 1:
 *  - the sample customer (Spletnost) gets its own stored page list back;
 *  - EVERY other account gets a neutral list built from the entered domain (Domov, Storitve,
 *    Cenik, O nas, Kontakt, two blog posts, and the two legal pages pre-excluded with the
 *    reason in `note`). Never another business's pages.
 * The host is written one way everywhere (without "www."), in the rows and in the message.
 */
export async function importWebsite(url: string): Promise<ActionResult> {
  await wait(LATENCY_MS);
  const { accountId, agent } = scope();
  if (!url.trim()) throw new ApiError('invalid', 'Vpišite naslov spletne strani, na primer vasepodjetje.si');
  const site = parseWebsite(url);
  if (!site) {
    throw new ApiError('invalid', 'Naslov spletne strani ni pravilno zapisan. Primer: vasepodjetje.si');
  }
  const base = site.url;
  const host = site.host;
  const prefix = newId('imp');
  const isSample = accountId === SPLETNOST_ID;
  const build = isSample ? buildWebsitePages : buildGenericWebsitePages;
  const pages = build(accountId, agent.id, base, null, prefix).map((p) =>
    p.included ? { ...p, status: 'pending' as const } : p,
  );
  setState((prev) => ({
    ...prev,
    accounts: prev.accounts.map((a) => (a.id === accountId ? { ...a, website_url: base } : a)),
    agents: prev.agents.map((a) =>
      a.account_id === accountId ? { ...a, allowed_domain: a.allowed_domain || host } : a,
    ),
    sources: [
      ...prev.sources.filter((s) => !(s.account_id === accountId && s.type === 'website_page')),
      ...pages,
    ],
  }));
  await wait(1800);
  const at = nowIso();
  setState((prev) => ({
    ...prev,
    sources: prev.sources.map((s) =>
      s.id.startsWith(prefix) && s.status === 'pending'
        ? { ...s, status: 'synced', last_synced_at: at }
        : s,
    ),
    agents: prev.agents.map((a) => (a.account_id === accountId ? { ...a, last_sync_at: at } : a)),
  }));
  return simulated(
    isSample
      ? `Predogled: strani ${host} nismo znova prebrali. Prikazan je shranjeni vzorčni seznam ${formatNumber(pages.length)} strani. V polni različici agent poišče in prebere vse strani na tem naslovu.`
      : `Predogled: strani ${host} nismo zares prebrali. Prikazan je vzorčni seznam ${formatNumber(pages.length)} strani, kakršne ima običajna spletna stran podjetja. V polni različici bo tukaj seznam vaših strani.`,
  );
}

/* ----------------------------------------------------------------- booking */

export function getBookingSettings(): Promise<BookingSettings> {
  return call(() => {
    const { db, accountId } = scope();
    const settings = db.bookingSettings.find((b) => b.account_id === accountId);
    if (!settings) throw new ApiError('not_found', 'Nastavitev terminov ni bilo mogoče naložiti.');
    return settings;
  });
}

export type BookingSettingsPatch = Partial<Omit<BookingSettings, 'account_id' | 'agent_id'>>;

export function updateBookingSettings(patch: BookingSettingsPatch): Promise<BookingSettings> {
  return call(() => {
    const { db, accountId } = scope();
    if (patch.mode === 'auto' && !db.calendarConnections.some((c) => c.account_id === accountId)) {
      throw new ApiError(
        'invalid',
        'Za samodejno rezervacijo najprej povežite Google Koledar. Brez koledarja agent ne ve, kdaj ste prosti.',
      );
    }
    setState((prev) => ({
      ...prev,
      bookingSettings: prev.bookingSettings.map((b) =>
        b.account_id === accountId ? { ...b, ...patch } : b,
      ),
    }));
    return getState().bookingSettings.find((b) => b.account_id === accountId) as BookingSettings;
  });
}

/** null when no calendar is connected. */
export function getCalendarConnection(): Promise<CalendarConnection | null> {
  return call(() => {
    const { db, accountId } = scope();
    return db.calendarConnections.find((c) => c.account_id === accountId) ?? null;
  });
}

export async function connectCalendar(): Promise<ActionResult> {
  await wait(900);
  const { accountId } = scope();
  const connection: CalendarConnection = {
    account_id: accountId,
    provider: 'google',
    connected_email:
      accountId === SPLETNOST_ID ? 'koledar.spletnost@example.com' : 'koledar@example.com',
    status: 'connected',
    connected_at: nowIso(),
    calendars: [
      { id: 'primary', name: 'Glavni koledar' },
      { id: 'cal_team', name: 'Ekipa' },
    ],
  };
  setState((prev) => ({
    ...prev,
    calendarConnections: [
      ...prev.calendarConnections.filter((c) => c.account_id !== accountId),
      connection,
    ],
    bookingSettings: prev.bookingSettings.map((b) =>
      b.account_id === accountId ? { ...b, calendar_id: b.calendar_id ?? 'primary' } : b,
    ),
  }));
  return simulated(
    `Predogled: Google Koledar ni bil zares povezan, prikazan je vzorčni naslov ${connection.connected_email}. V polni različici se prijavite v svoj Google račun in izberete koledar.`,
  );
}

export async function disconnectCalendar(): Promise<ActionResult> {
  await wait(500);
  const { accountId } = scope();
  setState((prev) => ({
    ...prev,
    calendarConnections: prev.calendarConnections.filter((c) => c.account_id !== accountId),
    bookingSettings: prev.bookingSettings.map((b) =>
      b.account_id === accountId ? { ...b, mode: 'request', calendar_id: null } : b,
    ),
  }));
  return simulated(
    'Predogled: koledar je odklopljen samo v vzorčnih podatkih. V polni različici agent po odklopu ne vidi več vašega koledarja: želene termine zapiše, potrdite jih sami.',
  );
}

/* ----------------------------------------------------------- notifications */

export function getNotificationSettings(): Promise<NotificationSettings> {
  return call(() => {
    const { db, accountId } = scope();
    const settings = db.notificationSettings.find((n) => n.account_id === accountId);
    if (!settings) throw new ApiError('not_found', 'Nastavitev obvestil ni bilo mogoče naložiti.');
    return settings;
  });
}

export type NotificationSettingsPatch = Partial<Omit<NotificationSettings, 'account_id'>>;

export function updateNotificationSettings(
  patch: NotificationSettingsPatch,
): Promise<NotificationSettings> {
  return call(() => {
    const { accountId } = scope();
    if (patch.notify_email !== undefined && !isEmail(patch.notify_email)) {
      throw new ApiError('invalid', 'E-naslov za obvestila ni pravilno zapisan. Primer: info@podjetje.si');
    }
    if (patch.reply_to !== undefined && patch.reply_to.trim() && !isEmail(patch.reply_to)) {
      throw new ApiError('invalid', 'Naslov za odgovore ni pravilno zapisan. Primer: info@podjetje.si');
    }
    setState((prev) => ({
      ...prev,
      notificationSettings: prev.notificationSettings.map((n) =>
        n.account_id === accountId ? { ...n, ...patch } : n,
      ),
    }));
    return getState().notificationSettings.find(
      (n) => n.account_id === accountId,
    ) as NotificationSettings;
  });
}

export async function sendTestEmail(): Promise<ActionResult> {
  await wait(800);
  const { db, accountId } = scope();
  const settings = db.notificationSettings.find((n) => n.account_id === accountId);
  if (!settings || !isEmail(settings.notify_email)) {
    throw new ApiError('invalid', 'Najprej vpišite in shranite e-naslov za obvestila.');
  }
  const row: EmailLog = {
    id: newId('mail'),
    account_id: accountId,
    conversation_id: null,
    kind: 'test',
    to: settings.notify_email,
    subject: 'Testno sporočilo',
    status: 'sent',
    error: null,
    sent_at: nowIso(),
  };
  setState((prev) => ({ ...prev, emailLog: [...prev.emailLog, row] }));
  return simulated(
    `Predogled: testno sporočilo na ${settings.notify_email} ni bilo poslano. V polni različici ga prejmete v svoj poštni predal.`,
  );
}

/* ----------------------------------------------------------- conversations */

export function listConversations(): Promise<Conversation[]> {
  return call(() => {
    const { db, accountId } = scope();
    return db.conversations
      .filter((c) => c.account_id === accountId)
      .sort((a, b) => b.started_at.localeCompare(a.started_at));
  });
}

/** null when the conversation does not exist or belongs to another account. */
export function getConversation(id: Id): Promise<Conversation | null> {
  return call(() => {
    const { db, accountId } = scope();
    return db.conversations.find((c) => c.id === id && c.account_id === accountId) ?? null;
  });
}

export function listEmailLog(conversationId: Id): Promise<EmailLog[]> {
  return call(() => {
    const { db, accountId } = scope();
    return db.emailLog
      .filter((e) => e.account_id === accountId && e.conversation_id === conversationId)
      .sort((a, b) => a.sent_at.localeCompare(b.sent_at));
  });
}

/* ------------------------------------------------------------------- leads */

export function listLeads(): Promise<Lead[]> {
  return call(() => {
    const { db, accountId } = scope();
    return db.leads
      .filter((l) => l.account_id === accountId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  });
}

export function updateLeadStatus(id: Id, status: LeadStatus): Promise<Lead> {
  return call(() => {
    const { db, accountId } = scope();
    if (!db.leads.some((l) => l.id === id && l.account_id === accountId)) {
      throw new ApiError('not_found', 'Tega kontakta ni več na seznamu.');
    }
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
    return getState().leads.find((l) => l.id === id) as Lead;
  });
}

/**
 * CSV text of all contacts (separator ";", ready for Excel). Downloads are not allowed
 * in the preview, so show the text in a dialog with a CopyButton.
 */
export function exportLeadsCsv(): Promise<{ csv: string; rows: number }> {
  return call(() => {
    const { db, accountId } = scope();
    const leads = db.leads.filter((l) => l.account_id === accountId);
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      ['Ime', 'E-naslov', 'Telefon', 'Kaj so želeli', 'Stanje', 'Datum'].map(cell).join(';'),
      ...leads.map((l) =>
        [
          l.name,
          l.email,
          l.phone,
          l.what_they_wanted,
          LEAD_STATUS[l.status].label,
          l.created_at.slice(0, 10),
        ]
          .map(cell)
          .join(';'),
      ),
    ];
    return { csv: lines.join('\n'), rows: leads.length };
  });
}

/* ---------------------------------------------------------------- bookings */

/** Upcoming first (soonest on top), then past and cancelled (newest on top). */
export function listBookings(): Promise<Booking[]> {
  return call(() => {
    const { db, accountId } = scope();
    const now = nowIso();
    const mine = db.bookings.filter((b) => b.account_id === accountId);
    const upcoming = mine
      .filter((b) => b.start >= now && b.status !== 'cancelled')
      .sort((a, b) => a.start.localeCompare(b.start));
    const rest = mine
      .filter((b) => !(b.start >= now && b.status !== 'cancelled'))
      .sort((a, b) => b.start.localeCompare(a.start));
    return [...upcoming, ...rest];
  });
}

function setBookingStatus(id: Id, status: Booking['status']): Booking {
  const { db, accountId } = scope();
  if (!db.bookings.some((b) => b.id === id && b.account_id === accountId)) {
    throw new ApiError('not_found', 'Te rezervacije ni več na seznamu.');
  }
  setState((prev) => ({
    ...prev,
    bookings: prev.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
  }));
  return getState().bookings.find((b) => b.id === id) as Booking;
}

/** Confirms a requested appointment. The e-mail to the visitor is simulated. */
export function confirmBooking(id: Id): Promise<ActionResult> {
  return call(() => {
    setBookingStatus(id, 'confirmed');
    return simulated(
      'Predogled: termin je potrjen, potrditev obiskovalcu pa ni bila poslana. V polni različici obiskovalec prejme e-pošto s potrjenim terminom.',
    );
  }, 500);
}

/** Cancels an appointment. Removing the calendar event and the e-mail are simulated. */
export function cancelBooking(id: Id): Promise<ActionResult> {
  return call(() => {
    const booking = setBookingStatus(id, 'cancelled');
    const inCalendar = Boolean(booking.calendar_event_id);
    return simulated(
      `Predogled: termin je odpovedan, obvestilo obiskovalcu pa ni bilo poslano${
        inCalendar ? ' in dogodek v koledarju ni bil izbrisan' : ''
      }. V polni različici obiskovalec prejme e-pošto${inCalendar ? ', dogodek pa se izbriše iz koledarja' : ''}.`,
    );
  }, 500);
}

/* ---------------------------------------------------------------- overview */

/**
 * THE way conversations are counted. Pregled, Pogovori and the admin area all go through
 * this function, so two screens can only differ when they count different lists (and then
 * their labels say so — labels.ts → COUNT_LABELS).
 */
export function summarizeConversations(
  list: Pick<Conversation, 'outcome' | 'duration_sec' | 'visitor_name' | 'visitor_email' | 'visitor_phone'>[],
): ConversationCounts {
  const counts: ConversationCounts = {
    total: list.length,
    by_outcome: { question: 0, lead: 0, booking: 0 },
    with_contact: 0,
    duration_sec: 0,
  };
  for (const c of list) {
    counts.by_outcome[c.outcome] += 1;
    if (c.visitor_name || c.visitor_email || c.visitor_phone) counts.with_contact += 1;
    counts.duration_sec += c.duration_sec;
  }
  return counts;
}

/** Activity of one account in its current billing period. Used by Pregled AND by the admin area. */
function periodStats(db: Db, account: Account): OverviewStats {
  const inPeriod = (iso: string) => iso >= account.period_start && iso <= account.period_end;
  const conversations = db.conversations.filter((c) => c.account_id === account.id && inPeriod(c.started_at));
  const ids = new Set(conversations.map((c) => c.id));
  const counts = summarizeConversations(conversations);
  return {
    period_start: account.period_start,
    period_end: account.period_end,
    conversations: counts.total,
    leads: db.leads.filter((l) => l.account_id === account.id && inPeriod(l.created_at)).length,
    // An appointment belongs to the period in which it was AGREED (its conversation), not to
    // the day it takes place; cancelled ones are left out.
    bookings: db.bookings.filter(
      (b) => b.account_id === account.id && b.status !== 'cancelled' && ids.has(b.conversation_id),
    ).length,
    minutes_used: account.minutes_used,
    minutes_included: account.minutes_included,
    counts,
  };
}

export function getOverviewStats(): Promise<OverviewStats> {
  return call(() => {
    const { db, account } = scope();
    return periodStats(db, account);
  });
}

/* ----------------------------------------------------------------- install */

const WIDGET_HOST = `widget.${BRAND.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.example`;

/** The one line the customer pastes into their website. */
export function getEmbedCode(): Promise<{ code: string }> {
  return call(() => {
    const { agent } = scope();
    return {
      code: `<script src="https://${WIDGET_HOST}/v1.js" data-agent="${agent.id}" async></script>`,
    };
  });
}

export function getInstallStatus(): Promise<InstallStatus> {
  return call(() => {
    const { db, accountId, agent } = scope();
    const last = db.conversations
      .filter((c) => c.account_id === accountId)
      .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
    return {
      code_copied: Boolean(db.installCodeCopied[accountId]),
      domain_set: agent.allowed_domain.trim().length > 0,
      last_conversation_at: last?.started_at ?? null,
      allowed_domain: agent.allowed_domain,
    };
  });
}

/** Call when the customer copies the embed code; ticks step 1 of the install checklist. */
export function markCodeCopied(): Promise<void> {
  return call(() => {
    const { accountId } = scope();
    if (getState().installCodeCopied[accountId]) return;
    setState((prev) => ({
      ...prev,
      installCodeCopied: { ...prev.installCodeCopied, [accountId]: true },
    }));
  });
}

/* ------------------------------------------------------------ subscription */

/** Public: the landing page and Cenik read it without a login. */
export function listPlans(): Promise<Plan[]> {
  return call(() => getState().plans);
}

/**
 * Public: what the free trial includes. Print it with formatTrialTerms() and call the trial
 * by its one name (labels.ts → TRIAL). Nothing is known about payment cards — do not add
 * "brez kartice" or similar next to it.
 */
export function getTrialTerms(): Promise<TrialTerms> {
  return call(() => ({ days: TRIAL_DAYS, minutes: TRIAL_MINUTES }));
}

export async function changePlan(key: PlanKey): Promise<ActionResult> {
  await wait(700);
  const { db, accountId } = scope();
  const plan = planByKey(db.plans, key);
  if (!plan) throw new ApiError('not_found', 'Tega paketa ni več v ponudbi.');
  const start = nowIso();
  const end = new Date(Date.now() + 30 * 86_400_000).toISOString();
  setState((prev) => ({
    ...prev,
    accounts: prev.accounts.map((a) =>
      a.id === accountId
        ? {
            ...a,
            plan_key: key,
            minutes_included: plan.minutes_included,
            status: 'active',
            trial_ends_at: null,
            ...(a.status === 'active' ? {} : { period_start: start, period_end: end }),
          }
        : a,
    ),
    // A paid plan settles a failed payment and used-up minutes — and only those two pauses.
    agents: prev.agents.map((a) =>
      a.account_id === accountId ? withPause(withPause(a, 'payment', false), 'limit', false) : a,
    ),
  }));
  return simulated(
    `Predogled: paket ${plan.name} je izbran brez plačila. V polni različici pred zamenjavo paketa plačate s kartico.`,
  );
}

export function listInvoices(): Promise<Invoice[]> {
  return call(() => {
    const { db, accountId } = scope();
    return db.invoices
      .filter((i) => i.account_id === accountId)
      .sort((a, b) => b.issued_at.localeCompare(a.issued_at))
      .map(({ account_id: _omit, ...invoice }) => invoice);
  });
}

/** "Upravljaj plačilo" — would open the Stripe customer portal. */
export function openBillingPortal(): Promise<ActionResult> {
  return call(() => {
    scope();
    return simulated(
      'Predogled: stran za upravljanje plačila se ni odprla. V polni različici tam zamenjate kartico in prenesete izdane račune.',
    );
  }, 500);
}

/* ------------------------------------------------------------------- admin */

/*
 * PRIVACY RULE of this section: the platform admin gets numbers and non-personal facts.
 * Nothing below may return a visitor's name, e-mail address or phone number, a transcript,
 * a summary or a topic — not even inside an error text. The only person named is the owner
 * of the account, as the business contact. scripts/check-data.mjs searches every response
 * of adminListAccounts / adminGetAccount for the visitors' details and fails if one appears.
 */

const ADDRESS_IN_TEXT = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>().,;:]+/g;
const PHONE_IN_TEXT = /(?:\+|\b0)\d[\d ()/-]{6,}\d/g;

/** First sentence of a delivery error with anything that looks like an address or a number removed. */
function failureReason(raw: string | null): string {
  const first = (raw ?? '').split(/(?<=[.!?])\s+/)[0]?.trim() ?? '';
  const clean = first.replace(ADDRESS_IN_TEXT, '[e-naslov]').replace(PHONE_IN_TEXT, '[telefon]');
  return clean || 'Razlog ni znan.';
}

function adminErrors(db: Db, account: Account): AdminErrorLine[] {
  const errors: AdminErrorLine[] = [];
  const agent = db.agents.find((a) => a.account_id === account.id);
  for (const e of db.emailLog) {
    if (e.account_id === account.id && e.status === 'failed') {
      const what =
        e.kind === 'visitor_confirmation'
          ? 'E-pošta obiskovalcu ni bila dostavljena'
          : e.kind === 'owner_notification'
            ? 'Obvestilo podjetju ni bilo dostavljeno'
            : 'Testno sporočilo ni bilo dostavljeno';
      errors.push({ at: e.sent_at, kind: 'email', text: `${what}. Razlog: ${failureReason(e.error)}` });
    }
  }
  for (const s of db.sources) {
    if (s.account_id === account.id && s.status === 'error') {
      // The moment is the last successful read, if there ever was one — never an invented time.
      errors.push({
        at: s.last_synced_at,
        kind: 'source',
        text: `Vira »${s.title}« ni bilo mogoče prebrati. ${s.error ?? ''}`.trim(),
      });
    }
  }
  for (const i of db.invoices) {
    if (i.account_id === account.id && i.status === 'failed') {
      errors.push({
        at: i.issued_at,
        kind: 'payment',
        text: `Plačilo računa ${i.number} ni uspelo.${
          agent?.pause_reasons.includes('payment') ? ' Agent je zato začasno ustavljen.' : ''
        }`,
      });
    }
  }
  // Newest first; lines without a known moment go last.
  return errors.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
}

function adminRow(db: Db, account: Account): AdminAccountRow {
  const agent = db.agents.find((a) => a.account_id === account.id);
  const owner = db.users.find((u) => u.account_id === account.id && u.account_role === 'owner');
  let last: string | null = null;
  for (const c of db.conversations) {
    if (c.account_id === account.id && (last === null || c.started_at > last)) last = c.started_at;
  }
  return {
    account,
    plan: planByKey(db.plans, account.plan_key),
    agent_status: agent?.status ?? 'draft',
    agent_paused_by: agent?.paused_by ?? null,
    agent_pause_reasons: PAUSE_PRIORITY.filter((r) => agent?.pause_reasons.includes(r)),
    owner_name: owner?.name ?? '',
    owner_email: owner?.email ?? '',
    estimated_cost_eur: Math.round(account.minutes_used * SAMPLE_COST_PER_MINUTE_EUR * 100) / 100,
    last_conversation_at: last,
    error_count: adminErrors(db, account).length,
  };
}

export function adminListAccounts(): Promise<AdminAccountRow[]> {
  return call(() => {
    const db = getState();
    requireAdmin(db);
    return db.accounts.map((a) => adminRow(db, a));
  });
}

/** null when the account does not exist. Numbers and non-personal facts only (see the rule above). */
export function adminGetAccount(id: Id): Promise<AdminAccountDetail | null> {
  return call(() => {
    const db = getState();
    requireAdmin(db);
    const account = db.accounts.find((a) => a.id === id);
    const agent = db.agents.find((a) => a.account_id === id);
    if (!account || !agent) return null;
    const sources = db.sources.filter((s) => s.account_id === id);
    const period = periodStats(db, account);
    return {
      ...adminRow(db, account),
      agent: {
        name: agent.name,
        language: agent.language,
        allowed_domain: agent.allowed_domain,
        elevenlabs_agent_id: agent.elevenlabs_agent_id,
        auto_sync_days: agent.auto_sync_days,
        last_sync_at: agent.last_sync_at,
      },
      team_size: db.users.filter((u) => u.account_id === id).length,
      sources_total: sources.length,
      sources_included: sources.filter((s) => s.included).length,
      sources_failed: sources.filter((s) => s.status === 'error').length,
      conversations_total: db.conversations.filter((c) => c.account_id === id).length,
      period: {
        start: period.period_start,
        end: period.period_end,
        conversations: period.counts,
        leads: period.leads,
        bookings: period.bookings,
        minutes_used: period.minutes_used,
        minutes_included: period.minutes_included,
      },
      errors: adminErrors(db, account),
    };
  });
}

/**
 * The ADMIN's pause. It is one of four independent reasons (PausedBy): resuming here lifts
 * only the admin's own pause. If a failed payment, used-up minutes or the customer's own
 * pause still hold the agent, the result says so and the agent stays paused; and when the
 * admin never paused it, there is nothing to lift and the call is refused.
 */
export function adminSetPaused(id: Id, paused: boolean): Promise<ActionResult> {
  return call(() => {
    const db = getState();
    requireAdmin(db);
    const account = db.accounts.find((a) => a.id === id);
    const agent = db.agents.find((a) => a.account_id === id);
    if (!account || !agent) throw new ApiError('not_found', 'Tega uporabniškega računa ni več.');
    if (paused) {
      if (agent.status === 'draft') {
        throw new ApiError('invalid', 'Agent je še osnutek in ne odgovarja obiskovalcem, zato ga ni treba ustaviti.');
      }
      setPause(id, 'admin', true);
      return simulated(
        `Predogled: agent uporabniškega računa ${account.name} je ustavljen samo v vzorčnih podatkih. V polni različici se ustavi tudi pravi agent.`,
      );
    }
    if (!agent.pause_reasons.includes('admin')) {
      const why = agent.paused_by ? ` ${PAUSED_BY_ADMIN[agent.paused_by].label}.` : '';
      throw new ApiError(
        'invalid',
        `Tega agenta ni ustavil skrbnik, zato ga tukaj ni mogoče vklopiti.${why}`,
      );
    }
    setPause(id, 'admin', false);
    const after = getState().agents.find((a) => a.account_id === id);
    if (after?.status === 'paused' && after.paused_by) {
      return simulated(
        `Predogled: skrbniška ustavitev je odstranjena, agent pa ostaja ustavljen. ${PAUSED_BY_ADMIN[after.paused_by].label}.`,
      );
    }
    return simulated(
      `Predogled: agent uporabniškega računa ${account.name} je znova vklopljen samo v vzorčnih podatkih. V polni različici se vklopi tudi pravi agent.`,
    );
  }, 400);
}

export type PlanPatch = Partial<Omit<Plan, 'key'>>;

export function adminUpdatePlan(key: PlanKey, patch: PlanPatch): Promise<Plan> {
  return call(() => {
    const db = getState();
    requireAdmin(db);
    if (!db.plans.some((p) => p.key === key)) throw new ApiError('not_found', 'Tega paketa ni.');
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new ApiError('invalid', 'Ime paketa ne sme biti prazno.');
    }
    for (const n of [patch.price_month_eur, patch.minutes_included, patch.max_pages, patch.max_agents]) {
      if (n !== undefined && (!Number.isFinite(n) || n < 0)) {
        throw new ApiError('invalid', 'Vrednosti paketa morajo biti številke, ki niso manjše od nič.');
      }
    }
    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => (p.key === key ? { ...p, ...patch } : p)),
    }));
    return getState().plans.find((p) => p.key === key) as Plan;
  });
}

/* ------------------------------------------------------------------- hooks */

export interface QueryResult<T> {
  /** undefined until the first answer arrives */
  data: T | undefined;
  /** true only for the first load and when `deps` change — not for silent refreshes */
  loading: boolean;
  /** a Slovenian sentence, or null */
  error: string | null;
  reload: () => void;
}

function errorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'Nekaj je šlo narobe. Poskusite znova.';
}

/**
 * Loads data and keeps it fresh.
 *
 *   const { data: leads, loading, error } = useQuery(() => api.listLeads(), []);
 *
 * It runs again when `deps` change (showing `loading`) and silently after ANY mutation
 * through api.ts, so a list updates by itself after you change something.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: DependencyList = []): QueryResult<T> {
  const revision = useRevision();
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{ data: T | undefined; loading: boolean; error: string | null }>(
    { data: undefined, loading: true, error: null },
  );
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const lastDeps = useRef<DependencyList | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const prev = lastDeps.current;
    const depsChanged =
      prev === null || prev.length !== deps.length || prev.some((d, i) => !Object.is(d, deps[i]));
    lastDeps.current = deps;
    if (depsChanged) setResult({ data: undefined, loading: true, error: null });

    const id = ++requestId.current;
    let cancelled = false;
    fnRef.current().then(
      (data) => {
        if (cancelled || id !== requestId.current) return;
        setResult({ data, loading: false, error: null });
      },
      (e: unknown) => {
        if (cancelled || id !== requestId.current) return;
        setResult((r) => ({ data: r.data, loading: false, error: errorMessage(e) }));
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...result, reload };
}

/**
 * Runs a mutation and tracks that it is running.
 *
 *   const save = useAction(api.updateAgent);
 *   <Button loading={save.pending} onClick={() => save.run({ name })}>Shrani</Button>
 *
 * `run` resolves to the result, or to undefined when the call failed — in that case
 * `error` holds the sentence to show (and `onError`, if given, was called with it).
 */
export function useAction<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  options: { onError?: (message: string) => void } = {},
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async (...args: A): Promise<R | undefined> => {
    setPending(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (e) {
      const message = errorMessage(e);
      if (alive.current) setError(message);
      optionsRef.current.onError?.(message);
      return undefined;
    } finally {
      if (alive.current) setPending(false);
    }
  }, []);

  return { run, pending, error };
}

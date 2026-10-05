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
import { LEAD_STATUS } from './labels';
import {
  buildWebsitePages,
  createEmptyAccountBundle,
  LOGGED_OUT_SESSION,
  planByKey,
  SAMPLE_COST_PER_MINUTE_EUR,
  SAMPLE_LOGIN_USER,
  SAMPLE_VOICES,
  SPLETNOST_ID,
  WIDGET_COLORS,
} from './sample';
import { getState, resetSampleData as resetStore, setState, useRevision, useStore } from './store';
import type {
  Account,
  ActionResult,
  AdminAccountDetail,
  AdminAccountRow,
  Agent,
  Booking,
  BookingSettings,
  CalendarConnection,
  Conversation,
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
  Plan,
  PlanKey,
  Session,
  User,
} from './types';

export type * from './types';
export { WIDGET_COLORS, SAMPLE_VOICES };

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
    throw new ApiError('not_found', 'Računa ni bilo mogoče najti. Prijavite se znova.');
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

/* ----------------------------------------------------------------- session */

/** Synchronous session for guards and shells. Screens may use it too. */
export function useSession(): Session {
  return useStore((db) => db.session);
}

export function getSession(): Promise<Session> {
  return call(() => getState().session);
}

/** Stage 1: any non-empty e-mail and password signs in as the sample customer (with admin access). */
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
    email: email.trim(),
    accountId: SPLETNOST_ID,
    onboardingStep: 'done',
  };
  setState((prev) => ({ ...prev, session }));
  return structuredClone(session);
}

export async function logout(): Promise<void> {
  await wait(LATENCY_MS);
  setState((prev) => ({ ...prev, session: { ...LOGGED_OUT_SESSION } }));
}

export interface RegisterInput {
  businessName: string;
  name: string;
  email: string;
  password: string;
}

/** Stage 1: creates a new, empty trial account in the browser and starts the wizard at step 1. */
export async function register(input: RegisterInput): Promise<Session> {
  await wait(LATENCY_MS * 3);
  if (!input.businessName.trim() || !input.name.trim()) {
    throw new ApiError('invalid', 'Vpišite ime podjetja ter svoje ime in priimek.');
  }
  if (!isEmail(input.email)) {
    throw new ApiError('invalid', 'E-naslov ni pravilno zapisan. Primer: ime@podjetje.si');
  }
  if (input.password.length < 8) {
    throw new ApiError('invalid', 'Geslo naj ima vsaj 8 znakov.');
  }
  const bundle = createEmptyAccountBundle({
    businessName: input.businessName.trim(),
    userName: input.name.trim(),
    email: input.email.trim(),
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

export function setOnboardingStep(step: OnboardingStep): Promise<Session> {
  return call(() => {
    scope();
    setState((prev) => ({ ...prev, session: { ...prev.session, onboardingStep: step } }));
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
    patchAccount(accountId, patch);
    if (patch.name !== undefined) patchAgent(accountId, { business_name: patch.name });
    return scope().account;
  });
}

/** Stage 1 does not delete anything. */
export function deleteAccount(): Promise<ActionResult> {
  return call(() => {
    scope();
    return simulated(
      'Predogled: račun ni bil izbrisan. Izbris računa in vseh podatkov bo deloval, ko bo povezan strežnik.',
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
      name: address.split('@')[0] ?? address,
      email: address,
      account_role: 'member',
      status: 'invited',
      created_at: nowIso(),
    };
    setState((prev) => ({ ...prev, users: [...prev.users, user] }));
    return simulated(
      `Predogled: ${address} je dodan na seznam, vabilo po e-pošti pa ni bilo poslano.`,
    );
  });
}

export function removeMember(id: Id): Promise<ActionResult> {
  return call(() => {
    const { db, accountId } = scope();
    const user = db.users.find((u) => u.id === id && u.account_id === accountId);
    if (!user) throw new ApiError('not_found', 'Te osebe ni več na seznamu.');
    if (user.account_role === 'owner') {
      throw new ApiError('invalid', 'Lastnika računa ni mogoče odstraniti.');
    }
    setState((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== id) }));
    return done(`${user.name} nima več dostopa do računa.`);
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

export function updateAgent(patch: AgentPatch): Promise<Agent> {
  return call(() => {
    const { accountId } = scope();
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new ApiError('invalid', 'Ime agenta ne sme biti prazno.');
    }
    const clean: AgentPatch = { ...patch };
    if (clean.allowed_domain !== undefined) {
      clean.allowed_domain = clean.allowed_domain
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '');
    }
    patchAgent(accountId, clean);
    return scope().agent;
  });
}

export function listVoices(): Promise<typeof SAMPLE_VOICES> {
  return call(() => SAMPLE_VOICES);
}

/**
 * Reply of the agent in the test widget. Stage 1 has no ElevenLabs, so this picks a
 * canned sentence by keyword. The widget must say that replies are samples.
 * Works without a login (the landing page demo uses it).
 */
export function previewAgentReply(question: string): Promise<{ text: string; simulated: true }> {
  return call(() => {
    const q = question.toLowerCase();
    let text =
      'Tega podatka nimam zapisanega. Želite, da vas pokliče naš svetovalec in vam odgovori?';
    if (/(cen|stane|koliko|drag)/.test(q)) {
      text =
        'Cene berem iz vašega cenika v virih znanja. V predogledu odgovarjam z vzorčnimi stavki, zato vam številke tukaj ne povem.';
    } else if (/(termin|sestan|posvet|rezerv|naroč)/.test(q)) {
      text =
        'Lahko vam poiščem prost termin. V predogledu koledarja ne preverjam zares. Kateri dan vam najbolj ustreza?';
    } else if (/(kdo si|robot|človek|umetna|\bai\b)/.test(q)) {
      text = 'Sem AI pomočnik, ne človek. Odgovarjam iz vsebine vaše spletne strani.';
    } else if (/(hvala|adijo|nasvidenje|lep dan)/.test(q)) {
      text = 'Prosim. Lep dan želim!';
    } else if (/(živjo|zdravo|pozdrav|dober dan)/.test(q)) {
      text = 'Pozdravljeni. Kaj vas zanima?';
    }
    return { text, simulated: true as const };
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
      'Ni strani za sinhronizacijo. Najprej uvozite spletno stran ali vključite vsaj eno stran.',
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
    `Predogled: sinhronizacija je simulirana. Strani niso bile znova prebrane (${pages.length} označenih kot sinhronizirane).`,
  );
}

/** Wizard step 1 and "Uvozi stran". Simulated: always lists the sample pages under the given address. */
export async function importWebsite(url: string): Promise<ActionResult> {
  await wait(LATENCY_MS);
  const { accountId, agent } = scope();
  let clean = url.trim();
  if (!clean) throw new ApiError('invalid', 'Vpišite naslov spletne strani, na primer https://vasepodjetje.si');
  if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
  let host: string;
  try {
    host = new URL(clean).hostname;
  } catch {
    throw new ApiError('invalid', 'Naslov spletne strani ni pravilno zapisan. Primer: https://vasepodjetje.si');
  }
  if (!host.includes('.')) {
    throw new ApiError('invalid', 'Naslov spletne strani ni pravilno zapisan. Primer: https://vasepodjetje.si');
  }
  const base = `https://${host}`;
  const prefix = newId('imp');
  const pages = buildWebsitePages(accountId, agent.id, base, null, prefix).map((p) =>
    p.included ? { ...p, status: 'pending' as const } : p,
  );
  setState((prev) => ({
    ...prev,
    accounts: prev.accounts.map((a) => (a.id === accountId ? { ...a, website_url: base } : a)),
    agents: prev.agents.map((a) =>
      a.account_id === accountId
        ? { ...a, allowed_domain: a.allowed_domain || host.replace(/^www\./, '') }
        : a,
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
    `Predogled: uvoz je simuliran. Prikazan je vzorčni seznam ${pages.length} strani; vaša stran ${host} ni bila zares prebrana.`,
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
    `Predogled: povezava z Google Koledarjem je simulirana. Prikazan je vzorčni naslov ${connection.connected_email}.`,
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
    'Predogled: koledar je odklopljen (simulirano). Agent zdaj zapisuje želje za termin, potrdite jih sami.',
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
    `Predogled: testno sporočilo za ${settings.notify_email} ni bilo zares poslano. Pošiljanje e-pošte bo delovalo, ko bo povezan strežnik.`,
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
      ['Ime', 'E-pošta', 'Telefon', 'Kaj so želeli', 'Stanje', 'Datum'].map(cell).join(';'),
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
    const booking = setBookingStatus(id, 'confirmed');
    return simulated(
      `Predogled: termin je potrjen. Potrditev za ${booking.customer_email} ni bila zares poslana.`,
    );
  }, 500);
}

/** Cancels an appointment. Removing the calendar event and the e-mail are simulated. */
export function cancelBooking(id: Id): Promise<ActionResult> {
  return call(() => {
    const booking = setBookingStatus(id, 'cancelled');
    return simulated(
      `Predogled: termin je odpovedan. Obvestilo za ${booking.customer_email} ni bilo zares poslano${
        booking.calendar_event_id ? ', dogodek v koledarju pa ni bil izbrisan' : ''
      }.`,
    );
  }, 500);
}

/* ---------------------------------------------------------------- overview */

export function getOverviewStats(): Promise<OverviewStats> {
  return call(() => {
    const { db, accountId, account } = scope();
    const inPeriod = (iso: string) => iso >= account.period_start && iso <= account.period_end;
    return {
      period_start: account.period_start,
      period_end: account.period_end,
      conversations: db.conversations.filter(
        (c) => c.account_id === accountId && inPeriod(c.started_at),
      ).length,
      leads: db.leads.filter((l) => l.account_id === accountId && inPeriod(l.created_at)).length,
      bookings: db.bookings.filter(
        (b) => b.account_id === accountId && b.status !== 'cancelled',
      ).length,
      minutes_used: account.minutes_used,
      minutes_included: account.minutes_included,
    };
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
    agents: prev.agents.map((a) =>
      a.account_id === accountId && a.status === 'paused' ? { ...a, status: 'active' } : a,
    ),
  }));
  return simulated(
    `Predogled: paket ${plan.name} je izbran brez plačila. Plačilo s kartico prek Stripe bo delovalo v poznejši fazi.`,
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
      'Predogled: portal za plačila (Stripe) še ni povezan. Tu boste zamenjali kartico in prenesli račune.',
    );
  }, 500);
}

/* ------------------------------------------------------------------- admin */

function adminRow(db: Db, account: Account): AdminAccountRow {
  const agent = db.agents.find((a) => a.account_id === account.id);
  const owner = db.users.find((u) => u.account_id === account.id && u.account_role === 'owner');
  const last = db.conversations
    .filter((c) => c.account_id === account.id)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  return {
    account,
    plan: planByKey(db.plans, account.plan_key),
    agent_status: agent?.status ?? 'draft',
    owner_email: owner?.email ?? '',
    estimated_cost_eur: Math.round(account.minutes_used * SAMPLE_COST_PER_MINUTE_EUR * 100) / 100,
    last_conversation_at: last?.started_at ?? null,
    error_count: adminErrors(db, account).length,
  };
}

function adminErrors(db: Db, account: Account): { at: string; text: string }[] {
  const errors: { at: string; text: string }[] = [];
  for (const e of db.emailLog) {
    if (e.account_id === account.id && e.status === 'failed') {
      errors.push({ at: e.sent_at, text: `E-pošta za ${e.to} ni bila dostavljena. ${e.error ?? ''}`.trim() });
    }
  }
  for (const s of db.sources) {
    if (s.account_id === account.id && s.status === 'error') {
      errors.push({ at: account.period_start, text: `Vir »${s.title}«: ${s.error ?? 'napaka pri branju.'}` });
    }
  }
  for (const i of db.invoices) {
    if (i.account_id === account.id && i.status === 'failed') {
      errors.push({ at: i.issued_at, text: `Plačilo računa ${i.number} ni uspelo. Agent je začasno ustavljen.` });
    }
  }
  return errors.sort((a, b) => b.at.localeCompare(a.at));
}

export function adminListAccounts(): Promise<AdminAccountRow[]> {
  return call(() => {
    const db = getState();
    requireAdmin(db);
    return db.accounts.map((a) => adminRow(db, a));
  });
}

/** null when the account does not exist. */
export function adminGetAccount(id: Id): Promise<AdminAccountDetail | null> {
  return call(() => {
    const db = getState();
    requireAdmin(db);
    const account = db.accounts.find((a) => a.id === id);
    const agent = db.agents.find((a) => a.account_id === id);
    if (!account || !agent) return null;
    const sources = db.sources.filter((s) => s.account_id === id);
    const conversations = db.conversations
      .filter((c) => c.account_id === id)
      .sort((a, b) => b.started_at.localeCompare(a.started_at));
    return {
      ...adminRow(db, account),
      agent,
      users: db.users.filter((u) => u.account_id === id),
      sources_total: sources.length,
      sources_included: sources.filter((s) => s.included).length,
      conversations_total: conversations.length,
      recent_conversations: conversations.slice(0, 5),
      errors: adminErrors(db, account),
    };
  });
}

export function adminSetPaused(id: Id, paused: boolean): Promise<ActionResult> {
  return call(() => {
    const db = getState();
    requireAdmin(db);
    const account = db.accounts.find((a) => a.id === id);
    if (!account) throw new ApiError('not_found', 'Tega računa ni več.');
    patchAgent(id, { status: paused ? 'paused' : 'active' });
    return simulated(
      paused
        ? `Predogled: agent računa ${account.name} je označen kot ustavljen. Pravi agent pri ElevenLabs ni bil ustavljen.`
        : `Predogled: agent računa ${account.name} je označen kot aktiven. Pravi agent pri ElevenLabs ni bil spremenjen.`,
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

/**
 * The Slovenian word and the colour tone for every state in the data model.
 * Use these maps everywhere a state is shown, so the same state always reads the same:
 *
 *   const s = AGENT_STATUS[agent.status];
 *   <StatusPill tone={s.tone}>{s.label}</StatusPill>
 */
import { BRAND } from '../brand';
import { formatMinutes, formatNumber } from './format';
import type {
  AccountStatus,
  AgentStatus,
  BookingMode,
  BookingStatus,
  ConversationOutcome,
  EmailKind,
  EmailStatus,
  KnowledgeSourceStatus,
  KnowledgeSourceType,
  LeadStatus,
  PausedBy,
  Plan,
  Weekday,
} from './types';

export type LabelTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface StateLabel {
  label: string;
  tone: LabelTone;
}

export const AGENT_STATUS: Record<AgentStatus, StateLabel> = {
  draft: { label: 'Osnutek', tone: 'neutral' },
  active: { label: 'Aktiven', tone: 'success' },
  paused: { label: 'Začasno ustavljen', tone: 'warning' },
  error: { label: 'Napaka', tone: 'danger' },
};

/**
 * What each agent state MEANS, in one sentence: what a visitor of the customer's website
 * sees in that state. Wherever the state pill is shown with room for a sentence (Pregled,
 * Nastavitve, the tooltip of the pill in the top bar, the admin detail), print this text —
 * never write a second explanation of "Osnutek" in a page.
 */
export const AGENT_STATUS_HELP: Record<AgentStatus, string> = {
  draft:
    'Agent še ni vklopljen. Obiskovalci vaše spletne strani pripomočka ne vidijo, dokler agenta ne vklopite.',
  active: 'Agent odgovarja obiskovalcem na spletni strani, kjer je nameščen pripomoček.',
  paused: 'Agent ne sprejema pogovorov. Pripomoček obiskovalcem pove, da pomočnik trenutno ni na voljo.',
  error:
    'Agent zaradi napake ne more odgovarjati. Pripomoček obiskovalcem pove, da pomočnik trenutno ni na voljo.',
};

/**
 * The same four sentences for the PLATFORM ADMIN, who is not the owner: third person, about
 * "the agent of this account" (the customer texts above say "vaše spletne strani"). Used in
 * src/pages/admin/** only.
 */
export const AGENT_STATUS_HELP_ADMIN: Record<AgentStatus, string> = {
  draft:
    'Agent tega uporabniškega računa še ni vklopljen. Obiskovalci njegove spletne strani pripomočka ne vidijo, dokler agenta ne vklopi lastnik.',
  active: 'Agent tega uporabniškega računa odgovarja obiskovalcem na spletni strani, kjer je nameščen pripomoček.',
  paused:
    'Agent tega uporabniškega računa ne sprejema pogovorov. Pripomoček obiskovalcem pove, da pomočnik trenutno ni na voljo.',
  error:
    'Agent tega uporabniškega računa zaradi napake ne more odgovarjati. Pripomoček obiskovalcem pove, da pomočnik trenutno ni na voljo.',
};

/** The state with its noun, for places where the pill stands alone: "Agent: aktiven". */
export function agentStatusText(status: AgentStatus): string {
  return `Agent: ${AGENT_STATUS[status].label.toLowerCase()}`;
}

/**
 * WHO stopped a paused agent (agent.paused_by). The four reasons are kept apart: lifting one
 * never lifts another. `label` goes next to the pill, `help` says what ends the pause.
 */
export const PAUSED_BY: Record<PausedBy, { label: string; help: string }> = {
  payment: {
    label: 'Ustavljen zaradi neuspelega plačila',
    help: 'Zadnje plačilo ni uspelo. Agent se znova vklopi, ko uredite plačilo v razdelku Naročnina.',
  },
  limit: {
    label: 'Ustavljen, ker so minute porabljene',
    help: 'Vključene minute so porabljene. Agent se znova vklopi, ko izberete večji paket ali ko se začne novo obračunsko obdobje.',
  },
  admin: {
    label: 'Ustavil ga je skrbnik platforme',
    help: `Agenta je začasno ustavil skrbnik platforme ${BRAND}. Znova ga lahko vklopi samo skrbnik.`,
  },
  customer: {
    label: 'Ustavili ste ga sami',
    help: 'Agenta ste začasno ustavili sami. Znova ga vklopite v Nastavitvah.',
  },
};

/**
 * `PAUSED_BY[reason].help` for the place where it is shown. On Nastavitve itself the customer's
 * own pause must not send the person "v Nastavitvah" — they are there — so it names the button.
 * Everywhere else (Pregled, the tooltip in the top bar) it is the plain `PAUSED_BY` text.
 */
export function pausedByHelp(reason: PausedBy, place?: 'settings'): string {
  if (reason === 'customer' && place === 'settings') {
    return 'Agenta ste začasno ustavili sami. Znova ga vklopite z gumbom »Znova vklopi agenta«.';
  }
  return PAUSED_BY[reason].help;
}

/**
 * The same four reasons for the PLATFORM ADMIN (src/pages/admin/** and the admin api): third
 * person, nothing that speaks to the owner ("Ustavili ste ga sami"). `help` says what ends the
 * pause. Lifting one reason never lifts another; only the platform admin's own pause can be
 * lifted from the admin area.
 */
export const PAUSED_BY_ADMIN: Record<PausedBy, { label: string; help: string }> = {
  payment: {
    label: PAUSED_BY.payment.label,
    help: 'Agent tega uporabniškega računa se znova vklopi, ko stranka uredi plačilo. Skrbnik tega ne more odpraviti.',
  },
  limit: {
    label: PAUSED_BY.limit.label,
    help: 'Agent tega uporabniškega računa se znova vklopi, ko stranka izbere večji paket ali ko se začne novo obračunsko obdobje. Skrbnik tega ne more odpraviti.',
  },
  admin: {
    label: PAUSED_BY.admin.label,
    help: 'Agenta tega uporabniškega računa je ustavil skrbnik platforme. Znova ga lahko vklopi samo skrbnik.',
  },
  customer: {
    label: 'Ustavila ga je stranka',
    help: 'Agenta tega uporabniškega računa je ustavila stranka sama. Znova ga lahko vklopi samo stranka.',
  },
};

/**
 * The free trial has ONE name. Use `name` in sentences and headings ("Brezplačni preizkus"),
 * `pill` only inside a StatusPill (ACCOUNT_STATUS.trial.label is the same word).
 * The numbers come from api.getTrialTerms() and are printed with formatTrialTerms().
 */
export const TRIAL = {
  name: 'Brezplačni preizkus',
  /** inside a sentence */
  nameLower: 'brezplačni preizkus',
  pill: 'Preizkus',
} as const;

export const ACCOUNT_STATUS: Record<AccountStatus, StateLabel> = {
  trial: { label: TRIAL.pill, tone: 'info' },
  active: { label: 'Aktivna', tone: 'success' },
  past_due: { label: 'Plačilo ni uspelo', tone: 'danger' },
  paused_limit: { label: 'Minute porabljene', tone: 'warning' },
  cancelled: { label: 'Preklicana', tone: 'neutral' },
};

export const CONVERSATION_OUTCOME: Record<ConversationOutcome, StateLabel> = {
  question: { label: 'Vprašanje', tone: 'neutral' },
  lead: { label: 'Kontakt', tone: 'info' },
  booking: { label: 'Rezervacija', tone: 'accent' },
};

export const LEAD_STATUS: Record<LeadStatus, StateLabel> = {
  new: { label: 'Nov', tone: 'accent' },
  contacted: { label: 'Kontaktiran', tone: 'info' },
  won: { label: 'Dogovorjeno', tone: 'success' },
  lost: { label: 'Ni zanimanja', tone: 'neutral' },
};

/** Order in which lead states are offered in a select. */
export const LEAD_STATUS_ORDER: LeadStatus[] = ['new', 'contacted', 'won', 'lost'];

export const BOOKING_STATUS: Record<BookingStatus, StateLabel> = {
  requested: { label: 'Čaka na potrditev', tone: 'warning' },
  confirmed: { label: 'Potrjeno', tone: 'success' },
  cancelled: { label: 'Odpovedano', tone: 'neutral' },
};

export const BOOKING_MODE: Record<BookingMode, { label: string; description: string }> = {
  request: {
    label: 'Povpraševanje',
    description: 'Agent zapiše želeni termin, vi ga potrdite po e-pošti. Deluje brez koledarja.',
  },
  auto: {
    label: 'Samodejna rezervacija',
    description: 'Agent ponudi proste termine iz vašega Google Koledarja in termin vpiše sam.',
  },
};

export const SOURCE_STATUS: Record<KnowledgeSourceStatus, StateLabel> = {
  pending: { label: 'V obdelavi', tone: 'info' },
  synced: { label: 'Prebrano', tone: 'success' },
  excluded: { label: 'Izključeno', tone: 'neutral' },
  error: { label: 'Napaka', tone: 'danger' },
};

export const SOURCE_TYPE: Record<KnowledgeSourceType, string> = {
  website_page: 'Spletna stran',
  file: 'Datoteka',
  text: 'Besedilo',
};

export const EMAIL_STATUS: Record<EmailStatus, StateLabel> = {
  sent: { label: 'Poslano', tone: 'success' },
  failed: { label: 'Ni dostavljeno', tone: 'danger' },
  skipped: { label: 'Ni poslano (ni naslova)', tone: 'neutral' },
  pending: { label: 'V pošiljanju', tone: 'info' },
};

/**
 * The two e-mails after a conversation have ONE name each. Inside the app the owner reads
 * about their own message, so it is "Obvestilo vam"; never "Povzetek za vas", "Vam" …
 */
export const EMAIL_KIND: Record<EmailKind, string> = {
  visitor_confirmation: 'Potrditev obiskovalcu',
  owner_notification: 'Obvestilo vam',
  test: 'Testno sporočilo',
};

/** The same two e-mails as named on the PUBLIC pages, where the reader is not yet the owner. */
export const EMAIL_KIND_PUBLIC: Record<EmailKind, string> = {
  visitor_confirmation: 'Potrditev obiskovalcu',
  owner_notification: 'Obvestilo podjetju',
  test: 'Testno sporočilo',
};

/**
 * Knowledge sources: the one wording for the last time the pages were read, and for "not read
 * yet" (after "Zadnje branje: …"). The button that does it is "Preberi strani znova"; the
 * word "sinhronizacija" is never shown to a person. The name SYNC_WORDS is only an identifier.
 */
export const SYNC_WORDS = {
  lastLabel: 'Zadnje branje',
  never: 'še ni bilo opravljeno',
} as const;

/**
 * Names of the numbers that count activity. Two numbers that can legitimately differ carry
 * different, self-explaining names, so "Kontakti 8" never sits next to "S kontaktom 3":
 *  - *_IN_PERIOD      what happened in the current billing period (Pregled, admin);
 *  - OUTCOME_COUNT    conversations by their ONE outcome (a booking also leaves a contact,
 *                     but its outcome is "rezervacija");
 *  - WITH_CONTACT     conversations in which the visitor left any contact detail.
 * All of them are computed by api.summarizeConversations / api.getOverviewStats.
 */
export const COUNT_LABELS = {
  conversationsInPeriod: { label: 'Pogovori', sub: 'v tem obdobju' },
  leadsInPeriod: { label: 'Novi kontakti', sub: 'v tem obdobju' },
  bookingsInPeriod: { label: 'Nove rezervacije', sub: 'dogovorjene v tem obdobju' },
  minutesInPeriod: { label: 'Minute', sub: 'v tem obdobju' },
  outcome: {
    question: 'Izid: vprašanje',
    lead: 'Izid: kontakt',
    booking: 'Izid: rezervacija',
  } satisfies Record<ConversationOutcome, string>,
  withContact: 'S kontaktnimi podatki',
} as const;

/**
 * What a plan includes, with ONE set of names for the public price list, Naročnina and the
 * admin screen. "Agenti" is left out on purpose until an account can have more than one agent.
 */
export const PLAN_FEATURE_LABELS = {
  minutes: 'Minute pogovorov',
  pages: 'Uvožene strani',
} as const;

export function planFeatureRows(plan: Pick<Plan, 'minutes_included' | 'max_pages'>): { label: string; value: string }[] {
  return [
    { label: PLAN_FEATURE_LABELS.minutes, value: `${formatMinutes(plan.minutes_included)} na mesec` },
    { label: PLAN_FEATURE_LABELS.pages, value: `do ${formatNumber(plan.max_pages)}` },
  ];
}

export const WEEKDAYS: { key: Weekday; label: string; short: string }[] = [
  { key: 'mon', label: 'Ponedeljek', short: 'Pon' },
  { key: 'tue', label: 'Torek', short: 'Tor' },
  { key: 'wed', label: 'Sreda', short: 'Sre' },
  { key: 'thu', label: 'Četrtek', short: 'Čet' },
  { key: 'fri', label: 'Petek', short: 'Pet' },
  { key: 'sat', label: 'Sobota', short: 'Sob' },
  { key: 'sun', label: 'Nedelja', short: 'Ned' },
];

export const LANGUAGES: { value: 'sl' | 'en' | 'hr' | 'sr'; label: string }[] = [
  { value: 'sl', label: 'Slovenščina' },
  { value: 'hr', label: 'Hrvaščina' },
  { value: 'sr', label: 'Srbščina' },
  { value: 'en', label: 'Angleščina' },
];

export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'Europe/Ljubljana', label: 'Ljubljana (srednjeevropski čas)' },
  { value: 'Europe/Zagreb', label: 'Zagreb (srednjeevropski čas)' },
  { value: 'Europe/Belgrade', label: 'Beograd (srednjeevropski čas)' },
  { value: 'Europe/London', label: 'London (zahodnoevropski čas)' },
];

/** The five wizard steps — a real sequence. */
export const WIZARD_STEPS: { step: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { step: 1, label: 'Spletna stran' },
  { step: 2, label: 'Agent' },
  { step: 3, label: 'Termini' },
  { step: 4, label: 'Obvestila' },
  { step: 5, label: 'Preizkus in namestitev' },
];

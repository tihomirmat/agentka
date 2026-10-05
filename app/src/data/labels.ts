/**
 * The Slovenian word and the colour tone for every state in the data model.
 * Use these maps everywhere a state is shown, so the same state always reads the same:
 *
 *   const s = AGENT_STATUS[agent.status];
 *   <StatusPill tone={s.tone}>{s.label}</StatusPill>
 */
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

export const ACCOUNT_STATUS: Record<AccountStatus, StateLabel> = {
  trial: { label: 'Preizkus', tone: 'info' },
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
  synced: { label: 'Sinhronizirano', tone: 'success' },
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

export const EMAIL_KIND: Record<EmailKind, string> = {
  visitor_confirmation: 'Potrditev obiskovalcu',
  owner_notification: 'Obvestilo podjetju',
  test: 'Testno sporočilo',
};

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

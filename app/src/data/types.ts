/**
 * Entity types — one per entity in docs/SPEC.md section 6.
 *
 * Field names are snake_case on purpose: they are the column names of the future
 * database and the JSON keys of the future HTTP API, so screens will not change in stage 2.
 * `Session` and the view types at the bottom are front-end only and use camelCase.
 *
 * All dates are ISO 8601 strings. Format them with src/data/format.ts.
 */

export type Id = string;
export type IsoDate = string;

/* ------------------------------------------------------------------ Account */

export type AccountStatus = 'trial' | 'active' | 'past_due' | 'paused_limit' | 'cancelled';
export type PlanKey = 'start' | 'rast' | 'pro';

export interface Account {
  id: Id;
  name: string;
  website_url: string;
  status: AccountStatus;
  /** null while the account is on trial and has not chosen a plan */
  plan_key: PlanKey | null;
  trial_ends_at: IsoDate | null;
  period_start: IsoDate;
  period_end: IsoDate;
  minutes_included: number;
  minutes_used: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  language: 'sl' | 'en' | 'hr' | 'sr';
  timezone: string;
  created_at: IsoDate;
}

export type AccountRole = 'owner' | 'member';

export interface User {
  id: Id;
  account_id: Id;
  name: string;
  email: string;
  account_role: AccountRole;
  /** 'invited' until the person accepts the invitation */
  status: 'active' | 'invited';
  created_at: IsoDate;
}

/* -------------------------------------------------------------------- Agent */

export type AgentStatus = 'draft' | 'active' | 'paused' | 'error';
export type WidgetPosition = 'bottom-right' | 'bottom-left';

export interface Agent {
  id: Id;
  account_id: Id;
  name: string;
  business_name: string;
  elevenlabs_agent_id: string | null;
  voice_id: string;
  language: 'sl' | 'en' | 'hr' | 'sr';
  first_message: string;
  instructions: string;
  status: AgentStatus;
  allowed_domain: string;
  /** Hex colour of the customer's widget, chosen from WIDGET_COLORS (customer data, not a UI colour). */
  widget_accent_color: string;
  widget_text_input: boolean;
  widget_position: WidgetPosition;
  kb_folder_id: string | null;
  crawl_job_id: string | null;
  auto_sync_days: number;
  last_sync_at: IsoDate | null;
  /** Never shown in full in the UI. */
  webhook_token: string;
}

/* ----------------------------------------------------------------- Booking */

export type BookingMode = 'request' | 'auto';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface WorkingDay {
  open: boolean;
  /** "HH:MM" */
  from: string;
  /** "HH:MM" */
  to: string;
}

export type WorkingHours = Record<Weekday, WorkingDay>;

export interface BookingSettings {
  account_id: Id;
  agent_id: Id;
  mode: BookingMode;
  calendar_id: string | null;
  working_hours: WorkingHours;
  appointment_length_min: number;
  buffer_min: number;
  min_notice_hours: number;
  max_days_ahead: number;
}

/** The refresh token never reaches the browser, so it is not part of this type. */
export interface CalendarConnection {
  account_id: Id;
  provider: 'google';
  connected_email: string;
  status: 'connected' | 'expired' | 'error';
  connected_at: IsoDate;
  /** Calendars the customer can pick from (id + display name). */
  calendars: { id: string; name: string }[];
}

/* ------------------------------------------------------------ Notifications */

export interface NotificationSettings {
  account_id: Id;
  notify_email: string;
  sender_name: string;
  reply_to: string;
  visitor_email_enabled: boolean;
  owner_email_enabled: boolean;
  visitor_template: string;
  owner_template: string;
}

/* ---------------------------------------------------------------- Knowledge */

export type KnowledgeSourceType = 'website_page' | 'file' | 'text';
export type KnowledgeSourceStatus = 'pending' | 'synced' | 'excluded' | 'error';

export interface KnowledgeSource {
  id: Id;
  account_id: Id;
  agent_id: Id;
  type: KnowledgeSourceType;
  title: string;
  /** website_page only */
  url: string | null;
  /** text only */
  content: string | null;
  /** file only */
  file_url: string | null;
  included: boolean;
  status: KnowledgeSourceStatus;
  elevenlabs_doc_id: string | null;
  chars: number;
  last_synced_at: IsoDate | null;
  error: string | null;
}

/* ------------------------------------------------------------ Conversations */

export type ConversationOutcome = 'question' | 'lead' | 'booking';
export type EmailStatus = 'sent' | 'failed' | 'skipped' | 'pending';

export interface TranscriptTurn {
  role: 'agent' | 'visitor';
  text: string;
  /** seconds from the start of the conversation */
  timeSec: number;
}

export interface Conversation {
  id: Id;
  account_id: Id;
  agent_id: Id;
  elevenlabs_conversation_id: string;
  started_at: IsoDate;
  duration_sec: number;
  transcript: TranscriptTurn[];
  summary: string;
  outcome: ConversationOutcome;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  topic: string;
  /** what was agreed, in one sentence; null when nothing was */
  agreed: string | null;
  visitor_email_status: EmailStatus;
  owner_email_status: EmailStatus;
}

export type LeadStatus = 'new' | 'contacted' | 'won' | 'lost';

export interface Lead {
  id: Id;
  account_id: Id;
  agent_id: Id;
  name: string;
  email: string;
  phone: string;
  what_they_wanted: string;
  conversation_id: Id;
  status: LeadStatus;
  created_at: IsoDate;
}

export type BookingStatus = 'requested' | 'confirmed' | 'cancelled';

export interface Booking {
  id: Id;
  account_id: Id;
  agent_id: Id;
  lead_id: Id;
  conversation_id: Id;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start: IsoDate;
  end: IsoDate;
  topic: string;
  mode: BookingMode;
  status: BookingStatus;
  calendar_event_id: string | null;
}

export type EmailKind = 'visitor_confirmation' | 'owner_notification' | 'test';

export interface EmailLog {
  id: Id;
  account_id: Id;
  conversation_id: Id | null;
  kind: EmailKind;
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  error: string | null;
  sent_at: IsoDate;
}

/* --------------------------------------------------------------------- Plan */

export interface Plan {
  key: PlanKey;
  name: string;
  price_month_eur: number;
  stripe_price_id: string | null;
  minutes_included: number;
  max_pages: number;
  max_agents: number;
}

/* ================================================================ Front end */

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 'done';

export interface Session {
  loggedIn: boolean;
  role: 'customer' | 'admin';
  userName: string;
  email: string;
  accountId: Id;
  onboardingStep: OnboardingStep;
}

/** Result of an action that has a visible outcome. Show `message` to the person as it is. */
export interface ActionResult {
  ok: boolean;
  /** Human sentence in Slovenian. Says "Predogled: … simulirano" where a real outside call would happen. */
  message: string;
  /** true when stage 1 only pretended to call ElevenLabs / Google / Stripe / e-mail */
  simulated: boolean;
}

/** Numbers for the top of Pregled, for the current billing period. */
export interface OverviewStats {
  period_start: IsoDate;
  period_end: IsoDate;
  conversations: number;
  leads: number;
  bookings: number;
  minutes_used: number;
  minutes_included: number;
}

export interface Invoice {
  id: Id;
  number: string;
  issued_at: IsoDate;
  amount_eur: number;
  status: 'paid' | 'open' | 'failed';
  description: string;
}

/** Three-step install checklist on Namestitev. */
export interface InstallStatus {
  code_copied: boolean;
  domain_set: boolean;
  /** null until the first conversation arrives from the allowed domain */
  last_conversation_at: IsoDate | null;
  allowed_domain: string;
}

/** One row of the admin accounts table. */
export interface AdminAccountRow {
  account: Account;
  plan: Plan | null;
  agent_status: AgentStatus;
  owner_email: string;
  estimated_cost_eur: number;
  last_conversation_at: IsoDate | null;
  error_count: number;
}

export interface AdminAccountDetail extends AdminAccountRow {
  agent: Agent;
  users: User[];
  sources_total: number;
  sources_included: number;
  conversations_total: number;
  recent_conversations: Conversation[];
  /** readable error lines (failed e-mails, source errors, payment problems) */
  errors: { at: IsoDate; text: string }[];
}

/** The whole in-memory database. Screens never see this type; they use api.ts. */
export interface Db {
  version: number;
  /** when the sample data was generated; used to keep relative dates fresh */
  seeded_at: IsoDate;
  session: Session;
  accounts: Account[];
  users: User[];
  agents: Agent[];
  bookingSettings: BookingSettings[];
  calendarConnections: CalendarConnection[];
  notificationSettings: NotificationSettings[];
  sources: KnowledgeSource[];
  conversations: Conversation[];
  leads: Lead[];
  bookings: Booking[];
  emailLog: EmailLog[];
  invoices: (Invoice & { account_id: Id })[];
  plans: Plan[];
  /** install checklist flag per account */
  installCodeCopied: Record<Id, boolean>;
}

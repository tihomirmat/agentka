/**
 * What the wizard keeps between steps. The drafts live in the Wizard page, so "Nazaj"
 * and "Preskoči" never lose what the person has typed; only "Naprej" writes to the api.
 */
import type {
  Account,
  Agent,
  BookingMode,
  BookingSettings,
  NotificationSettings,
  OnboardingStep,
  WorkingHours,
} from '@/data/api';

export interface WebsiteDraft {
  /** address without the protocol, e.g. "spletnost.si" */
  url: string;
}

export interface AgentDraft {
  businessName: string;
  agentName: string;
  greeting: string;
  voiceId: string;
  language: Agent['language'];
}

export interface BookingDraft {
  mode: BookingMode;
  hours: WorkingHours;
  lengthMin: number;
}

export interface NotifyDraft {
  email: string;
  visitorMail: boolean;
}

export interface Drafts {
  website: WebsiteDraft;
  agent: AgentDraft;
  booking: BookingDraft;
  notify: NotifyDraft;
}

/** What every step gets from the Wizard page to move around. */
export interface StepNav {
  /** absent on step 1 */
  onBack?: () => void;
  /** leave this step without saving its fields */
  onSkip: () => void;
  /** call after the step's fields are saved */
  onDone: () => Promise<void>;
}

/** Wizard default for a new account: Monday to Friday, 9:00–16:00. */
const WEEK_DEFAULT: WorkingHours = {
  mon: { open: true, from: '09:00', to: '16:00' },
  tue: { open: true, from: '09:00', to: '16:00' },
  wed: { open: true, from: '09:00', to: '16:00' },
  thu: { open: true, from: '09:00', to: '16:00' },
  fri: { open: true, from: '09:00', to: '16:00' },
  sat: { open: false, from: '09:00', to: '12:00' },
  sun: { open: false, from: '09:00', to: '12:00' },
};

export function stripProtocol(url: string): string {
  return url.trim().replace(/^[a-z]+:\/\//i, '').replace(/\/+$/, '');
}

/** "https://www.Spletnost.si/kontakt" → "www.spletnost.si" (for comparing two addresses) */
export function hostOf(url: string): string {
  return stripProtocol(url).split('/')[0]?.toLowerCase() ?? '';
}

/** Returns a sentence when the address cannot be a web site, otherwise null. Empty is not an error here. */
export function urlProblem(url: string): string | null {
  const host = hostOf(url);
  if (!host) return null;
  if (!/^[^\s/:@]+\.[^\s/:@]{2,}$/.test(host)) {
    return 'Naslov spletne strani ni pravilno zapisan. Primer: vasepodjetje.si';
  }
  return null;
}

export function buildGreeting(agentName: string, businessName: string): string {
  const who = businessName.trim() ? `AI pomočnik podjetja ${businessName.trim()}` : 'AI pomočnik';
  return `Pozdravljeni, sem ${agentName.trim() || 'agent'}, ${who}. Kako vam lahko pomagam?`;
}

/** The greeting must tell the visitor that this is an AI assistant. */
export function hasAiDisclosure(text: string): boolean {
  return /\bAI\b/.test(text) || /umetn\p{L}*\s+inteligenc/iu.test(text);
}

export function messageOf(e: unknown): string {
  return e instanceof Error && e.message ? e.message : 'Nekaj je šlo narobe. Poskusite znova.';
}

export const LENGTH_CHOICES = [15, 20, 30, 45, 60, 90];

export function makeDrafts(
  saved: { account: Account; agent: Agent; booking: BookingSettings; notify: NotificationSettings },
  onboarding: OnboardingStep,
): Drafts {
  const { account, agent, booking, notify } = saved;
  // Nothing about appointments has been set up yet: offer the wizard's own working week.
  const untouched =
    typeof onboarding === 'number' &&
    onboarding <= 3 &&
    booking.mode === 'request' &&
    booking.calendar_id === null;
  return {
    website: { url: stripProtocol(account.website_url) },
    agent: {
      businessName: account.name,
      agentName: agent.name,
      greeting: agent.first_message,
      voiceId: agent.voice_id,
      language: account.language,
    },
    booking: {
      mode: booking.mode,
      hours: structuredClone(untouched ? WEEK_DEFAULT : booking.working_hours),
      lengthMin: booking.appointment_length_min,
    },
    notify: { email: notify.notify_email, visitorMail: notify.visitor_email_enabled },
  };
}

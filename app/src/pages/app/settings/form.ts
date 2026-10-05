import type * as api from '@/data/api';

/**
 * Everything Nastavitve lets a person edit, in ONE draft: the page has one save bar, so the
 * company card and the agent card share it. Company fields go to the account, agent fields
 * to the agent; the language belongs to both (it is the agent's language and the account's).
 */
export interface SettingsForm {
  name: string;
  website: string;
  timezone: string;
  agent_name: string;
  voice_id: string;
  language: api.Account['language'];
  first_message: string;
}

export function toForm(account: api.Account, agent: api.Agent): SettingsForm {
  return {
    name: account.name,
    website: account.website_url.replace(/^https?:\/\//i, ''),
    timezone: account.timezone,
    agent_name: agent.name,
    voice_id: agent.voice_id,
    language: account.language,
    first_message: agent.first_message,
  };
}

const HOST_RE = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;

/** Accepts "firma.si", "www.firma.si/kontakt" or "https://firma.si"; returns the stored form. */
export function parseWebsite(input: string): { value: string; error: string | null } {
  const raw = input.trim();
  if (!raw) return { value: '', error: null };
  const bad = { value: raw, error: 'Naslov spletne strani ni pravilno zapisan. Primer: vasepodjetje.si' };
  if (/\s/.test(raw)) return bad;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!HOST_RE.test(url.hostname)) return bad;
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return { value: `https://${url.host}${path}`, error: null };
  } catch {
    return bad;
  }
}

export interface FormErrors {
  name?: string;
  website?: string;
  agent_name?: string;
}

export function validate(form: SettingsForm): FormErrors {
  return {
    name: form.name.trim() ? undefined : 'Vpišite ime podjetja.',
    website: parseWebsite(form.website).error ?? undefined,
    agent_name: form.agent_name.trim() ? undefined : 'Vpišite ime agenta.',
  };
}

/** The greeting says that the agent is an AI assistant (rule 8 of the spec). */
export function mentionsAi(text: string): boolean {
  return /(\bAI\b|umetn|virtualn|digitaln)/i.test(text);
}

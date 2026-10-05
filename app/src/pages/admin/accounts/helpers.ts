import type { AccountStatus, AdminAccountRow } from '@/data/types';

/** Order of the subscription states in the filter. */
export const STATUS_ORDER: AccountStatus[] = ['trial', 'active', 'past_due', 'paused_limit', 'cancelled'];

/** Past due, out of minutes, agent paused or in error, or any error line. A cancelled account is not "paused". */
export function needsAttention(row: AdminAccountRow): boolean {
  const status = row.account.status;
  if (status === 'past_due' || status === 'paused_limit') return true;
  if (row.error_count > 0) return true;
  if (status === 'cancelled') return false;
  return row.agent_status === 'paused' || row.agent_status === 'error';
}

export const ERROR_FORMS: [string, string, string, string] = ['napaka', 'napaki', 'napake', 'napak'];
export const ACCOUNT_FORMS: [string, string, string, string] = [
  'uporabniški račun',
  'uporabniška računa',
  'uporabniški računi',
  'uporabniških računov',
];
/** "od 1 uporabniškega računa" · "od 3 uporabniških računov" (the number after "od"). */
export const ACCOUNT_FORMS_OF: [string, string, string, string] = [
  'uporabniškega računa',
  'uporabniških računov',
  'uporabniških računov',
  'uporabniških računov',
];

/** Index into a four-form set, the way plural() chooses it. */
export function formIndex(n: number): 0 | 1 | 2 | 3 {
  const abs = Math.abs(n) % 100;
  if (abs === 1) return 0;
  if (abs === 2) return 1;
  if (abs === 3 || abs === 4) return 2;
  return 3;
}

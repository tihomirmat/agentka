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

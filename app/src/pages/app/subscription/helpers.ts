import { dayDiff, plural } from '@/data/format';
import type { StateLabel } from '@/data/labels';
import type { Invoice } from '@/data/types';

/** "še 4 dni" · "danes" · "pred 3 dnevi" — for a date that is counted from today. */
export function daysFromToday(iso: string): string {
  const n = dayDiff(iso);
  if (n === 0) return 'danes';
  if (n > 0) return `še ${plural(n, ['dan', 'dneva', 'dnevi', 'dni'])}`;
  return `pred ${plural(-n, ['dnevom', 'dnevoma', 'dnevi', 'dnevi'])}`;
}

/** Invoice states have no entry in labels.ts, so the words live here. */
export const INVOICE_STATUS: Record<Invoice['status'], StateLabel> = {
  paid: { label: 'Plačano', tone: 'success' },
  open: { label: 'Čaka na plačilo', tone: 'warning' },
  failed: { label: 'Plačilo ni uspelo', tone: 'danger' },
};

import type { StateLabel } from '@/data/labels';
import type { Invoice } from '@/data/types';

/** Invoice states have no entry in labels.ts, so the words live here. */
export const INVOICE_STATUS: Record<Invoice['status'], StateLabel> = {
  paid: { label: 'Plačano', tone: 'success' },
  open: { label: 'Čaka na plačilo', tone: 'warning' },
  failed: { label: 'Plačilo ni uspelo', tone: 'danger' },
};

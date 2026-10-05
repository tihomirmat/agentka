import { formatNumber, plural } from '@/data/format';

/** "100 minut", "1 minuta" — Slovenian number forms for the limits shown on plans. */
export function minutesText(n: number): string {
  return plural(n, ['minuta', 'minuti', 'minute', 'minut']);
}

export function agentsText(n: number): string {
  return plural(n, ['agent', 'agenta', 'agenti', 'agentov']);
}

/** "do 150 strani" */
export function pagesLimitText(n: number): string {
  return `do ${formatNumber(n)} strani`;
}

/** Link style used for text links on public pages (same as the shell's). */
export const TEXT_LINK = 'font-medium text-accent underline underline-offset-2 hover:no-underline';

/**
 * Date helpers local to Pogovori / Kontakti / Rezervacije.
 * format.ts has no "weekday + day + month" and its relative helper says "predvčerajšnjim",
 * which is too long for a table column — so these two small formatters live here.
 */
import { dayDiff, formatDate, formatRelativeDay, formatTime } from '@/data/format';

const LOCALE = 'sl-SI';
const fmtDayMonth = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const fmtWeekdayDate = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });

function valid(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

/** "danes ob 10:12" · "včeraj ob 15:40" · "3. okt. ob 13:22" */
export function formatListDateTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (!valid(d)) return '—';
  const diff = dayDiff(d, now);
  let day: string;
  if (diff >= -1 && diff <= 1) day = formatRelativeDay(d, now);
  else if (d.getFullYear() === now.getFullYear()) day = fmtDayMonth.format(d);
  else day = formatDate(d);
  return `${day} ob ${formatTime(d)}`;
}

/** "sreda, 5. oktober" (the year is added only when it is not the current one) */
export function formatWeekdayDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (!valid(d)) return '—';
  const base = fmtWeekdayDate.format(d);
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** "danes" · "jutri" · "pojutrišnjem" for the next three days, otherwise null */
export function nearDayHint(iso: string, now: Date = new Date()): string | null {
  const d = new Date(iso);
  if (!valid(d)) return null;
  const diff = dayDiff(d, now);
  return diff >= 0 && diff <= 2 ? formatRelativeDay(d, now) : null;
}

/** "14:30–15:00" */
export function formatClockRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)}–${formatTime(endIso)}`;
}

/** Minutes between two ISO dates, rounded. */
export function minutesBetween(startIso: string, endIso: string): number {
  return Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000));
}

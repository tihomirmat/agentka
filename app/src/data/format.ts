/**
 * Slovenian formatting helpers. Everything a screen prints (dates, times, durations,
 * money, counts) goes through here so the whole product reads the same.
 *
 * THE DATE RULE (one for the whole product — do not write a second helper in a page):
 *   - a moment in a list or a card  → formatRelativeDateTime: "danes ob 14:30",
 *     "včeraj ob 09:05", "jutri ob 10:00", otherwise weekday + date: "sob., 3. okt. ob 13:22"
 *     (the year is added only when it is not the current one);
 *   - a day as a heading            → formatWeekdayDate: "sobota, 3. oktober";
 *   - a date in a document or table → formatDate: "3. okt. 2026";
 *   - the time is always 24-hour with two digits: "08:05", "14:30";
 *   - a length of time              → formatDuration: "8 min 18 s" (never "08:18", which reads
 *     as a time of day); a position inside a recording → formatTimecode: "01:24".
 */
import type { IsoDate } from './types';

const LOCALE = 'sl-SI';

type DateInput = IsoDate | Date | number;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

function isValid(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

const fmtDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateLong = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const fmtWeekdayShortDate = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
const fmtWeekdayShortDateYear = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const fmtWeekdayLongDate = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
// hourCycle is fixed, so the clock is 24-hour whatever the device prefers.
const fmtTime = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fmtEur0 = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const fmtEur2 = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtNumber = new Intl.NumberFormat(LOCALE);
const fmtPercent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 });

/** "3. okt. 2026" */
export function formatDate(value: DateInput): string {
  const d = toDate(value);
  return isValid(d) ? fmtDate.format(d) : '—';
}

/** "sobota, 3. oktober 2026" */
export function formatDateLong(value: DateInput): string {
  const d = toDate(value);
  return isValid(d) ? fmtDateLong.format(d) : '—';
}

/** "14:30" */
export function formatTime(value: DateInput): string {
  const d = toDate(value);
  return isValid(d) ? fmtTime.format(d) : '—';
}

/** "3. okt. 2026 ob 14:30" */
export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  return isValid(d) ? `${fmtDate.format(d)} ob ${fmtTime.format(d)}` : '—';
}

/** Whole calendar days from today to the given date (negative = past). */
export function dayDiff(value: DateInput, now: Date = new Date()): number {
  const d = toDate(value);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
}

/**
 * "danes" · "včeraj" · "jutri" · otherwise weekday + date: "sob., 3. okt."
 * (with the year when it is not the current one: "sob., 3. okt. 2025").
 */
export function formatRelativeDay(value: DateInput, now: Date = new Date()): string {
  const d = toDate(value);
  if (!isValid(d)) return '—';
  const diff = dayDiff(d, now);
  if (diff === 0) return 'danes';
  if (diff === -1) return 'včeraj';
  if (diff === 1) return 'jutri';
  return d.getFullYear() === now.getFullYear() ? fmtWeekdayShortDate.format(d) : fmtWeekdayShortDateYear.format(d);
}

/** "danes ob 14:30" · "včeraj ob 09:05" · "sob., 3. okt. ob 11:00" */
export function formatRelativeDateTime(value: DateInput, now: Date = new Date()): string {
  const d = toDate(value);
  if (!isValid(d)) return '—';
  return `${formatRelativeDay(d, now)} ob ${fmtTime.format(d)}`;
}

/** "sobota, 3. oktober" (the year is added only when it is not the current one). For day headings. */
export function formatWeekdayDate(value: DateInput, now: Date = new Date()): string {
  const d = toDate(value);
  if (!isValid(d)) return '—';
  const base = fmtWeekdayLongDate.format(d);
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** "danes" or "jutri" for the next two days, otherwise null. A small hint next to a full date. */
export function nearDayHint(value: DateInput, now: Date = new Date()): string | null {
  const d = toDate(value);
  if (!isValid(d)) return null;
  const diff = dayDiff(d, now);
  return diff === 0 || diff === 1 ? formatRelativeDay(d, now) : null;
}

/** "3. okt. 2026, 14:30–15:00" */
export function formatTimeRange(start: DateInput, end: DateInput): string {
  const s = toDate(start);
  const e = toDate(end);
  if (!isValid(s) || !isValid(e)) return '—';
  return `${fmtDate.format(s)}, ${fmtTime.format(s)}–${fmtTime.format(e)}`;
}

/** "14:30–15:00" */
export function formatClockRange(start: DateInput, end: DateInput): string {
  const s = toDate(start);
  const e = toDate(end);
  if (!isValid(s) || !isValid(e)) return '—';
  return `${fmtTime.format(s)}–${fmtTime.format(e)}`;
}

/** Whole minutes between two moments (never negative). */
export function minutesBetween(start: DateInput, end: DateInput): number {
  return Math.max(0, Math.round((toDate(end).getTime() - toDate(start).getTime()) / 60_000));
}

/** "09:00" → 540. For comparing and stepping the "HH:MM" strings of working hours. */
export function clockToMinutes(clock: string): number {
  const [h, m] = clock.split(':');
  return Number(h) * 60 + Number(m ?? 0);
}

/** 540 → "09:00" (always two digits, 24-hour). */
export function minutesToClock(minutes: number): string {
  const total = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * A length of time in words: 498 → "8 min 18 s", 45 → "45 s", 480 → "8 min".
 * Never "08:18" — next to a date that reads as a time of day.
 */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  if (mm === 0) return `${ss} s`;
  if (ss === 0) return `${fmtNumber.format(mm)} min`;
  return `${fmtNumber.format(mm)} min ${ss} s`;
}

/** A position inside a conversation: 84 → "01:24". Only for the time marks of transcript turns. */
export function formatTimecode(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/** 86 → "86 min" */
export function formatMinutes(min: number): string {
  return `${fmtNumber.format(Math.round(min))} min`;
}

/** (86, 300) → "86 / 300 min" */
export function formatMinutesOf(used: number, included: number): string {
  return `${fmtNumber.format(Math.round(used))} / ${fmtNumber.format(Math.round(included))} min`;
}

/** 59 → "59 €" · 12.5 → "12,50 €". Whole amounts print without cents. */
export function formatEur(amount: number): string {
  return Number.isInteger(amount) ? fmtEur0.format(amount) : fmtEur2.format(amount);
}

/** Always two decimals: 59 → "59,00 €" (invoices). */
export function formatEurExact(amount: number): string {
  return fmtEur2.format(amount);
}

/** 59 → "59 € na mesec" */
export function formatPricePerMonth(amount: number): string {
  return `${formatEur(amount)} na mesec`;
}

/** 12480 → "12.480" */
export function formatNumber(n: number): string {
  return fmtNumber.format(n);
}

/** 0.29 → "29 %" */
export function formatPercent(ratio: number): string {
  return fmtPercent.format(ratio);
}

/**
 * Slovenian has four number forms. forms = [1, 2, 3–4, 5+ and 0]
 * plural(1, ['pogovor','pogovora','pogovori','pogovorov']) → "1 pogovor"
 */
export function plural(n: number, forms: [string, string, string, string]): string {
  const abs = Math.abs(n) % 100;
  let word: string;
  if (abs === 1) word = forms[0];
  else if (abs === 2) word = forms[1];
  else if (abs === 3 || abs === 4) word = forms[2];
  else word = forms[3];
  return `${fmtNumber.format(n)} ${word}`;
}

/** Word forms for plural(): [1, 2, 3–4, 5+ and 0]. One set per noun, used everywhere. */
export const DAY_FORMS: [string, string, string, string] = ['dan', 'dneva', 'dnevi', 'dni'];
export const MINUTE_FORMS: [string, string, string, string] = ['minuta', 'minuti', 'minute', 'minut'];

/** 3 → "še 3 dnevi" · 1 → "še 1 dan" · 0 → "še danes". Days left of a trial or a period. */
export function formatDaysLeft(days: number): string {
  const n = Math.max(0, Math.round(days));
  return n === 0 ? 'še danes' : `še ${plural(n, DAY_FORMS)}`;
}

/** { days: 14, minutes: 30 } → "14 dni in 30 minut pogovorov". The terms of the free trial. */
export function formatTrialTerms(terms: { days: number; minutes: number }): string {
  return `${plural(terms.days, DAY_FORMS)} in ${plural(terms.minutes, MINUTE_FORMS)} pogovorov`;
}

/** "https://spletnost.si/kontakt/" → "spletnost.si/kontakt/" */
export function formatUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
}

/** "https://spletnost.si/kontakt/" → "spletnost.si" */
export function domainOf(url: string): string {
  return formatUrl(url).split('/')[0] ?? '';
}

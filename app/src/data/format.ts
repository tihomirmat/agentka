/**
 * Slovenian formatting helpers. Everything a screen prints (dates, times, durations,
 * money, counts) goes through here so the whole product reads the same.
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
const fmtDayMonth = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const fmtTime = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const fmtWeekday = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' });
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

/** "danes" · "včeraj" · "jutri" · "v torek" · "3. okt." (older or later than a week: short date) */
export function formatRelativeDay(value: DateInput, now: Date = new Date()): string {
  const d = toDate(value);
  if (!isValid(d)) return '—';
  const diff = dayDiff(d, now);
  if (diff === 0) return 'danes';
  if (diff === -1) return 'včeraj';
  if (diff === -2) return 'predvčerajšnjim';
  if (diff === 1) return 'jutri';
  if (diff === 2) return 'pojutrišnjem';
  if (diff > 2 && diff < 7) return fmtWeekday.format(d);
  if (d.getFullYear() === now.getFullYear()) return fmtDayMonth.format(d);
  return fmtDate.format(d);
}

/** "danes ob 14:30" · "včeraj ob 09:05" · "3. okt. ob 11:00" */
export function formatRelativeDateTime(value: DateInput, now: Date = new Date()): string {
  const d = toDate(value);
  if (!isValid(d)) return '—';
  return `${formatRelativeDay(d, now)} ob ${fmtTime.format(d)}`;
}

/** "3. okt. 2026, 14:30–15:00" */
export function formatTimeRange(start: DateInput, end: DateInput): string {
  const s = toDate(start);
  const e = toDate(end);
  if (!isValid(s) || !isValid(e)) return '—';
  return `${fmtDate.format(s)}, ${fmtTime.format(s)}–${fmtTime.format(e)}`;
}

/** Seconds → "mm:ss" (e.g. 185 → "03:05"). Used for conversation length and transcript marks. */
export function formatDuration(totalSec: number): string {
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

/** "https://spletnost.si/kontakt/" → "spletnost.si/kontakt/" */
export function formatUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
}

/** "https://spletnost.si/kontakt/" → "spletnost.si" */
export function domainOf(url: string): string {
  return formatUrl(url).split('/')[0] ?? '';
}

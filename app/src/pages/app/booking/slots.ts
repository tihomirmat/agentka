import { dayDiff } from '@/data/format';
import type { BookingSettings, Weekday } from '@/data/types';

/** The settings that decide which slots exist. */
export type SlotSettings = Pick<
  BookingSettings,
  'working_hours' | 'appointment_length_min' | 'buffer_min' | 'min_notice_hours' | 'max_days_ahead'
>;

export interface SlotPreview {
  /** the first day on which the agent would offer anything */
  day: Date;
  /** whole days from today */
  daysFromNow: number;
  /** at most `count` slots of that day, earliest first */
  slots: { start: Date; end: Date }[];
}

const KEY_BY_JS_DAY: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const HOUR = 3_600_000;
const MINUTE = 60_000;

/** "08:30" → 510; null when the text is not a time. */
export function toMinutes(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** true when a working day has a valid start that is before its end */
export function isValidDay(from: string, to: string): boolean {
  const a = toMinutes(from);
  const b = toMinutes(to);
  return a !== null && b !== null && a < b;
}

/**
 * The first slots the agent would offer, computed from the settings alone: working hours,
 * appointment length, break, minimum notice and days ahead. It does not know the calendar,
 * so busy times are not removed — the screen says so.
 */
export function previewSlots(s: SlotSettings, now: Date = new Date(), count = 3): SlotPreview | null {
  const length = s.appointment_length_min;
  const buffer = s.buffer_min;
  if (!Number.isFinite(length) || length <= 0 || !Number.isFinite(buffer) || buffer < 0) return null;
  if (!Number.isFinite(s.min_notice_hours) || !Number.isFinite(s.max_days_ahead)) return null;

  const earliest = now.getTime() + Math.max(0, s.min_notice_hours) * HOUR;
  const latest = now.getTime() + Math.max(0, s.max_days_ahead) * 24 * HOUR;
  const step = length + buffer;

  for (let d = 0; d <= Math.ceil(s.max_days_ahead) + 1; d += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const hours = s.working_hours[KEY_BY_JS_DAY[day.getDay()] as Weekday];
    if (!hours.open) continue;
    const from = toMinutes(hours.from);
    const to = toMinutes(hours.to);
    if (from === null || to === null || from >= to) continue;

    const slots: SlotPreview['slots'] = [];
    for (let t = from; t + length <= to && slots.length < count; t += step) {
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, t);
      if (start.getTime() < earliest) continue;
      if (start.getTime() > latest) break;
      slots.push({ start, end: new Date(start.getTime() + length * MINUTE) });
    }
    if (slots.length > 0) return { day, daysFromNow: dayDiff(day, now), slots };
  }
  return null;
}

const WEEKDAY_ACCUSATIVE = ['v nedeljo', 'v ponedeljek', 'v torek', 'v sredo', 'v četrtek', 'v petek', 'v soboto'];
const MONTH_GENITIVE = [
  'januarja',
  'februarja',
  'marca',
  'aprila',
  'maja',
  'junija',
  'julija',
  'avgusta',
  'septembra',
  'oktobra',
  'novembra',
  'decembra',
];

/** How the agent names the day: "danes", "jutri", "v torek", "v torek, 14. oktobra". */
export function spokenDay(day: Date, daysFromNow: number): string {
  if (daysFromNow <= 0) return 'danes';
  if (daysFromNow === 1) return 'jutri';
  if (daysFromNow === 2) return 'pojutrišnjem';
  const weekday = WEEKDAY_ACCUSATIVE[day.getDay()] ?? '';
  if (daysFromNow < 7) return weekday;
  return `${weekday}, ${day.getDate()}. ${MONTH_GENITIVE[day.getMonth()] ?? ''}`;
}

/** "9.00", "9.30", "14.45" */
export function spokenTime(d: Date): string {
  return `${d.getHours()}.${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "9.00", "9.00 ali 9.30", "9.00, 9.30 ali 10.00" */
export function spokenList(times: string[]): string {
  if (times.length <= 1) return times[0] ?? '';
  return `${times.slice(0, -1).join(', ')} ali ${times[times.length - 1]}`;
}

/** The sentence the agent says: "Prosti termini so v torek ob 9.00, 9.30 ali 10.00." */
export function offerSentence(preview: SlotPreview): string {
  const n = preview.slots.length;
  const lead = n === 1 ? 'Prost termin je' : n === 2 ? 'Prosta termina sta' : 'Prosti termini so';
  const day = spokenDay(preview.day, preview.daysFromNow);
  const times = spokenList(preview.slots.map((s) => spokenTime(s.start)));
  return `${lead} ${day} ob ${times}.`;
}

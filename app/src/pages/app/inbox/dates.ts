/**
 * Kept only so the existing imports of Pogovori / Kontakti / Rezervacije keep working.
 * The date rule lives in ONE place, src/data/format.ts — import from there in new code and
 * delete this file once the last import is gone (migration note in CONVENTIONS.md).
 */
export {
  formatRelativeDateTime as formatListDateTime,
  formatWeekdayDate,
  nearDayHint,
  formatClockRange,
  minutesBetween,
} from '@/data/format';

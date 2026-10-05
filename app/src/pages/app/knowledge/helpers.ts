import { plural } from '@/data/format';
import type { KnowledgeSource } from '@/data/types';

/** Lower-case and without diacritics, so "oglasevanje" finds "Oglaševanje". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** First line of a text that is not empty. */
export function firstLine(text: string | null): string {
  if (!text) return '';
  return text.split('\n').find((line) => line.trim().length > 0)?.trim() ?? '';
}

export const SYNC_CHOICES = [1, 3, 7, 14, 30];

/** "vsak dan", "vsake 3 dni", "vsakih 7 dni" */
export function everyDays(n: number): string {
  if (n === 1) return 'vsak dan';
  if (n === 3 || n === 4) return `vsake ${n} dni`;
  return `vsakih ${n} dni`;
}

export function chars(n: number): string {
  return plural(n, ['znak', 'znaka', 'znaki', 'znakov']);
}

/** "3 strani so vključene" / "2 strani sta izključeni" — the verb and the ending follow the number. */
export function pagesNowIncluded(n: number, included: boolean): string {
  const word = included ? 'vključen' : 'izključen';
  const abs = n % 100;
  if (abs === 1) return plural(n, [`stran je ${word}a`, '', '', '']);
  if (abs === 2) return plural(n, ['', `strani sta ${word}i`, '', '']);
  if (abs === 3 || abs === 4) return plural(n, ['', '', `strani so ${word}e`, '']);
  return plural(n, ['', '', '', `strani je ${word}ih`]);
}

export function fileKind(source: KnowledgeSource): string {
  const m = /\.([a-z0-9]+)$/i.exec(source.title);
  return m?.[1] ? m[1].toUpperCase() : 'Datoteka';
}

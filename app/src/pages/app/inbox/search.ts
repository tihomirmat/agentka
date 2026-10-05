/** Lower case without diacritics, so "zupancic" finds "Zupančič". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();
}

/** True when every word of `query` occurs somewhere in the haystack strings. */
export function matchesAllWords(haystack: (string | null | undefined)[], query: string): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = normalizeText(haystack.filter(Boolean).join(' \n '));
  return words.every((w) => text.includes(w));
}

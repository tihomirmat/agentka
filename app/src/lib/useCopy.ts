import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'selected';

/** What really happened after a click on a copy control. */
export type CopyOutcome = 'copied' | 'selected';

function isTouch(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

/**
 * Short text for the control itself when the browser refused the clipboard and the text was
 * only selected. A keyboard hint means nothing on a phone, so touch screens get their own.
 */
export function copyFallbackHint(): string {
  return isTouch() ? 'Označeno. Pridržite in izberite Kopiraj.' : 'Označeno. Kopirajte s Ctrl+C (Mac: Cmd+C).';
}

/**
 * Full sentence for a page that wants to say what happened to "the code" (install checklist):
 *   copyFallbackSentence('Kodo') → "Kodo ste označili. Kopirajte jo s Ctrl+C (na Macu Cmd+C)."
 */
export function copyFallbackSentence(what = 'Kodo'): string {
  return isTouch()
    ? `${what} ste označili. Pridržite označeno besedilo in izberite Kopiraj.`
    : `${what} ste označili. Kopirajte jo s Ctrl+C (na Macu Cmd+C).`;
}

/**
 * Copy text to the clipboard from a click handler.
 *
 * - Calls navigator.clipboard.writeText inside the user gesture.
 * - If the browser refuses (no permission, insecure frame — the preview host does this), it
 *   selects the text of `fallbackEl` instead, so the person can copy it by hand.
 * - `copy()` resolves to what REALLY happened: 'copied' only after the clipboard accepted
 *   the text, 'selected' when it was only marked. Never treat a click as a copy.
 * - State returns to 'idle' after `resetMs`.
 */
export function useCopy(resetMs = 2500) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    (text: string, fallbackEl?: HTMLElement | null): Promise<CopyOutcome> => {
      const finish = (next: CopyOutcome): CopyOutcome => {
        setState(next);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setState('idle'), next === 'selected' ? resetMs * 2 : resetMs);
        return next;
      };

      const selectFallback = (): CopyOutcome => {
        try {
          if (fallbackEl) {
            if (fallbackEl instanceof HTMLInputElement || fallbackEl instanceof HTMLTextAreaElement) {
              fallbackEl.focus();
              fallbackEl.select();
            } else {
              const range = document.createRange();
              range.selectNodeContents(fallbackEl);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        } catch {
          /* nothing more we can do */
        }
        return finish('selected');
      };

      try {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
          return Promise.resolve(selectFallback());
        }
        return navigator.clipboard.writeText(text).then(
          () => finish('copied'),
          () => selectFallback(),
        );
      } catch {
        return Promise.resolve(selectFallback());
      }
    },
    [resetMs],
  );

  return { copy, state, copied: state === 'copied', selected: state === 'selected' };
}

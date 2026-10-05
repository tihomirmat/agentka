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
 * What was marked, in the grammatical form the sentence needs: the noun in the accusative
 * (`object`, with a capital letter) and the pronoun that stands for it (`pronoun`: "jo" for
 * "Kodo", "ga" for "Besedilo" and "Sporočilo", "jih" for plural nouns).
 */
export interface CopyFallbackSubject {
  object: string;
  pronoun: 'jo' | 'ga' | 'jih';
}

/**
 * Full sentence for a page that wants to say what happened to the thing the person tried to copy:
 *   copyFallbackSentence({ object: 'Kodo', pronoun: 'jo' })
 *     → "Kodo ste označili. Kopirajte jo s Ctrl+C (na Macu Cmd+C)."
 *   copyFallbackSentence({ object: 'Besedilo', pronoun: 'ga' })
 *     → "Besedilo ste označili. Kopirajte ga s Ctrl+C (na Macu Cmd+C)."
 *   copyFallbackSentence({ object: 'Sporočilo', pronoun: 'ga' })
 * A plain string is the old call, kept working: it means a feminine noun ("Kodo" → "jo").
 */
export function copyFallbackSentence(what: string | CopyFallbackSubject = 'Kodo'): string {
  const { object, pronoun } = typeof what === 'string' ? { object: what, pronoun: 'jo' as const } : what;
  return isTouch()
    ? `${object} ste označili. Pridržite označeno besedilo in izberite Kopiraj.`
    : `${object} ste označili. Kopirajte ${pronoun} s Ctrl+C (na Macu Cmd+C).`;
}

/**
 * Does this document's permissions policy allow the clipboard write at all? The preview host
 * frames the app without it, and calling writeText there makes the browser log a
 * "permissions policy violation" in the console even though the call is caught. The API is
 * not in every browser (older ones call it featurePolicy), so an unknown answer means "try".
 */
function clipboardWriteAllowed(): boolean {
  try {
    const doc = document as unknown as Record<string, { allowsFeature?: (feature: string) => boolean } | undefined>;
    const policy = doc.permissionsPolicy ?? doc.featurePolicy;
    return policy?.allowsFeature?.('clipboard-write') !== false;
  } catch {
    return true;
  }
}

/**
 * Copy text to the clipboard from a click handler.
 *
 * - Calls navigator.clipboard.writeText inside the user gesture — unless the document's
 *   permissions policy already says no (clipboardWriteAllowed), so the console stays clean.
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
        if (!clipboardWriteAllowed() || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
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

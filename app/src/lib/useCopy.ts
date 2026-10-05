import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'selected';

/**
 * Copy text to the clipboard from a click handler.
 *
 * - Calls navigator.clipboard.writeText inside the user gesture.
 * - If the browser refuses (no permission, insecure frame), it selects the text of
 *   `fallbackRef` instead, so the person can press Ctrl/Cmd+C. State becomes 'selected'.
 * - State returns to 'idle' after `resetMs`.
 */
export function useCopy(resetMs = 2000) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    (text: string, fallbackEl?: HTMLElement | null) => {
      const finish = (next: CopyState) => {
        setState(next);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setState('idle'), resetMs);
      };

      const selectFallback = () => {
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
        finish('selected');
      };

      try {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
          selectFallback();
          return;
        }
        navigator.clipboard.writeText(text).then(
          () => finish('copied'),
          () => selectFallback(),
        );
      } catch {
        selectFallback();
      }
    },
    [resetMs],
  );

  return { copy, state, copied: state === 'copied', selected: state === 'selected' };
}

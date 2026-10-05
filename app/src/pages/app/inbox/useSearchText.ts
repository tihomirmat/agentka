import { useEffect, useRef, useState } from 'react';

/**
 * Text of a search field that is mirrored into the URL after a short pause.
 * `urlValue` is what the URL says now; `commit` writes a new value to the URL.
 * When the URL changes from outside (menu link, "Počisti filtre", back button) the field follows it.
 */
export function useSearchText(urlValue: string, commit: (value: string) => void, delay = 220) {
  const [text, setText] = useState(urlValue);
  const written = useRef(urlValue);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    if (urlValue !== written.current) {
      written.current = urlValue;
      setText(urlValue);
    }
  }, [urlValue]);

  useEffect(() => {
    if (text === written.current) return;
    const timer = window.setTimeout(() => {
      written.current = text;
      commitRef.current(text);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [text, delay]);

  return [text, setText] as const;
}

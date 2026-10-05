import { useLayoutEffect, useState } from 'react';

/**
 * Width of an element, kept up to date. Used to choose between a table and stacked cards by the
 * room the content really has (the sidebar eats 15rem), not by the width of the window.
 *   const [ref, width] = useContainerWidth();  <div ref={ref}>…</div>
 */
export function useContainerWidth() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w !== undefined) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);

  return [setEl, width] as const;
}

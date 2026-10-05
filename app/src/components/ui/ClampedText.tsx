import { useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const CLAMP = { 2: 'line-clamp-2', 3: 'line-clamp-3' } as const;

export interface ClampedTextProps {
  text: string;
  lines?: 2 | 3;
  className?: string;
}

/** Text cut after a few lines. Only when something is actually cut, a "Pokaži vse" button appears. */
export function ClampedText({ text, lines = 2, className }: ClampedTextProps) {
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [cut, setCut] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const measure = () => setCut(el.scrollHeight - el.clientHeight > 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, lines, expanded]);

  return (
    <div className={cn('min-w-0', className)}>
      <p ref={ref} id={id} className={cn('break-words', !expanded && CLAMP[lines])}>
        {text}
      </p>
      {cut || expanded ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 rounded text-xs font-medium text-fg-muted underline underline-offset-2 hover:text-fg hover:no-underline"
        >
          {expanded ? 'Pokaži manj' : 'Pokaži vse'}
        </button>
      ) : null}
    </div>
  );
}

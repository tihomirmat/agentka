import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ProgressBar } from './ProgressBar';

export interface StatProps {
  /** short name of the number; it may wrap onto two lines, it is never cut */
  label: string;
  /** the number, already formatted (use src/data/format.ts) */
  value: ReactNode;
  /** small unit or second number after the value: "/ 300 min" */
  unit?: ReactNode;
  /** quiet line under the value: "v tem obdobju" */
  sub?: ReactNode;
  /** draws a usage bar under the value */
  progress?: { value: number; max: number };
  /**
   * 'card' (default): a bordered box, several in a grid at the top of a page.
   * 'inline': no box — for a row of numbers INSIDE a card or above a list (put them in a
   * `flex flex-wrap gap-x-8 gap-y-4`); the same anatomy, smaller value.
   */
  variant?: 'card' | 'inline';
  className?: string;
}

/**
 * One number with its name — THE summary number of the product (Pregled, Pogovori, admin).
 * The label says exactly what is counted (labels.ts → COUNT_LABELS); two numbers that can
 * differ never share a name.
 */
export function Stat({ label, value, unit, sub, progress, variant = 'card', className }: StatProps) {
  const inline = variant === 'inline';
  return (
    <div
      className={cn(
        'min-w-0',
        inline ? null : 'rounded-lg border border-border bg-surface px-4 py-3.5 sm:px-5',
        className,
      )}
    >
      <p className="eyebrow break-words">{label}</p>
      <div className="pt-1.5">
        <p className="flex min-w-0 items-baseline gap-1.5">
          <span
            className={cn('nums font-display font-semibold tracking-tight text-fg', inline ? 'text-xl' : 'text-2xl')}
          >
            {value}
          </span>
          {unit ? <span className="nums truncate text-sm text-fg-muted">{unit}</span> : null}
        </p>
        {progress ? <ProgressBar className="mt-2.5" label={label} value={progress.value} max={progress.max} /> : null}
        {sub ? <p className="mt-1.5 text-sm text-fg-subtle">{sub}</p> : null}
      </div>
    </div>
  );
}

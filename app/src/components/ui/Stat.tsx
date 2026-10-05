import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ProgressBar } from './ProgressBar';

export interface StatProps {
  label: string;
  /** the number, already formatted (use src/data/format.ts) */
  value: ReactNode;
  /** small unit or second number after the value: "/ 300 min" */
  unit?: ReactNode;
  /** quiet line under the value: "v tem obdobju" */
  sub?: ReactNode;
  /** draws a usage bar under the value */
  progress?: { value: number; max: number };
  className?: string;
}

/** One number with its name. Put several in a grid; they are not cards with shadows. */
export function Stat({ label, value, unit, sub, progress, className }: StatProps) {
  return (
    <div className={cn('min-w-0 rounded-lg border border-border bg-surface px-4 py-3.5 sm:px-5', className)}>
      <p className="eyebrow truncate">{label}</p>
      <p className="mt-1.5 flex min-w-0 items-baseline gap-1.5">
        <span className="nums font-display text-2xl font-semibold tracking-tight text-fg">{value}</span>
        {unit ? <span className="nums truncate text-sm text-fg-muted">{unit}</span> : null}
      </p>
      {progress ? <ProgressBar className="mt-2.5" label={label} value={progress.value} max={progress.max} /> : null}
      {sub ? <p className="mt-1.5 truncate text-sm text-fg-subtle">{sub}</p> : null}
    </div>
  );
}

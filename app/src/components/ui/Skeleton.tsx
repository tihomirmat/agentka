import { cn } from '@/lib/cn';

export interface SkeletonProps {
  /** size with Tailwind classes: "h-4 w-40" */
  className?: string;
}

/** A grey placeholder while data loads. Shape it like the thing it stands for. */
export function Skeleton({ className }: SkeletonProps) {
  return <span aria-hidden="true" className={cn('block rounded bg-surface-3 motion-safe:animate-skeleton-pulse', className)} />;
}

/** Placeholder for a list or table body: `rows` lines with a few bars each. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  const widths = ['w-1/3', 'w-1/2', 'w-2/5', 'w-1/4', 'w-3/5'];
  return (
    <div className={cn('min-w-0', className)} role="status" aria-label="Nalaganje">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5">
          <Skeleton className={cn('h-4', widths[i % widths.length])} />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a block of text or a form: `lines` bars of different length. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3'];
  return (
    <div className={cn('flex min-w-0 flex-col gap-2.5', className)} role="status" aria-label="Nalaganje">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-1/2' : widths[i % widths.length])} />
      ))}
    </div>
  );
}

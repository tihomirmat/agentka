import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TONE_DOT, TONE_SOFT, type Tone } from './Badge';

export interface StatusPillProps {
  tone?: Tone;
  children: ReactNode;
  /** the dot pulses — only for something that is in progress right now */
  live?: boolean;
  className?: string;
}

/**
 * The state of something: a dot plus a word. The word carries the meaning, the colour
 * only supports it — so never use a pill without text.
 */
export function StatusPill({ tone = 'neutral', children, live = false, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-0.5 pl-2 pr-2.5 text-xs font-medium',
        TONE_SOFT[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[tone], live && 'motion-safe:animate-skeleton-pulse')}
      />
      {children}
    </span>
  );
}

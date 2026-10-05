import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TranscriptBubbleProps {
  role: 'agent' | 'visitor';
  /** who is speaking, shown above the bubble: the agent's name or "Obiskovalec" */
  speaker: string;
  /** already formatted time mark, e.g. formatDuration(turn.timeSec) → "01:24" */
  time?: string;
  children: ReactNode;
}

/** One turn of a saved conversation (Pogovori → detail). Agent left, visitor right. */
export function TranscriptBubble({ role, speaker, time, children }: TranscriptBubbleProps) {
  const agent = role === 'agent';
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', agent ? 'items-start' : 'items-end')}>
      <p className="flex items-baseline gap-2 text-xs text-fg-subtle">
        <span className="font-medium text-fg-muted">{speaker}</span>
        {time ? <span className="nums font-mono">{time}</span> : null}
      </p>
      <p
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-base sm:max-w-[75%]',
          agent ? 'bg-surface-2 text-fg' : 'bg-accent-soft text-accent-soft-fg',
        )}
      >
        {children}
      </p>
    </div>
  );
}

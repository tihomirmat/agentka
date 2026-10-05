import { useRef } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copyFallbackHint, useCopy } from '@/lib/useCopy';
import { Tooltip } from './Tooltip';

export interface CopyValueProps {
  /** e-mail address, phone number, id … shown as selectable text */
  value: string;
  /** what gets copied: "Kopiraj e-naslov" */
  copyLabel: string;
  mono?: boolean;
  className?: string;
}

/**
 * Selectable text with a small copy button. Use it for e-mail addresses and phone
 * numbers — the preview may not open mail or phone links, so they are never links.
 * The button looks small but its hit area is 40×40 on touch screens.
 */
export function CopyValue({ value, copyLabel, mono = false, className }: CopyValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { copy, state } = useCopy();
  const shown = state === 'copied' ? 'Kopirano' : state === 'selected' ? copyFallbackHint() : copyLabel;
  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-1', className)}>
      <span ref={ref} className={cn('min-w-0 select-all truncate', mono && 'font-mono text-sm')}>
        {value}
      </span>
      <Tooltip content={shown} open={state === 'idle' ? undefined : true}>
        <button
          type="button"
          aria-label={shown}
          onClick={() => void copy(value, ref.current)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-10"
        >
          {state === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        </button>
      </Tooltip>
    </span>
  );
}

import { useRef } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCopy } from '@/lib/useCopy';
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
 */
export function CopyValue({ value, copyLabel, mono = false, className }: CopyValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { copy, state } = useCopy();
  const shown = state === 'copied' ? 'Kopirano' : state === 'selected' ? 'Označeno, pritisnite Ctrl+C' : copyLabel;
  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-1', className)}>
      <span ref={ref} className={cn('min-w-0 select-all truncate', mono && 'font-mono text-sm')}>
        {value}
      </span>
      <Tooltip content={shown}>
        <button
          type="button"
          aria-label={shown}
          onClick={() => copy(value, ref.current)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          {state === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        </button>
      </Tooltip>
    </span>
  );
}

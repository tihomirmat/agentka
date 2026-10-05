import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { CopyButton } from './CopyButton';

export interface CodeBlockProps {
  code: string;
  /** what the code is: "Koda za vgradnjo" */
  label: string;
  copyLabel?: string;
  onCopied?: () => void;
  className?: string;
}

/** A box with code and a copy button (the embed code). Long lines wrap; the page never scrolls sideways. */
export function CodeBlock({ code, label, copyLabel = 'Kopiraj kodo', onCopied, className }: CodeBlockProps) {
  const ref = useRef<HTMLElement>(null);
  return (
    <div className={cn('min-w-0 overflow-hidden rounded-lg border border-border bg-surface-2', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border py-2 pl-4 pr-2">
        <span className="eyebrow truncate">{label}</span>
        <CopyButton text={code} targetRef={ref} label={copyLabel} onCopied={onCopied} />
      </div>
      <pre className="m-0 whitespace-pre-wrap break-all px-4 py-3 font-mono text-sm text-fg">
        <code ref={ref}>{code}</code>
      </pre>
    </div>
  );
}

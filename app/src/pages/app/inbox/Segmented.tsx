import { cn } from '@/lib/cn';

export interface SegmentedProps<V extends string> {
  /** what the control chooses, for screen readers: "Obdobje" */
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: { value: V; label: string }[];
  className?: string;
}

/** A short row of mutually exclusive choices (period, outcome). Each segment is a toggle button. */
export function Segmented<V extends string>({ label, value, onChange, options, className }: SegmentedProps<V>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex h-10 shrink-0 items-stretch rounded border border-border-strong bg-surface p-1',
        className,
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'whitespace-nowrap rounded-sm px-3 text-sm font-medium transition-colors duration-100',
              on ? 'bg-accent-soft text-accent-soft-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

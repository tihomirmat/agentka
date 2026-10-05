import { cn } from '@/lib/cn';
import type { ChoiceItem } from './Segmented';

export interface FilterChipsProps<V extends string> {
  /** what is filtered, for screen readers: "Stanje kontakta" */
  label: string;
  value: V;
  onChange: (value: V) => void;
  /** the first option is normally "Vsi"; give `count` to show how many rows each holds */
  options: ChoiceItem<V>[];
  className?: string;
}

/**
 * Filter a list by state: one chip per state, with the number of rows it holds. The chips
 * wrap onto more lines on a phone, so every state and its count stays visible. The chip's
 * word must be the SAME word the row shows for that state (labels.ts), never a synonym.
 * To switch a view between a few short options, use <Segmented>.
 */
export function FilterChips<V extends string>({ label, value, onChange, options, className }: FilterChipsProps<V>) {
  return (
    <div role="group" aria-label={label} className={cn('flex min-w-0 flex-wrap gap-2', className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors duration-100 [@media(pointer:coarse)]:h-10',
              on
                ? 'border-accent bg-accent-soft text-accent-soft-fg'
                : 'border-border-strong bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg',
            )}
          >
            {o.label}
            {o.count !== undefined ? <span className="nums font-normal opacity-80">{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

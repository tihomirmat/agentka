import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { Select } from './Select';

export interface ChoiceItem<V extends string> {
  value: V;
  label: string;
  /** optional number shown after the label (how many rows this choice holds) */
  count?: number;
}

export interface SegmentedProps<V extends string> {
  /** what the control chooses, for screen readers: "Obdobje" */
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: ChoiceItem<V>[];
  /**
   * Below 480px the segments become one Select (default). Pass false only when the options
   * are two or three very short words that fit a phone.
   */
  collapse?: boolean;
  className?: string;
}

/**
 * A short row of mutually exclusive choices that switch what a list shows (period, outcome):
 * two to four options with short names. For a filter by STATE with counts that may wrap onto
 * two lines, use <FilterChips>.
 */
export function Segmented<V extends string>({
  label,
  value,
  onChange,
  options,
  collapse = true,
  className,
}: SegmentedProps<V>) {
  const narrow = useMediaQuery('(max-width: 479.98px)');

  if (collapse && narrow) {
    return (
      <Select
        aria-label={label}
        value={value}
        onValueChange={onChange}
        options={options.map((o) => ({
          value: o.value,
          label: o.count === undefined ? o.label : `${o.label} (${o.count})`,
        }))}
        className={className}
      />
    );
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex h-10 max-w-full shrink-0 items-stretch rounded border border-border-strong bg-surface p-1',
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
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-sm font-medium transition-colors duration-100',
              on ? 'bg-accent-soft text-accent-soft-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
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

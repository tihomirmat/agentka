import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Fact {
  label: string;
  value: ReactNode;
  /** the value takes the whole row (a long text, an id with a copy button) */
  wide?: boolean;
}

export interface FactListProps {
  items: Fact[];
  /** columns from the `sm` breakpoint up; always one column on a phone. Default 2. */
  columns?: 1 | 2 | 3;
  className?: string;
}

const COLS = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' };
const WIDE = { 1: '', 2: 'sm:col-span-2', 3: 'sm:col-span-2 lg:col-span-3' };

/**
 * Label–value rows: the quiet label above, the value under it. For the facts of one thing
 * inside a card (a plan, a conversation, an account). A table is for MANY things.
 *
 *   <FactList items={[{ label: 'Paket', value: 'Rast' }, { label: 'Konec obdobja', value: formatDate(d) }]} />
 */
export function FactList({ items, columns = 2, className }: FactListProps) {
  return (
    <dl className={cn('grid min-w-0 gap-x-6 gap-y-4', COLS[columns], className)}>
      {items.map((item) => (
        <div key={item.label} className={cn('min-w-0', item.wide && WIDE[columns])}>
          <dt className="text-sm text-fg-subtle">{item.label}</dt>
          <dd className="nums mt-0.5 min-w-0 break-words text-base text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

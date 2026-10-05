import type { ReactNode } from 'react';

export interface Fact {
  label: string;
  value: ReactNode;
}

/** Label above value, two columns from the sm breakpoint. For short facts inside a card. */
export function Facts({ items }: { items: Fact[] }) {
  return (
    <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-sm text-fg-subtle">{item.label}</dt>
          <dd className="nums mt-0.5 break-words text-base text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

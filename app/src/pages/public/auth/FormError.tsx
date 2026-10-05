import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

/** A readable error for the whole form (the answer of the API). Announced to screen readers. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
      <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

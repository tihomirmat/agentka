/** Small building blocks shared by the cards of Pregled. */
import type { ReactNode } from 'react';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import { Button, CardBody, EmptyState, SkeletonText } from '@/components/ui';
import type { QueryResult } from '@/data/api';
import { cn } from '@/lib/cn';

/** Shown inside a card until all its queries have an answer; an error comes with a retry button. */
export function Pending({ queries, lines = 3 }: { queries: QueryResult<unknown>[]; lines?: number }) {
  const error = queries.find((q) => q.error)?.error;
  if (error) {
    return (
      <EmptyState
        compact
        icon={CircleAlert}
        title={error}
        action={
          <Button size="sm" onClick={() => queries.forEach((q) => q.reload())}>
            Poskusi znova
          </Button>
        }
      />
    );
  }
  return (
    <CardBody>
      <SkeletonText lines={lines} />
    </CardBody>
  );
}

/** Name on the left, value on the right; stays two columns on a phone. */
export function Details({ children }: { children: ReactNode }) {
  return (
    <dl className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
      {children}
    </dl>
  );
}

export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="m-0 min-w-0 text-base text-fg">{children}</dd>
    </>
  );
}

/** A state message inside a card (a failed source, a failed e-mail). */
export function Notice({
  tone,
  title,
  children,
}: {
  tone: 'danger' | 'warning';
  title: ReactNode;
  children?: ReactNode;
}) {
  const Icon = tone === 'danger' ? CircleAlert : TriangleAlert;
  return (
    <div
      role="alert"
      className={cn(
        'flex min-w-0 items-start gap-3 rounded-lg px-3.5 py-3 text-base text-fg',
        tone === 'danger' ? 'bg-danger-soft' : 'bg-warning-soft',
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', tone === 'danger' ? 'text-danger' : 'text-warning')} aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {children ? <div className="mt-0.5 break-words text-sm text-fg-muted">{children}</div> : null}
      </div>
    </div>
  );
}

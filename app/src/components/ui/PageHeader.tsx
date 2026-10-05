import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: ReactNode;
  /** one line: what this page is for */
  description?: ReactNode;
  /** buttons on the right (they move under the title on a phone) */
  actions?: ReactNode;
  /** for detail pages: a link back to the list */
  back?: { to: string; label: string };
  /** small element after the title, e.g. a StatusPill */
  meta?: ReactNode;
  className?: string;
}

/** The first thing on every page. Exactly one per page — it renders the <h1>. */
export function PageHeader({ title, description, actions, back, meta, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 min-w-0', className)}>
      {back ? (
        <Link
          to={back.to}
          className="mb-2 inline-flex items-center gap-1.5 rounded text-sm font-medium text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-display text-xl font-semibold tracking-tight text-fg">{title}</h1>
            {meta}
          </div>
          {description ? <p className="mt-1 max-w-prose text-base text-fg-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

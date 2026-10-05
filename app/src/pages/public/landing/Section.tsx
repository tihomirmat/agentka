import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * One band of the landing page: a rule above, vertical room, the centred column.
 * `scroll-mt-16` keeps a section that is scrolled to from sliding under the sticky header.
 */
export function Section({
  id,
  labelledBy,
  className,
  children,
}: {
  id?: string;
  /** id of the section's h2 */
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn('scroll-mt-16 border-t border-border py-12 md:py-16', className)}>
      <div className="page">{children}</div>
    </section>
  );
}

/** Headline of a section: h2 in the display face, then one quiet sentence. */
export function SectionHead({
  id,
  title,
  lead,
  className,
}: {
  id: string;
  title: string;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <h2 id={id} className="font-display text-3xl font-semibold tracking-tight text-fg">
        {title}
      </h2>
      {lead ? <p className="mt-3 max-w-prose text-md text-fg-muted">{lead}</p> : null}
    </div>
  );
}

import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TableProps {
  children: ReactNode;
  /**
   * Narrowest width (px) at which the columns still read well. On a narrower screen the
   * table scrolls sideways INSIDE its own box; the page itself never does.
   */
  minWidth?: number;
  /** what the table lists, for screen readers */
  caption?: string;
  /** when set (not null/false), it is shown instead of the table — pass an <EmptyState> */
  empty?: ReactNode;
  className?: string;
}

/**
 *   <Card>
 *     <Table minWidth={640} caption="Kontakti" empty={rows.length === 0 && <EmptyState … />}>
 *       <THead><TR><TH>Ime</TH><TH numeric>Trajanje</TH></TR></THead>
 *       <TBody>{rows.map((r) => <TR key={r.id}><TD>…</TD><TD numeric>…</TD></TR>)}</TBody>
 *     </Table>
 *   </Card>
 */
export function Table({ children, minWidth = 560, caption, empty, className }: TableProps) {
  if (empty) return <div className={className}>{empty}</div>;
  return (
    <div
      // `relative` matters: without it, visually hidden (absolute) labels inside the table
      // would widen the page instead of scrolling with the table.
      className={cn('relative min-w-0 overflow-x-auto', className)}
      tabIndex={0}
      role={caption ? 'region' : undefined}
      aria-label={caption}
    >
      <table className="w-full border-collapse text-left text-base" style={{ minWidth }}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function THead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('border-b border-border', className)} {...rest} />;
}

export function TBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&>tr:last-child]:border-b-0', className)} {...rest} />;
}

export interface TRProps extends HTMLAttributes<HTMLTableRowElement> {
  /** hover highlight for rows that lead somewhere (put a real link in the first cell) */
  interactive?: boolean;
  /** quiet look for rows that are switched off (e.g. an excluded page) */
  muted?: boolean;
}

export function TR({ interactive = false, muted = false, className, ...rest }: TRProps) {
  return (
    <tr
      className={cn(
        'border-b border-border',
        interactive && 'transition-colors duration-100 hover:bg-surface-2',
        muted && 'text-fg-subtle',
        className,
      )}
      {...rest}
    />
  );
}

export interface THProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** right-aligned header for a number column */
  numeric?: boolean;
}

export function TH({ numeric = false, className, scope = 'col', ...rest }: THProps) {
  return (
    <th
      scope={scope}
      className={cn(
        'eyebrow whitespace-nowrap px-4 py-2.5 first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5',
        numeric && 'text-right',
        className,
      )}
      {...rest}
    />
  );
}

export interface TDProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** right-aligned, tabular figures */
  numeric?: boolean;
  /** secondary text colour */
  muted?: boolean;
  /** keep on one line */
  nowrap?: boolean;
}

export function TD({ numeric = false, muted = false, nowrap = false, className, ...rest }: TDProps) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5',
        numeric && 'nums whitespace-nowrap text-right',
        muted && 'text-fg-muted',
        nowrap && 'whitespace-nowrap',
        className,
      )}
      {...rest}
    />
  );
}

import { createContext, useContext, type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { useContainerWidth } from '@/lib/useContainerWidth';

export interface TableProps {
  children: ReactNode;
  /**
   * Narrowest width (px) at which the columns still read well. On a narrower screen the
   * table scrolls sideways INSIDE its own box; the page itself never does.
   */
  minWidth?: number;
  /**
   * THE way to make a table work on a phone: below this width of the table's own box (px)
   * every row becomes a small card and every cell a "label: value" line — nothing scrolls
   * sideways and no column is hidden off screen. Give each <TD> its `label` (the column
   * name); the first cell is the name of the row and needs none; a cell with row actions
   * needs none either. Use it for every table with more than three columns, with the
   * table's `minWidth` as the value: <Table minWidth={720} stackBelow={720}>.
   */
  stackBelow?: number;
  /** what the table lists, for screen readers */
  caption?: string;
  /** when set (not null/false), it is shown instead of the table — pass an <EmptyState> */
  empty?: ReactNode;
  className?: string;
}

const StackedContext = createContext(false);

/**
 *   <Card>
 *     <Table minWidth={640} stackBelow={640} caption="Kontakti" empty={rows.length === 0 && <EmptyState … />}>
 *       <THead><TR><TH>Ime</TH><TH numeric>Trajanje</TH></TR></THead>
 *       <TBody>{rows.map((r) => <TR key={r.id}><TD>…</TD><TD numeric label="Trajanje">…</TD></TR>)}</TBody>
 *     </Table>
 *   </Card>
 */
export function Table({ children, minWidth = 560, stackBelow, caption, empty, className }: TableProps) {
  const [ref, width] = useContainerWidth();
  if (empty) return <div className={className}>{empty}</div>;
  // Width 0 = not measured yet (first render): decide after the measurement, which happens
  // before the first paint.
  const stacked = stackBelow !== undefined && width > 0 && width < stackBelow;
  return (
    <div
      ref={ref}
      // `relative` matters: without it, visually hidden (absolute) labels inside the table
      // would widen the page instead of scrolling with the table.
      className={cn('relative min-w-0', stacked ? null : 'overflow-x-auto', className)}
      tabIndex={stacked ? undefined : 0}
      role={caption ? 'region' : undefined}
      aria-label={caption}
      data-stacked={stacked || undefined}
    >
      <StackedContext.Provider value={stacked}>
        <table
          className={cn('w-full border-collapse text-left text-base', stacked && 'table-stacked')}
          style={stacked ? undefined : { minWidth }}
        >
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          {children}
        </table>
      </StackedContext.Provider>
    </div>
  );
}

/** true inside a <Table> that is currently drawn as stacked cards (below `stackBelow`). */
export function useTableStacked(): boolean {
  return useContext(StackedContext);
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
  /** the column's name, shown before the value when the table is stacked (see Table `stackBelow`) */
  label?: string;
  /** right-aligned, tabular figures */
  numeric?: boolean;
  /** secondary text colour */
  muted?: boolean;
  /** keep on one line */
  nowrap?: boolean;
}

export function TD({ label, numeric = false, muted = false, nowrap = false, className, ...rest }: TDProps) {
  return (
    <td
      data-label={label}
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

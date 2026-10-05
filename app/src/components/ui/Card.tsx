import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 'plain' = bordered surface (default). 'quiet' = filled, no border, for secondary blocks. */
  tone?: 'plain' | 'quiet';
}

/**
 * A plain container. It has NO padding of its own:
 * put CardHeader / CardBody / CardFooter (or a Table) inside.
 * Cards sit on the page background; do not nest a Card in a Card and do not add shadows.
 */
export function Card({ tone = 'plain', className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg',
        tone === 'plain' ? 'border border-border bg-surface' : 'bg-surface-2',
        className,
      )}
      {...rest}
    />
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** right side: one button, a switch or a status */
  action?: ReactNode;
  /** draws a line under the header (use it above a Table) */
  divider?: boolean;
  /** heading level of the title */
  as?: 'h2' | 'h3';
  className?: string;
}

export function CardHeader({ title, description, action, divider = false, as: Heading = 'h2', className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:px-5',
        divider ? 'border-b border-border pb-4' : 'pb-3',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <Heading className="text-md font-semibold text-fg">{title}</Heading>
        {description ? <p className="mt-0.5 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

/** Padded content. As the first child of a Card it adds its own top padding. */
export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0 px-4 pb-4 first:pt-4 sm:px-5 sm:pb-5 sm:first:pt-5', className)} {...rest} />;
}

/** Bottom strip for the actions of the card (e.g. "Shrani"). */
export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-5',
        className,
      )}
      {...rest}
    />
  );
}

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  /** ONE sentence that says what to do next: "Dodajte prvo besedilo, na primer cenik." */
  title: ReactNode;
  /** optional second, quieter line — only when the title cannot carry it */
  description?: ReactNode;
  /** one button that does the thing the title names */
  action?: ReactNode;
  /** less padding, for use inside a small card */
  compact?: boolean;
  className?: string;
}

/** Shown wherever a list or a panel has nothing in it yet. */
export function EmptyState({ icon: Icon, title, description, action, compact = false, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center px-4 text-center',
        compact ? 'gap-2 py-6' : 'gap-3 py-12',
        className,
      )}
    >
      {Icon ? (
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-fg-subtle">
          <Icon size={20} aria-hidden="true" />
        </span>
      ) : null}
      <div className="max-w-sm">
        <p className="text-base font-medium text-fg">{title}</p>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

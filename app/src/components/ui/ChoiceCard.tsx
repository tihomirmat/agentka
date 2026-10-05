import { useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ChoiceCardProps {
  /** the same `name` on every card of one group */
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** small icon before the title */
  icon?: LucideIcon;
  /** small element after the title, e.g. a <Badge> */
  aside?: ReactNode;
  /**
   * Extra line under the description, e.g. "Trenutno velja" or what must be done first.
   * It may hold a link or a button — they stay clickable.
   */
  footer?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * One option of a radio group, drawn as a large selectable card: radio mark on the left,
 * optional icon, title, description, optional footer. Put the cards of a group in a
 * <fieldset> with a <legend> (or role="radiogroup" + aria-label) and give them one `name`.
 *
 * The real <input type="radio"> covers the whole card (invisible), so a click anywhere, the
 * arrow keys, Tab and screen readers all work on the native control.
 */
export function ChoiceCard({
  name,
  value,
  checked,
  onSelect,
  title,
  description,
  icon: Icon,
  aside,
  footer,
  disabled = false,
  className,
}: ChoiceCardProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  return (
    <div
      className={cn(
        'relative flex min-w-0 items-start gap-3 rounded-lg border p-4 transition-colors duration-100',
        'has-[input:focus-visible]:outline has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring',
        checked ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface',
        !checked && !disabled && 'hover:border-fg-subtle',
        disabled && 'opacity-55',
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none rounded-lg opacity-0 outline-none disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className={cn(
          'mt-[3px] inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-100',
          checked ? 'border-accent bg-accent' : 'border-border-strong bg-surface',
        )}
      >
        {checked ? <span className="h-2 w-2 rounded-full bg-accent-fg" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {Icon ? <Icon size={18} className="shrink-0 text-fg-muted" aria-hidden="true" /> : null}
          <span id={titleId} className="text-base font-semibold text-fg">
            {title}
          </span>
          {aside}
        </span>
        {description ? (
          <span id={descId} className="mt-1 block text-sm text-fg-muted">
            {description}
          </span>
        ) : null}
        {/* Above the invisible input, so links and buttons inside stay clickable. */}
        {footer ? <span className="relative z-10 mt-2 block text-sm text-fg-muted">{footer}</span> : null}
      </span>
    </div>
  );
}

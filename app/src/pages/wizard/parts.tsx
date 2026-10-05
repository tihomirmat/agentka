/** Small building blocks used by more than one wizard step. */
import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type CalloutTone = 'info' | 'warning' | 'danger' | 'success';

const CALLOUT_BG: Record<CalloutTone, string> = {
  info: 'bg-info-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  success: 'bg-success-soft',
};
const CALLOUT_ICON_COLOR: Record<CalloutTone, string> = {
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  success: 'text-success',
};
const CALLOUT_ICON: Record<CalloutTone, LucideIcon> = {
  info: Info,
  warning: TriangleAlert,
  danger: CircleAlert,
  success: CircleCheck,
};

/** A short message with a state colour. Errors and warnings are announced to screen readers. */
export function Callout({
  tone,
  title,
  children,
  className,
}: {
  tone: CalloutTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = CALLOUT_ICON[tone];
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex min-w-0 items-start gap-3 rounded-lg px-4 py-3 text-base text-fg', CALLOUT_BG[tone], className)}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', CALLOUT_ICON_COLOR[tone])} aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cn('text-sm text-fg-muted', title ? 'mt-0.5' : null)}>{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * One option of a radio group, drawn as a selectable row or card. The real radio input is
 * visually hidden, so the keyboard (Tab, arrow keys) and screen readers work as usual.
 */
export function ChoiceOption({
  name,
  value,
  checked,
  onSelect,
  title,
  description,
  icon: Icon,
  aside,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  /** small element on the right of the title (e.g. a Badge) */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'relative flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors duration-100',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        checked ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface hover:border-fg-subtle',
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
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
          <span className="text-base font-semibold text-fg">{title}</span>
          {aside}
        </span>
        {description ? <span className="mt-1 block text-sm text-fg-muted">{description}</span> : null}
      </span>
    </label>
  );
}

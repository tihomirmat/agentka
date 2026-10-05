import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Tooltip } from './Tooltip';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** what the button does — read by screen readers and shown as a tooltip */
  label: string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'secondary' | 'danger';
  /** set false when the meaning is obvious and a tooltip would only get in the way */
  tooltip?: boolean;
}

const VARIANTS = {
  ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
  secondary: 'border border-border-strong bg-surface text-fg hover:bg-surface-2',
  danger: 'text-fg-muted hover:bg-danger-soft hover:text-danger',
};

/** A button with only an icon. `label` is required so it is never a mystery. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, size = 'md', variant = 'ghost', tooltip = true, className, type = 'button', ...rest },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded transition-colors duration-100 disabled:opacity-55',
        size === 'sm' ? 'h-8 w-8 [@media(pointer:coarse)]:min-h-10 [@media(pointer:coarse)]:min-w-10' : 'h-10 w-10',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      <Icon size={size === 'sm' ? 16 : 18} aria-hidden="true" />
    </button>
  );
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
});

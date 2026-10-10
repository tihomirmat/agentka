import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { LoaderCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Tooltip } from './Tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap ' +
  'select-none transition-colors duration-100 disabled:opacity-55 aria-disabled:opacity-55';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg shadow-xs hover:bg-accent-hover',
  secondary: 'border border-border bg-surface text-fg hover:border-border-strong hover:bg-surface-2',
  ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-danger-solid text-danger-fg hover:bg-danger-solid-hover',
};

// `sm` is 32px with a mouse and at least 40px on a touch screen (the same rule as the `tap` class
// in styles/index.css); `md` is 40px everywhere.
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-sm [@media(pointer:coarse)]:min-h-10',
  md: 'h-11 px-5 text-base',
};

/** Class string of a button, for the rare element that must look like one. */
export function buttonClass(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** shows a spinner and blocks clicks while an action runs */
  loading?: boolean;
  /** icon before the label */
  icon?: LucideIcon;
  /** stretch to the width of the container */
  block?: boolean;
  /**
   * THE pattern for a button that cannot be used right now: pass the reason as one sentence
   * ("Najprej uvozite vsaj eno stran."). The button looks disabled but stays reachable by
   * keyboard and finger; the reason shows as a tooltip on hover and focus and — because a
   * phone has no hover — also when the button is tapped. Never grey a button out without a word.
   */
  disabledReason?: string | null | false;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    icon: Icon,
    block = false,
    disabledReason,
    className,
    children,
    disabled,
    type = 'button',
    onClick,
    ...rest
  },
  ref,
) {
  const iconSize = size === 'sm' ? 14 : 16;
  const blocked = Boolean(disabledReason) && !loading;
  const [shown, setShown] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (blocked) {
      e.preventDefault();
      setShown(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setShown(false), 4000);
      return;
    }
    onClick?.(e);
  }

  const button = (
    <button
      ref={ref}
      // A blocked button must not submit a form either.
      type={blocked ? 'button' : type}
      disabled={blocked ? undefined : disabled || loading}
      aria-disabled={blocked || undefined}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...rest}
      onClick={handleClick}
    >
      {loading ? (
        <LoaderCircle size={iconSize} className="motion-safe:animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={iconSize} aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );

  if (!blocked) return button;
  return (
    <Tooltip content={disabledReason} open={shown ? true : undefined}>
      {button}
    </Tooltip>
  );
});

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  block?: boolean;
}

/** A router link that looks like a button. Use it when the click only navigates. */
export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  block = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)} {...rest}>
      {Icon ? <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" /> : null}
      {children}
    </Link>
  );
}

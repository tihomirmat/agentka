import { Link } from 'react-router-dom';
import { BRAND } from '@/brand';
import { cn } from '@/lib/cn';
import { Waveform } from './Waveform';

export interface LogoProps {
  size?: 'sm' | 'md';
  /** where a click goes; pass null for a logo that is not a link */
  to?: string | null;
  /** only the mark, no name (the name stays available to screen readers) */
  markOnly?: boolean;
  className?: string;
}

/** Waveform mark + the product name. The name always comes from src/brand.ts. */
export function Logo({ size = 'md', to = '/', markOnly = false, className }: LogoProps) {
  const box = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const content = (
    <>
      <span
        className={cn('inline-flex items-center justify-center rounded bg-accent text-accent-fg', box)}
        aria-hidden="true"
      >
        <Waveform size={size === 'sm' ? 12 : 14} />
      </span>
      {markOnly ? (
        <span className="sr-only">{BRAND}</span>
      ) : (
        <span
          className={cn(
            'font-display font-semibold tracking-tight text-fg',
            size === 'sm' ? 'text-md' : 'text-lg',
          )}
        >
          {BRAND}
        </span>
      )}
    </>
  );
  const classes = cn('inline-flex shrink-0 items-center gap-2 rounded', className);
  if (to === null) return <span className={classes}>{content}</span>;
  return (
    <Link to={to} className={classes} aria-label={`${BRAND} – na začetno stran`}>
      {content}
    </Link>
  );
}

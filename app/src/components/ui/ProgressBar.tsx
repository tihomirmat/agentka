import { cn } from '@/lib/cn';

export interface ProgressBarProps {
  value: number;
  max: number;
  /** what is measured, for screen readers: "Porabljene minute" */
  label: string;
  /** 'auto' turns to warning at 80 % and to danger at 100 % (usage against a limit) */
  tone?: 'auto' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

const FILL = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function ProgressBar({ value, max, label, tone = 'auto', size = 'md', className }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const resolved = tone === 'auto' ? (ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'accent') : tone;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className={cn('w-full overflow-hidden rounded-full bg-surface-3', size === 'sm' ? 'h-1' : 'h-1.5', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300', FILL[resolved])}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

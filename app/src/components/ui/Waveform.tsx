import { cn } from '@/lib/cn';

/**
 * The product motif: a small audio-level mark. Use it ONLY in the logo and in the
 * widget's speaking state — never as decoration.
 *
 * Colour comes from `currentColor`, so set it with a text colour class.
 * `animated` moves the bars; people who ask for reduced motion always get the static mark.
 */
export interface WaveformProps {
  /** number of bars */
  bars?: 5 | 6 | 7;
  /** height in px; width follows from the bar count */
  size?: number;
  animated?: boolean;
  className?: string;
  /** text for screen readers; leave empty when the mark is decorative next to a label */
  label?: string;
}

const SHAPES: Record<5 | 6 | 7, number[]> = {
  5: [0.42, 0.78, 1, 0.62, 0.34],
  6: [0.36, 0.7, 1, 0.82, 0.52, 0.3],
  7: [0.3, 0.56, 0.84, 1, 0.7, 0.46, 0.28],
};

const DELAYS = [0, 180, 360, 120, 300, 60, 240];

export function Waveform({ bars = 5, size = 20, animated = false, className, label }: WaveformProps) {
  const barWidth = Math.max(2, Math.round(size / 8));
  const gap = Math.max(2, Math.round(size / 9));
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('inline-flex shrink-0 items-center', className)}
      style={{ height: size, gap }}
    >
      {SHAPES[bars].map((h, i) => (
        <span
          key={i}
          className={cn(
            'block rounded-full bg-current',
            animated && 'origin-center motion-safe:animate-wave-bar',
          )}
          style={{
            width: barWidth,
            height: `${Math.round(h * 100)}%`,
            animationDelay: animated ? `${DELAYS[i] ?? 0}ms` : undefined,
          }}
        />
      ))}
    </span>
  );
}

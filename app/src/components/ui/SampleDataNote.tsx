import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SampleDataNoteProps {
  /** on a narrow screen show only "Vzorec" */
  responsive?: boolean;
  className?: string;
}

/** A quiet chip that tells the truth about stage 1: what you see is sample data. */
export function SampleDataNote({ responsive = false, className }: SampleDataNoteProps) {
  return (
    <span
      title="Vse, kar vidite, so izmišljeni vzorčni podatki."
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-border-strong px-2 py-0.5 text-xs font-medium text-fg-muted',
        className,
      )}
    >
      <FlaskConical size={12} aria-hidden="true" />
      {responsive ? (
        <>
          <span className="sm:hidden" aria-hidden="true">
            Vzorec
          </span>
          <span className="sr-only sm:not-sr-only">Vzorčni podatki</span>
        </>
      ) : (
        'Vzorčni podatki'
      )}
    </span>
  );
}

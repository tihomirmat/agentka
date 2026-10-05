import { CircleAlert, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The message of the last action, kept on the screen next to the control that caused it
 * (a toast disappears; this stays until the next action). The text is the api's own
 * sentence, shown unchanged.
 */
export function ResultNote({
  message,
  tone = 'info',
  className,
}: {
  message: string | null | undefined;
  tone?: 'info' | 'danger';
  className?: string;
}) {
  if (!message) return null;
  const Icon = tone === 'danger' ? CircleAlert : Info;
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded px-3 py-2 text-sm',
        tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-fg-muted',
        className,
      )}
    >
      <Icon size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
      <span className="min-w-0">{message}</span>
    </p>
  );
}

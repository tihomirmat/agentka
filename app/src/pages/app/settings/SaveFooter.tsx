import { CircleAlert } from 'lucide-react';
import { Button, CardFooter } from '@/components/ui';

export interface SaveFooterProps {
  dirty: boolean;
  pending: boolean;
  /** server error sentence from the last attempt */
  error?: string | null;
  onReset: () => void;
  label?: string;
}

/**
 * Footer of a settings card: the save button stays disabled until something changed, and is
 * the one primary button only while it can be used.
 */
export function SaveFooter({ dirty, pending, error, onReset, label = 'Shrani spremembe' }: SaveFooterProps) {
  return (
    <CardFooter>
      {error ? (
        <p role="alert" className="mr-auto flex min-w-0 items-start gap-1.5 text-sm text-danger">
          <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : dirty ? (
        <p className="mr-auto text-sm text-fg-muted">Imate neshranjene spremembe.</p>
      ) : null}
      {dirty ? (
        <Button variant="ghost" onClick={onReset} disabled={pending}>
          Razveljavi
        </Button>
      ) : null}
      <Button type="submit" variant={dirty ? 'primary' : 'secondary'} disabled={!dirty} loading={pending}>
        {label}
      </Button>
    </CardFooter>
  );
}

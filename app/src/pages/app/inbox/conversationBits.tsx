import { MailWarning } from 'lucide-react';
import type { Conversation } from '@/data/api';
import { cn } from '@/lib/cn';

/** The name of the visitor, or a quiet "Neznan obiskovalec". */
export function VisitorName({ name, className }: { name: string | null; className?: string }) {
  return name ? (
    <span className={cn('font-medium text-fg', className)}>{name}</span>
  ) : (
    <span className={cn('text-fg-subtle', className)}>Neznan obiskovalec</span>
  );
}

/** Which e-mail of a conversation did not arrive, in plain words; null when none failed. */
export function emailProblem(c: Pick<Conversation, 'visitor_email_status' | 'owner_email_status'>): string | null {
  const visitor = c.visitor_email_status === 'failed';
  const owner = c.owner_email_status === 'failed';
  if (visitor && owner) return 'E-pošta ni dostavljena';
  if (visitor) return 'E-pošta obiskovalcu ni dostavljena';
  if (owner) return 'E-pošta vam ni dostavljena';
  return null;
}

/** Small danger note under a row when an e-mail failed. */
export function EmailProblem({ text }: { text: string }) {
  return (
    <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-danger">
      <MailWarning size={14} className="shrink-0" aria-hidden="true" />
      <span className="min-w-0 whitespace-nowrap">{text}</span>
    </span>
  );
}

/** One line for a table cell: the topic in the text colour, the summary after it in a quieter one. */
export function TopicAndSummary({ topic, summary }: { topic: string; summary: string }) {
  return (
    <>
      <span className="font-medium text-fg">{topic}</span>
      <span className="text-fg-muted"> – {summary}</span>
    </>
  );
}

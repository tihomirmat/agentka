import type { ReactNode } from 'react';
import { CircleAlert, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type NoticeTone = 'danger' | 'warning' | 'info';

const BOX: Record<NoticeTone, string> = {
  danger: 'border-danger bg-danger-soft',
  warning: 'border-warning bg-warning-soft',
  info: 'border-info bg-info-soft',
};

const ICON_COLOR: Record<NoticeTone, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
};

const ICONS: Record<NoticeTone, LucideIcon> = {
  danger: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

export interface NoticeProps {
  tone: NoticeTone;
  /** one sentence: what is wrong */
  title: ReactNode;
  /** what it means and what fixes it */
  children?: ReactNode;
  /** the one action that fixes it */
  action?: ReactNode;
  className?: string;
}

/**
 * A full-width notice for a state the person must act on (local: the shared UI kit has no
 * notice primitive). Colour only supports the words; the icon and the sentence carry the meaning.
 */
export function Notice({ tone, title, children, action, className }: NoticeProps) {
  const Icon = ICONS[tone];
  return (
    <div
      role={tone === 'info' ? 'status' : 'alert'}
      className={cn('flex min-w-0 flex-wrap items-start gap-x-3 gap-y-3 rounded-lg border px-4 py-3.5 sm:px-5', BOX[tone], className)}
    >
      <Icon size={18} className={cn('mt-[3px] shrink-0', ICON_COLOR[tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-base font-semibold text-fg">{title}</p>
        {children ? <p className="mt-0.5 text-base text-fg">{children}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2 pl-[30px] sm:pl-0">{action}</div> : null}
    </div>
  );
}

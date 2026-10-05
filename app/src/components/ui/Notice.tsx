import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type NoticeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Shared with the shell strips, so a notice and a strip of the same tone look alike. */
export const NOTICE_BOX: Record<NoticeTone, string> = {
  neutral: 'border-border bg-surface-2',
  info: 'border-info bg-info-soft',
  success: 'border-success bg-success-soft',
  warning: 'border-warning bg-warning-soft',
  danger: 'border-danger bg-danger-soft',
};

export const NOTICE_ICON_COLOR: Record<NoticeTone, string> = {
  neutral: 'text-fg-muted',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export const NOTICE_ICON: Record<NoticeTone, LucideIcon> = {
  neutral: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

export interface NoticeProps {
  /** neutral = a plain note; info / success / warning / danger = a state. Default: info. */
  tone?: NoticeTone;
  /** md = a notice the person must see; sm = a quiet result line next to a control */
  size?: 'md' | 'sm';
  /** one sentence: what happened or what is wrong */
  title?: ReactNode;
  /** what it means and what to do; with no title this is the whole message */
  children?: ReactNode;
  /** the ONE action that belongs to the notice (a Button or ButtonLink) */
  action?: ReactNode;
  /**
   * false for text that is always there (an explanation); the default announces the notice
   * to screen readers when it appears (alert for warning/danger, status otherwise).
   */
  live?: boolean;
  className?: string;
}

/**
 * THE one way to say something inside a page: a state the person must act on, an explanation,
 * or the result of an action that must stay readable (see CONVENTIONS.md → "How a result is
 * shown"). Border + soft fill, icon, optional title, text, one action on the right (under the
 * text on a phone). Colour only supports the words.
 *
 *   <Notice tone="danger" title="Zadnje plačilo ni uspelo." action={<Button>Uredi plačilo</Button>}>
 *     Agent je začasno ustavljen, dokler plačilo ni urejeno.
 *   </Notice>
 *   <Notice size="sm" tone="neutral">{result.message}</Notice>
 */
export function Notice({ tone = 'info', size = 'md', title, children, action, live = true, className }: NoticeProps) {
  const Icon = NOTICE_ICON[tone];
  const small = size === 'sm';
  const role = !live ? undefined : tone === 'danger' || tone === 'warning' ? 'alert' : 'status';
  return (
    <div
      role={role}
      className={cn(
        'flex min-w-0 flex-wrap items-start rounded-lg border',
        small ? 'gap-x-2 gap-y-2 px-3 py-2 text-sm' : 'gap-x-3 gap-y-3 px-4 py-3.5 text-base sm:px-5',
        NOTICE_BOX[tone],
        className,
      )}
    >
      <Icon
        size={small ? 14 : 18}
        className={cn('shrink-0', small ? 'mt-[3px]' : 'mt-[3px]', NOTICE_ICON_COLOR[tone])}
        aria-hidden="true"
      />
      <div className={cn('min-w-0 flex-1', small ? 'basis-40' : 'basis-56')}>
        {title ? <p className="font-semibold text-fg">{title}</p> : null}
        {children ? (
          <div className={cn(title ? 'mt-0.5' : null, small && tone === 'neutral' ? 'text-fg-muted' : 'text-fg')}>
            {children}
          </div>
        ) : null}
      </div>
      {action ? (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-2', small ? 'pl-[22px] sm:pl-0' : 'pl-[30px] sm:pl-0')}>
          {action}
        </div>
      ) : null}
    </div>
  );
}

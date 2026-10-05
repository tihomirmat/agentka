import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Tone } from './Badge';
import { StatusPill } from './StatusPill';

export type StepState = 'done' | 'current' | 'waiting';

export interface Step {
  id: string;
  title: ReactNode;
  /** one line: what the step is, or what was found */
  detail?: ReactNode;
  state: StepState;
  /** replaces the default word of the state pill ("Narejeno" / "Na vrsti" / "Čaka") */
  pill?: { tone: Tone; label: string };
  /** the ONE action of the step (a small Button or ButtonLink), shown on the right */
  action?: ReactNode;
}

const PILL: Record<StepState, { tone: Tone; label: string }> = {
  done: { tone: 'success', label: 'Narejeno' },
  current: { tone: 'info', label: 'Na vrsti' },
  waiting: { tone: 'neutral', label: 'Čaka' },
};

const MARK: Record<StepState, string> = {
  done: 'bg-success-soft text-success',
  current: 'bg-info-soft text-info',
  waiting: 'bg-surface-2 text-fg-muted',
};

export interface StepListProps {
  steps: Step[];
  /** false = plain numbered list without state pills (an explanation, not a checklist) */
  showState?: boolean;
  className?: string;
}

/**
 * Numbered steps with their state: number or tick, title, state pill, one line of detail,
 * optional action. For checklists ("Kaj še manjka", the install steps) and for "what happens
 * next" lists. Each state carries a word, so colour is never the only signal.
 * Put it straight into a <Card> (it has its own row padding and dividers).
 */
export function StepList({ steps, showState = true, className }: StepListProps) {
  return (
    <ol className={cn('min-w-0', className)}>
      {steps.map((step, i) => {
        const pill = step.pill ?? PILL[step.state];
        return (
          <li key={step.id} className="flex min-w-0 gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
            <span
              aria-hidden="true"
              className={cn(
                'nums mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                showState ? MARK[step.state] : 'bg-accent-soft text-accent-soft-fg',
              )}
            >
              {showState && step.state === 'done' ? <Check size={16} aria-hidden="true" /> : i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 basis-48">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-base font-medium text-fg">
                    <span className="sr-only">Korak {i + 1}: </span>
                    {step.title}
                  </p>
                  {showState ? <StatusPill tone={pill.tone}>{pill.label}</StatusPill> : null}
                </div>
                {step.detail ? <div className="mt-0.5 text-sm text-fg-muted">{step.detail}</div> : null}
              </div>
              {step.action ? <div className="flex shrink-0 items-center gap-2">{step.action}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

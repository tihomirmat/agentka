import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Card, CardHeader, StatusPill, type Tone } from '@/components/ui';
import { cn } from '@/lib/cn';

export type StepState = 'done' | 'current' | 'waiting';

export interface ChecklistStep {
  id: string;
  title: string;
  detail: ReactNode;
  state: StepState;
}

const PILL: Record<StepState, { tone: Tone; label: string }> = {
  done: { tone: 'success', label: 'Narejeno' },
  current: { tone: 'info', label: 'Na vrsti' },
  waiting: { tone: 'neutral', label: 'Čaka' },
};

const BADGE: Record<StepState, string> = {
  done: 'bg-success-soft text-success',
  current: 'bg-info-soft text-info',
  waiting: 'bg-surface-2 text-fg-muted',
};

/** The three install steps. Each state carries a word, so colour is never the only signal. */
export function Checklist({ steps }: { steps: ChecklistStep[] }) {
  return (
    <Card>
      <CardHeader
        title="Tri koraki do delujočega agenta"
        description="Koraki se označijo sami, ko aplikacija zazna, da so opravljeni."
        divider
      />
      <ol>
        {steps.map((step, i) => (
          <li key={step.id} className="flex min-w-0 gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
            <span
              aria-hidden="true"
              className={cn(
                'nums mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                BADGE[step.state],
              )}
            >
              {step.state === 'done' ? <Check size={16} aria-hidden="true" /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-base font-medium text-fg">
                  <span className="sr-only">Korak {i + 1}: </span>
                  {step.title}
                </p>
                <StatusPill tone={PILL[step.state].tone}>{PILL[step.state].label}</StatusPill>
              </div>
              <p className="mt-0.5 text-sm text-fg-muted">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

import { forwardRef } from 'react';
import { Button, Notice, PlanCard } from '@/components/ui';
import type { Plan, PlanKey } from '@/data/types';

export interface PlansSectionProps {
  plans: Plan[];
  currentKey: PlanKey | null;
  /** false while another plan change is running */
  busy: boolean;
  /** the API's own sentence after a plan change, shown unchanged until the next action */
  lastMessage: string | null;
  onChoose: (plan: Plan) => void;
}

/** All plans side by side (stacked on a phone). The current one is marked "Vaš paket". */
export const PlansSection = forwardRef<HTMLElement, PlansSectionProps>(function PlansSection(
  { plans, currentKey, busy, lastMessage, onChoose },
  ref,
) {
  const sorted = [...plans].sort((a, b) => a.price_month_eur - b.price_month_eur);
  return (
    <section ref={ref} aria-labelledby="paketi-naslov" className="min-w-0 scroll-mt-4">
      <div className="mb-3 min-w-0">
        <h2 id="paketi-naslov" className="font-display text-lg font-semibold text-fg">
          Paketi
        </h2>
        <p className="text-base text-fg-muted">Vsak paket vključuje določeno število minut pogovorov na mesec.</p>
      </div>
      {lastMessage ? (
        <Notice size="sm" tone="neutral" className="mb-4">
          {lastMessage}
        </Notice>
      ) : null}
      <ul className="grid min-w-0 gap-4 lg:grid-cols-3">
        {sorted.map((plan) => {
          const current = plan.key === currentKey;
          return (
            <li key={plan.key} className="min-w-0">
              <PlanCard
                plan={plan}
                current={current}
                action={
                  current ? null : (
                    <Button block disabled={busy} onClick={() => onChoose(plan)}>
                      {currentKey ? `Preklopi na ${plan.name}` : `Izberi paket ${plan.name}`}
                    </Button>
                  )
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
});

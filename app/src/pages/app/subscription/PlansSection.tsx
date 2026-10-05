import { forwardRef } from 'react';
import { Badge, Button, Card, CardBody, SampleDataNote } from '@/components/ui';
import { formatEur, formatNumber } from '@/data/format';
import type { Plan, PlanKey } from '@/data/types';
import { cn } from '@/lib/cn';

export interface PlansSectionProps {
  plans: Plan[];
  currentKey: PlanKey | null;
  /** false while another plan change is running */
  busy: boolean;
  onChoose: (plan: Plan) => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 py-2.5">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="nums text-base font-medium text-fg">{value}</dd>
    </div>
  );
}

/** All plans side by side (stacked on a phone). The current one is marked "Vaš paket". */
export const PlansSection = forwardRef<HTMLElement, PlansSectionProps>(function PlansSection(
  { plans, currentKey, busy, onChoose },
  ref,
) {
  const sorted = [...plans].sort((a, b) => a.price_month_eur - b.price_month_eur);
  return (
    <section ref={ref} aria-labelledby="paketi-naslov" className="min-w-0 scroll-mt-4">
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 id="paketi-naslov" className="font-display text-lg font-semibold text-fg">
            Paketi
          </h2>
          <p className="text-base text-fg-muted">Vsak paket vključuje določeno število minut pogovorov na mesec.</p>
        </div>
        <SampleDataNote />
      </div>
      <ul className="grid min-w-0 gap-4 lg:grid-cols-3">
        {sorted.map((plan) => {
          const current = plan.key === currentKey;
          return (
            <li key={plan.key} className="min-w-0">
              <Card className={cn('h-full', current && 'border-accent')}>
                <CardBody className="flex h-full flex-col gap-4">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-fg">{plan.name}</h3>
                    {current ? <Badge tone="accent">Vaš paket</Badge> : null}
                  </div>
                  <p className="flex items-baseline gap-1.5">
                    <span className="nums font-display text-3xl font-semibold tracking-tight text-fg">
                      {formatEur(plan.price_month_eur)}
                    </span>
                    <span className="text-sm text-fg-muted">na mesec</span>
                  </p>
                  <dl className="divide-y divide-border border-y border-border">
                    <Row label="Vključene minute" value={`${formatNumber(plan.minutes_included)} min`} />
                    <Row label="Največ strani" value={formatNumber(plan.max_pages)} />
                    <Row label="Največ agentov" value={formatNumber(plan.max_agents)} />
                  </dl>
                  {current ? null : (
                    <div className="mt-auto">
                      <Button block disabled={busy} onClick={() => onChoose(plan)}>
                        {currentKey ? `Preklopi na ${plan.name}` : `Izberi paket ${plan.name}`}
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

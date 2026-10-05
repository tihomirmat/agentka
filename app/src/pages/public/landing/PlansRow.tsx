import { Link } from 'react-router-dom';
import { ArrowRight, CircleAlert } from 'lucide-react';
import * as api from '@/data/api';
import { Button, Card, CardBody, EmptyState, SampleDataNote, Skeleton } from '@/components/ui';
import { formatEur, formatNumber } from '@/data/format';
import { agentsText, minutesText, TEXT_LINK } from '../shared/planText';
import { Section, SectionHead } from './Section';

/** The plans from api.listPlans() (public, no login needed) in one compact row. */
export function PlansRow() {
  const plans = api.useQuery(() => api.listPlans(), []);
  return (
    <Section labelledBy="paketi-naslov">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <SectionHead
          id="paketi-naslov"
          title="Paketi"
          lead="Po brezplačnem preizkusu izberete paket glede na število minut pogovorov na mesec."
        />
        <Link to="/cenik" className={`${TEXT_LINK} inline-flex items-center gap-1.5 text-base`}>
          Primerjajte pakete
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-muted">
        <SampleDataNote />
        Cene in omejitve so v predogledu vzorčne.
      </p>

      {plans.loading ? (
        <div className="mt-4 grid gap-4 md:grid-cols-3" role="status" aria-label="Nalaganje paketov">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : plans.error || !plans.data ? (
        <Card className="mt-4">
          <EmptyState
            icon={CircleAlert}
            title={plans.error ?? 'Paketov ni bilo mogoče naložiti.'}
            action={<Button onClick={plans.reload}>Poskusi znova</Button>}
          />
        </Card>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {plans.data.map((plan) => (
            <li key={plan.key} className="min-w-0">
              <Card className="h-full">
                <CardBody>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="font-display text-lg font-semibold text-fg">{plan.name}</h3>
                    <p className="nums">
                      <span className="font-display text-2xl font-semibold text-fg">{formatEur(plan.price_month_eur)}</span>{' '}
                      <span className="text-sm text-fg-muted">na mesec</span>
                    </p>
                  </div>
                  <p className="mt-3 text-base font-medium text-fg">{minutesText(plan.minutes_included)} na mesec</p>
                  <p className="mt-0.5 text-sm text-fg-muted">
                    Do {formatNumber(plan.max_pages)} uvoženih strani · {agentsText(plan.max_agents)}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

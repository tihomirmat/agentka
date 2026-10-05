import { Link } from 'react-router-dom';
import { ArrowRight, CircleAlert } from 'lucide-react';
import * as api from '@/data/api';
import { Button, Card, EmptyState, PlanCard, Skeleton } from '@/components/ui';
import { TEXT_LINK } from '../shared/links';
import { Section, SectionHead } from './Section';

/** The plans from api.listPlans() (public, no login needed) as the shared PlanCard, in one row. */
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
      <p className="mt-5 text-sm text-fg-muted">Cene in omejitve so v predogledu vzorčne.</p>

      {plans.loading ? (
        <div className="mt-4 grid gap-4 md:grid-cols-3" role="status" aria-label="Nalaganje paketov">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-60 w-full rounded-lg" />
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
              <PlanCard plan={plan} as="h3" />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

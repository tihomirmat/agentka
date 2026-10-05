import { CircleAlert } from 'lucide-react';
import * as api from '@/data/api';
import { Button, ButtonLink, Card, EmptyState, SampleDataNote, Skeleton } from '@/components/ui';
import { IncludedInEvery, LimitExplainer, MinutesAndTrial } from './pricing/Explainers';
import { PlanCard } from './pricing/PlanCard';

/**
 * Route "/cenik". The plans come from api.listPlans() (public). The trial has limited days
 * and minutes, but the API does not expose the numbers to a visitor, so none are printed.
 */
export default function Pricing() {
  const plans = api.useQuery(() => api.listPlans(), []);

  return (
    <div className="page py-10 md:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">Cenik</h1>
      <p className="mt-3 max-w-prose text-md text-fg-muted">
        Izberite paket glede na to, koliko minut pogovorov potrebujete na mesec. Začnete z brezplačnim preizkusom,
        paket izberete po njem.
      </p>

      <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-muted">
        <SampleDataNote />
        Cene in omejitve so v predogledu vzorčne.
      </p>

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
              <PlanCard plan={plan} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <IncludedInEvery />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 md:items-start">
        <MinutesAndTrial />
        <LimitExplainer />
      </div>

      <Card tone="quiet" className="mt-6 flex flex-col items-start gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">
            Začnite s preizkusom, paket izberete pozneje
          </h2>
          <p className="mt-1.5 text-base text-fg-muted">Brezplačen preizkus ima omejeno število dni in minut.</p>
        </div>
        <ButtonLink to="/registracija" variant="primary">
          Začnite brezplačno
        </ButtonLink>
      </Card>
    </div>
  );
}

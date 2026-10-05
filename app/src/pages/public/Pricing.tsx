import { CircleAlert } from 'lucide-react';
import * as api from '@/data/api';
import { Button, ButtonLink, Card, EmptyState, PlanCard, Skeleton } from '@/components/ui';
import { IncludedInEvery, LimitExplainer, MinutesAndTrial } from './pricing/Explainers';
import { useTrialTermsText } from './shared/trial';

/**
 * Route "/cenik". The plans come from api.listPlans() (public) and are drawn by the shared
 * PlanCard. The terms of the free trial come from api.getTrialTerms() and are printed once,
 * in the introduction, where a buyer looks first.
 */
export default function Pricing() {
  const plans = api.useQuery(() => api.listPlans(), []);
  const trial = useTrialTermsText();

  return (
    <div className="page py-10 md:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">Cenik</h1>
      <p className="mt-3 max-w-prose text-md text-fg-muted">
        Izberite paket glede na to, koliko minut pogovorov potrebujete na mesec. Začnete z brezplačnim preizkusom
        {trial ? ` (${trial})` : ''}, paket izberete po njem.
      </p>

      <p className="mt-6 text-sm text-fg-muted">Cene in omejitve so v predogledu vzorčne.</p>

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
              <PlanCard plan={plan} as="h2" />
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
        <h2 className="min-w-0 font-display text-2xl font-semibold tracking-tight text-fg">
          Začnite z brezplačnim preizkusom, paket izberete pozneje
        </h2>
        <ButtonLink to="/registracija" variant="primary">
          Začnite brezplačno
        </ButtonLink>
      </Card>
    </div>
  );
}

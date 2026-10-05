import { useState, type ReactNode } from 'react';
import { CircleAlert, Pencil } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  SampleDataNote,
  SkeletonText,
} from '@/components/ui';
import * as api from '@/data/api';
import { formatEur, formatNumber, plural } from '@/data/format';
import { ACCOUNT_FORMS } from './accounts/helpers';
import { PlanEditDialog } from './accounts/PlanEditDialog';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-sm text-fg-muted">{label}</dt>
      <dd className="nums min-w-0 text-right text-base font-medium text-fg">{children}</dd>
    </div>
  );
}

export default function Plans() {
  const plans = api.useQuery(() => api.listPlans(), []);
  const accounts = api.useQuery(() => api.adminListAccounts(), []);
  const [editing, setEditing] = useState<api.PlanKey | null>(null);

  const header = (
    <PageHeader
      title="Paketi"
      description="Cene in omejitve paketov, ki jih vidijo stranke."
      meta={<SampleDataNote />}
    />
  );

  if (plans.loading) {
    return (
      <>
        {header}
        <div className="grid min-w-0 gap-4 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardBody>
                <SkeletonText lines={5} />
              </CardBody>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (plans.error || !plans.data) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={plans.error ?? 'Paketov ni bilo mogoče naložiti.'}
            action={<Button onClick={plans.reload}>Poskusi znova</Button>}
          />
        </Card>
      </>
    );
  }

  const sorted = [...plans.data].sort((a, b) => a.price_month_eur - b.price_month_eur);
  const editPlan = sorted.find((p) => p.key === editing);
  const rows = accounts.data;
  const onTrial = rows?.filter((r) => r.account.plan_key === null).length ?? 0;

  return (
    <>
      {header}
      <ul className="grid min-w-0 gap-4 lg:grid-cols-3">
        {sorted.map((plan) => {
          const count = rows?.filter((r) => r.account.plan_key === plan.key).length;
          return (
            <li key={plan.key} className="min-w-0">
              <Card className="h-full">
                <CardBody className="flex h-full flex-col gap-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <h2 className="font-display text-lg font-semibold text-fg">{plan.name}</h2>
                    <Button size="sm" icon={Pencil} aria-label={`Uredi paket ${plan.name}`} onClick={() => setEditing(plan.key)}>
                      Uredi
                    </Button>
                  </div>
                  <p className="flex items-baseline gap-1.5">
                    <span className="nums font-display text-3xl font-semibold tracking-tight text-fg">
                      {formatEur(plan.price_month_eur)}
                    </span>
                    <span className="text-sm text-fg-muted">na mesec</span>
                  </p>
                  <dl className="divide-y divide-border border-y border-border">
                    <Row label="Vključene minute">{formatNumber(plan.minutes_included)} min</Row>
                    <Row label="Največ strani">{formatNumber(plan.max_pages)}</Row>
                    <Row label="Največ agentov">{formatNumber(plan.max_agents)}</Row>
                    <Row label="Stripe price id">
                      {plan.stripe_price_id ? (
                        <span className="break-all font-mono text-sm">{plan.stripe_price_id}</span>
                      ) : (
                        <span className="text-sm font-normal text-fg-subtle">Ni povezan</span>
                      )}
                    </Row>
                  </dl>
                  <p className="mt-auto text-sm text-fg-muted">
                    {count === undefined
                      ? ' '
                      : count === 0
                        ? 'Na tem paketu ni nobenega uporabniškega računa.'
                        : `Na tem paketu: ${plural(count, ACCOUNT_FORMS)}.`}
                  </p>
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
      {rows && onTrial > 0 ? (
        <p className="mt-4 text-sm text-fg-subtle">
          {`${plural(onTrial, ACCOUNT_FORMS)} še nima paketa (poskusno obdobje).`}
        </p>
      ) : null}

      {editPlan ? <PlanEditDialog key={editPlan.key} plan={editPlan} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

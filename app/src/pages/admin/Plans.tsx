import { useState } from 'react';
import { CircleAlert, Pencil } from 'lucide-react';
import { Button, Card, CardBody, EmptyState, PageHeader, PlanCard, SkeletonText } from '@/components/ui';
import * as api from '@/data/api';
import { formatNumber, plural } from '@/data/format';
import { TRIAL } from '@/data/labels';
import { ACCOUNT_FORMS } from './accounts/helpers';
import { PlanEditDialog } from './accounts/PlanEditDialog';

export default function Plans() {
  const plans = api.useQuery(() => api.listPlans(), []);
  const accounts = api.useQuery(() => api.adminListAccounts(), []);
  const [editing, setEditing] = useState<api.PlanKey | null>(null);

  const header = <PageHeader title="Paketi" description="Cene in omejitve paketov, ki jih vidijo stranke." />;

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
              {/* The same card as the customer sees; the admin adds what only the admin needs. */}
              <PlanCard
                plan={plan}
                as="h2"
                extraRows={[
                  { label: 'Največ agentov', value: formatNumber(plan.max_agents) },
                  {
                    label: 'ID cene v Stripu',
                    value: plan.stripe_price_id ? (
                      <span className="break-all font-mono text-sm">{plan.stripe_price_id}</span>
                    ) : (
                      <span className="text-sm font-normal text-fg-subtle">Ni povezan</span>
                    ),
                  },
                  { label: 'Uporabniški računi', value: count === undefined ? '–' : formatNumber(count) },
                ]}
                action={
                  <Button block icon={Pencil} aria-label={`Uredi paket ${plan.name}`} onClick={() => setEditing(plan.key)}>
                    Uredi paket
                  </Button>
                }
              />
            </li>
          );
        })}
      </ul>
      {rows && onTrial > 0 ? (
        <p className="mt-4 text-sm text-fg-subtle">
          {`${plural(onTrial, ACCOUNT_FORMS)} še nima paketa (${TRIAL.nameLower}).`}
        </p>
      ) : null}

      {editPlan ? <PlanEditDialog key={editPlan.key} plan={editPlan} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

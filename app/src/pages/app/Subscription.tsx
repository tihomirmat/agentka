import { useRef, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button, Card, CardBody, ConfirmDialog, EmptyState, Notice, PageHeader, SkeletonText, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { formatDate, formatEur, formatEurExact, formatMinutes, formatMinutesOf, formatNumber } from '@/data/format';
import { TRIAL } from '@/data/labels';
import { BillingCard } from './subscription/BillingCard';
import { CurrentPlanCard } from './subscription/CurrentPlanCard';
import { InvoicesCard } from './subscription/InvoicesCard';
import { PlansSection } from './subscription/PlansSection';
import { UsageCard } from './subscription/UsageCard';

/** Where the last simulated result is shown: next to the control that caused it, only one at a time. */
type Area = 'status' | 'plans' | 'billing';
interface Outcome {
  area: Area;
  message: string;
}

interface StatusNoticeProps {
  account: api.Account;
  /** the invoice that was not paid, when the invoice list has one */
  failedInvoice: api.Invoice | undefined;
  /** the next bigger plan, when there is one */
  upgradeTo: api.Plan | undefined;
  portalPending: boolean;
  onPortal: () => void;
  onUpgrade: (plan: api.Plan) => void;
  onShowPlans: () => void;
}

/**
 * The page's own notice for a state that needs action: the facts that are specific to this
 * account and the one action that fixes it. The shell strip says the same thing on every
 * other page and is hidden here, so this is the only copy on this screen.
 */
function StatusNotice({ account, failedInvoice, upgradeTo, portalPending, onPortal, onUpgrade, onShowPlans }: StatusNoticeProps) {
  if (account.status === 'past_due') {
    return (
      <Notice
        tone="danger"
        title={
          failedInvoice
            ? `Račun ${failedInvoice.number} za ${formatEurExact(failedInvoice.amount_eur)} ni plačan.`
            : 'Zadnji račun za naročnino ni plačan.'
        }
        action={
          <Button variant="primary" loading={portalPending} onClick={onPortal}>
            Upravljaj plačilno sredstvo
          </Button>
        }
      >
        Agent je začasno ustavljen, dokler plačila ne uredite.
      </Notice>
    );
  }
  if (account.status === 'paused_limit') {
    return (
      <Notice
        tone="warning"
        title={`Porabili ste vse vključene minute (${formatMinutesOf(account.minutes_used, account.minutes_included)}).`}
        action={
          upgradeTo ? (
            <Button variant="primary" onClick={() => onUpgrade(upgradeTo)}>
              Preklopi na {upgradeTo.name}
            </Button>
          ) : undefined
        }
      >
        {`Agent se znova vklopi ob obnovi naročnine (${formatDate(account.period_end)})${upgradeTo ? ' ali ob preklopu na večji paket.' : '.'}`}
      </Notice>
    );
  }
  if (account.status === 'cancelled') {
    return (
      <Notice
        tone="info"
        title="Naročnina je preklicana."
        action={
          <Button variant="primary" onClick={onShowPlans}>
            Poglej pakete
          </Button>
        }
      >
        Izberite paket, če želite nadaljevati.
      </Notice>
    );
  }
  return null;
}

function PageSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-6" aria-busy="true">
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardBody>
              <SkeletonText lines={5} />
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardBody>
              <SkeletonText lines={4} />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * The consequence of a plan change, stated BEFORE the click. A cheaper plan says what the
 * person gives up.
 */
function PlanChangeText({ account, current, next }: { account: api.Account; current: api.Plan | undefined; next: api.Plan }) {
  const used = Math.round(account.minutes_used);
  const lessIncluded = next.minutes_included < account.minutes_included;
  const before = current
    ? `${current.name}, ${formatEur(current.price_month_eur)} na mesec`
    : account.status === 'trial'
      ? TRIAL.name
      : 'brez plačilnega paketa';
  return (
    <>
      <span className="block">{`Zdaj: ${before}, ${formatMinutes(account.minutes_included)} vključenih.`}</span>
      <span className="block">
        {`Novo: ${next.name}, ${formatEur(next.price_month_eur)} na mesec, ${formatMinutes(next.minutes_included)} vključenih.`}
      </span>
      {lessIncluded ? (
        <span className="mt-2 block">
          {`Vključenih bo ${formatMinutes(next.minutes_included)}; v tem obdobju ste jih porabili ${formatNumber(used)}.${
            used > next.minutes_included ? ' To je več, kot jih vključuje novi paket.' : ''
          }`}
        </span>
      ) : null}
      <span className="mt-2 block">Predogled: paket se zamenja takoj in brez plačila.</span>
    </>
  );
}

export default function Subscription() {
  const toast = useToast();
  const account = api.useQuery(() => api.getAccount(), []);
  const plans = api.useQuery(() => api.listPlans(), []);
  const invoices = api.useQuery(() => api.listInvoices(), []);

  const [chosen, setChosen] = useState<api.Plan | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const plansRef = useRef<HTMLElement>(null);

  const change = api.useAction(api.changePlan, { onError: (m) => toast.error(m) });
  const portal = api.useAction(api.openBillingPortal, { onError: (m) => toast.error(m) });

  const showPlans = () => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /** A simulated outside action leaves ONE notice next to its control and no toast. */
  function report(area: Area, result: api.ActionResult) {
    if (result.simulated) setOutcome({ area, message: result.message });
    else toast.success(result.message);
  }

  async function openPortal(area: Area) {
    setOutcome(null);
    const result = await portal.run();
    if (result) report(area, result);
  }

  async function confirmChange(plan: api.Plan) {
    setOutcome(null);
    const result = await change.run(plan.key);
    if (result) report('plans', result);
  }

  const header = (
    <PageHeader title="Naročnina" description="Vaš paket, poraba minut in izdani računi." />
  );

  if (account.loading || plans.loading) {
    return (
      <>
        {header}
        <PageSkeleton />
      </>
    );
  }

  const loadError = account.error ?? plans.error;
  if (loadError || !account.data || !plans.data) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={loadError ?? 'Naročnine ni bilo mogoče naložiti.'}
            action={
              <Button
                onClick={() => {
                  account.reload();
                  plans.reload();
                }}
              >
                Poskusi znova
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  const acc = account.data;
  const allPlans = plans.data;
  const current = allPlans.find((p) => p.key === acc.plan_key);
  const upgradeTo = current
    ? [...allPlans].sort((a, b) => a.price_month_eur - b.price_month_eur).find((p) => p.price_month_eur > current.price_month_eur)
    : undefined;
  const messageFor = (area: Area) => (outcome?.area === area ? outcome.message : null);

  return (
    <>
      {header}
      <div className="flex min-w-0 flex-col gap-6">
        <StatusNotice
          account={acc}
          failedInvoice={invoices.data?.find((i) => i.status === 'failed')}
          upgradeTo={upgradeTo}
          portalPending={portal.pending}
          onPortal={() => openPortal('status')}
          onUpgrade={setChosen}
          onShowPlans={showPlans}
        />
        {messageFor('status') ? (
          <Notice size="sm" tone="neutral">
            {messageFor('status')}
          </Notice>
        ) : null}

        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <CurrentPlanCard account={acc} plan={current} onShowPlans={showPlans} />
          <UsageCard account={acc} />
        </div>

        <PlansSection
          ref={plansRef}
          plans={allPlans}
          currentKey={acc.plan_key}
          busy={change.pending}
          lastMessage={messageFor('plans')}
          onChoose={setChosen}
        />

        <BillingCard pending={portal.pending} lastMessage={messageFor('billing')} onManage={() => openPortal('billing')} />

        <InvoicesCard
          invoices={invoices.data}
          loading={invoices.loading}
          error={invoices.error}
          onRetry={invoices.reload}
          onShowPlans={showPlans}
        />
      </div>

      {chosen ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setChosen(null);
          }}
          title={current ? `Preklopim na paket ${chosen.name}?` : `Izberem paket ${chosen.name}?`}
          description={<PlanChangeText account={acc} current={current} next={chosen} />}
          confirmLabel={current ? `Preklopi na ${chosen.name}` : `Izberi paket ${chosen.name}`}
          onConfirm={() => confirmChange(chosen)}
        />
      ) : null}
    </>
  );
}

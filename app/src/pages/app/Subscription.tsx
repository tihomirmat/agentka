import { useRef, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button, Card, CardBody, ConfirmDialog, EmptyState, PageHeader, SkeletonText, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { formatDate, formatEur, formatEurExact, formatMinutes, formatMinutesOf } from '@/data/format';
import { BillingCard } from './subscription/BillingCard';
import { CurrentPlanCard } from './subscription/CurrentPlanCard';
import { InvoicesCard } from './subscription/InvoicesCard';
import { Notice } from './subscription/Notice';
import { PlansSection } from './subscription/PlansSection';
import { UsageCard } from './subscription/UsageCard';

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
 * One clear notice for a state that needs action, with the one action that fixes it.
 * The app frame already shows a one-line pointer to this page for the first two states;
 * this notice says what exactly is wrong and carries the button.
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
        Posodobite plačilno sredstvo v portalu za plačila.
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

export default function Subscription() {
  const toast = useToast();
  const account = api.useQuery(() => api.getAccount(), []);
  const plans = api.useQuery(() => api.listPlans(), []);
  const invoices = api.useQuery(() => api.listInvoices(), []);

  const [chosen, setChosen] = useState<api.Plan | null>(null);
  const [portalMessage, setPortalMessage] = useState<string | null>(null);
  const plansRef = useRef<HTMLElement>(null);

  const change = api.useAction(api.changePlan, { onError: (m) => toast.error(m) });
  const portal = api.useAction(api.openBillingPortal, { onError: (m) => toast.error(m) });

  const showPlans = () => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  async function openPortal() {
    const result = await portal.run();
    if (!result) return;
    setPortalMessage(result.message);
    if (result.simulated) toast.info(result.message);
    else toast.success(result.message);
  }

  async function confirmChange(plan: api.Plan) {
    const result = await change.run(plan.key);
    if (!result) return;
    if (result.simulated) toast.info(result.message);
    else toast.success(result.message);
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

  return (
    <>
      {header}
      <div className="flex min-w-0 flex-col gap-6">
        <StatusNotice
          account={acc}
          failedInvoice={invoices.data?.find((i) => i.status === 'failed')}
          upgradeTo={upgradeTo}
          portalPending={portal.pending}
          onPortal={openPortal}
          onUpgrade={setChosen}
          onShowPlans={showPlans}
        />

        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <CurrentPlanCard account={acc} plan={current} onShowPlans={showPlans} />
          <UsageCard account={acc} />
        </div>

        <PlansSection ref={plansRef} plans={allPlans} currentKey={acc.plan_key} busy={change.pending} onChoose={setChosen} />

        <BillingCard pending={portal.pending} lastMessage={portalMessage} onManage={openPortal} />

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
          description={
            <>
              <span className="block">
                {current ? `Zdaj: ${current.name}, ${formatEur(current.price_month_eur)} na mesec.` : 'Zdaj: brez plačilnega paketa.'}
              </span>
              <span className="block">
                {`Novo: ${chosen.name}, ${formatEur(chosen.price_month_eur)} na mesec, ${formatMinutes(chosen.minutes_included)} vključenih.`}
              </span>
              <span className="mt-2 block">Kdaj sprememba začne veljati, vam pove sporočilo po potrditvi.</span>
            </>
          }
          confirmLabel={current ? `Preklopi na ${chosen.name}` : `Izberi paket ${chosen.name}`}
          onConfirm={() => confirmChange(chosen)}
        />
      ) : null}
    </>
  );
}

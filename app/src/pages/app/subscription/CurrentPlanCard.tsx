import type { ReactNode } from 'react';
import { Button, Card, CardBody, CardHeader, StatusPill } from '@/components/ui';
import { dayDiff, formatDate, formatEur, formatMinutes, formatNumber } from '@/data/format';
import { ACCOUNT_STATUS } from '@/data/labels';
import type { Account, Plan } from '@/data/types';
import { Facts, type Fact } from './Facts';
import { daysFromToday } from './helpers';

function withDays(iso: string): ReactNode {
  return (
    <>
      {formatDate(iso)} <span className="text-fg-subtle">({daysFromToday(iso)})</span>
    </>
  );
}

/** The date that matters most for the current state, with the right words for it. */
function dateFact(account: Account): Fact {
  const past = dayDiff(account.period_end) < 0;
  switch (account.status) {
    case 'trial': {
      const end = account.trial_ends_at ?? account.period_end;
      return { label: 'Preizkus se konča', value: withDays(end) };
    }
    case 'cancelled':
      return { label: past ? 'Naročnina je veljala do' : 'Naročnina velja do', value: formatDate(account.period_end) };
    case 'past_due':
      return {
        label: past ? 'Obračunsko obdobje se je končalo' : 'Konec obračunskega obdobja',
        value: withDays(account.period_end),
      };
    default:
      return { label: 'Naslednja obnova', value: withDays(account.period_end) };
  }
}

export function CurrentPlanCard({
  account,
  plan,
  onShowPlans,
}: {
  account: Account;
  plan: Plan | undefined;
  /** scrolls to the plans; offered while no plan is chosen */
  onShowPlans: () => void;
}) {
  const status = ACCOUNT_STATUS[account.status];
  const onTrial = account.status === 'trial';

  const facts: Fact[] = [
    dateFact(account),
    { label: onTrial ? 'Minute v preizkusu' : 'Vključene minute', value: formatMinutes(account.minutes_included) },
  ];
  if (plan) {
    facts.push(
      { label: 'Največ strani', value: formatNumber(plan.max_pages) },
      { label: 'Največ agentov', value: formatNumber(plan.max_agents) },
    );
  }
  if (!onTrial) {
    facts.unshift({
      label: 'Obračunsko obdobje',
      value: `${formatDate(account.period_start)} – ${formatDate(account.period_end)}`,
    });
  }

  return (
    <Card>
      <CardHeader
        title="Trenutni paket"
        action={<StatusPill tone={status.tone}>{status.label}</StatusPill>}
      />
      <CardBody className="flex flex-col gap-5">
        <div className="min-w-0">
          {plan ? (
            <>
              <p className="font-display text-2xl font-semibold tracking-tight text-fg">{plan.name}</p>
              <p className="nums mt-1 text-base text-fg-muted">{formatEur(plan.price_month_eur)} na mesec</p>
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-semibold tracking-tight text-fg">
                {onTrial ? 'Preizkusno obdobje' : 'Brez paketa'}
              </p>
              <p className="mt-1 text-base text-fg-muted">
                {onTrial
                  ? 'Plačilni paket še ni izbran. Izberite ga spodaj, preden se preizkus konča.'
                  : 'Paket ni izbran. Izberite ga spodaj.'}
              </p>
            </>
          )}
        </div>
        <Facts items={facts} />
        {plan ? null : (
          <div>
            <Button onClick={onShowPlans}>Poglej pakete</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

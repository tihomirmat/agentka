import type { ReactNode } from 'react';
import { Button, Card, CardBody, CardHeader, FactList, StatusPill, type Fact } from '@/components/ui';
import { dayDiff, formatDate, formatDaysLeft, formatEur, formatMinutes } from '@/data/format';
import { ACCOUNT_STATUS, PLAN_FEATURE_LABELS, TRIAL, planFeatureRows } from '@/data/labels';
import type { Account, Plan } from '@/data/types';

/** "3. okt. 2026 (še 4 dni)" while the date is ahead, the plain date once it has passed. */
function withDays(iso: string): ReactNode {
  const days = dayDiff(iso);
  if (days < 0) return formatDate(iso);
  return (
    <>
      {formatDate(iso)} <span className="text-fg-subtle">({formatDaysLeft(days)})</span>
    </>
  );
}

/** The date that matters most for the current state, with the right words for it. */
function dateFact(account: Account): Fact {
  const past = dayDiff(account.period_end) < 0;
  switch (account.status) {
    case 'trial': {
      const end = account.trial_ends_at ?? account.period_end;
      return { label: `${TRIAL.name} se konča`, value: withDays(end) };
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

  // The plan rows come from the one shared set of names (labels.ts → planFeatureRows).
  const facts: Fact[] = [dateFact(account)];
  if (plan) {
    facts.push(...planFeatureRows(plan));
  } else {
    facts.push({
      label: PLAN_FEATURE_LABELS.minutes,
      value: onTrial ? `${formatMinutes(account.minutes_included)} v preizkusu` : formatMinutes(account.minutes_included),
    });
  }
  if (!onTrial) {
    facts.unshift({
      label: 'Obračunsko obdobje',
      value: `${formatDate(account.period_start)} – ${formatDate(account.period_end)}`,
    });
  }

  return (
    <Card>
      <CardHeader title="Trenutni paket" action={<StatusPill tone={status.tone}>{status.label}</StatusPill>} />
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
                {onTrial ? TRIAL.name : 'Brez paketa'}
              </p>
              <p className="mt-1 text-base text-fg-muted">
                {onTrial
                  ? 'Plačilni paket še ni izbran. Izberite ga spodaj, preden se preizkus konča.'
                  : 'Paket ni izbran. Izberite ga spodaj.'}
              </p>
            </>
          )}
        </div>
        <FactList items={facts} />
        {plan ? null : (
          <div>
            <Button onClick={onShowPlans}>Poglej pakete</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

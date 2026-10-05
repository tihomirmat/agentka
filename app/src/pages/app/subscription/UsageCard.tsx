import { Card, CardBody, CardHeader, FactList, ProgressBar } from '@/components/ui';
import { DAY_FORMS, dayDiff, formatDate, formatMinutes, formatNumber, formatPercent, plural } from '@/data/format';
import type { Account } from '@/data/types';

/** One quiet sentence under the bar. Null when the notice above the cards already says it. */
function stateSentence(account: Account): string | null {
  const { minutes_used: used, minutes_included: included } = account;
  if (account.status === 'paused_limit') return null;
  if (included <= 0) return 'V tem obdobju ni vključenih minut.';
  if (used >= included) return 'Vse vključene minute so porabljene.';
  if (used / included >= 0.8) return `Porabili ste že ${formatPercent(used / included)} vključenih minut.`;
  return 'Vključenih minut je še dovolj.';
}

export function UsageCard({ account }: { account: Account }) {
  const { minutes_used: used, minutes_included: included } = account;
  const left = Math.max(0, included - used);
  const days = dayDiff(account.period_end);
  const ratio = included > 0 ? used / included : 0;
  const sentence = stateSentence(account);

  return (
    <Card>
      <CardHeader
        title="Poraba v tem obdobju"
        description={`${formatDate(account.period_start)} – ${formatDate(account.period_end)}`}
      />
      <CardBody className="flex flex-col gap-5">
        <div className="min-w-0">
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="nums font-display text-2xl font-semibold tracking-tight text-fg">{formatNumber(Math.round(used))}</span>
            <span className="nums text-base text-fg-muted">/ {formatMinutes(included)}</span>
            <span className="nums ml-auto text-sm text-fg-muted">{formatPercent(ratio)}</span>
          </p>
          <ProgressBar className="mt-3" label="Porabljene minute" value={used} max={included} />
          {sentence ? <p className="mt-2 text-sm text-fg-muted">{sentence}</p> : null}
        </div>

        <FactList
          items={[
            { label: 'Preostane', value: formatMinutes(left) },
            {
              label: days >= 0 ? 'Do konca obdobja' : 'Obdobje se je končalo',
              value:
                days > 0
                  ? plural(days, DAY_FORMS)
                  : days === 0
                    ? 'Obdobje se konča danes'
                    : formatDate(account.period_end),
            },
          ]}
        />

        {account.status === 'paused_limit' ? null : (
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-fg">Kaj se zgodi ob porabi vseh minut</p>
            <p className="mt-0.5 text-sm text-fg-muted">
              Ko porabite vse vključene minute, agent miruje do obnove naročnine ali do preklopa na večji paket. Ob 80 % in
              ob 100 % porabljenih minut vam pošljemo e-pošto.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

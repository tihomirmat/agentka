import type { Plan } from '@/data/api';
import { Card, CardBody } from '@/components/ui';
import { formatEur, formatNumber } from '@/data/format';
import { minutesText } from '../shared/planText';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-base text-fg-muted">{label}</dt>
      <dd className="nums text-right text-base font-medium text-fg">{value}</dd>
    </div>
  );
}

/**
 * One plan. Everything shown comes from the Plan record. There is no "recommended"
 * flag in the data, so no plan is highlighted.
 */
export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card className="h-full">
      <CardBody>
        <h2 className="font-display text-lg font-semibold text-fg">{plan.name}</h2>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="nums font-display text-3xl font-semibold tracking-tight text-fg">
            {formatEur(plan.price_month_eur)}
          </span>
          <span className="text-sm text-fg-muted">na mesec</span>
        </p>
        <dl className="mt-5 divide-y divide-border border-t border-border">
          <Row label="Minute pogovorov" value={`${minutesText(plan.minutes_included)} na mesec`} />
          <Row label="Agenti" value={formatNumber(plan.max_agents)} />
          <Row label="Uvožene strani" value={`do ${formatNumber(plan.max_pages)}`} />
        </dl>
      </CardBody>
    </Card>
  );
}

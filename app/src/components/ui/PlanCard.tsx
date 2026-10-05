import type { ReactNode } from 'react';
import { formatEur } from '@/data/format';
import { planFeatureRows } from '@/data/labels';
import type { Plan } from '@/data/types';
import { cn } from '@/lib/cn';
import { Badge } from './Badge';
import { Card, CardBody } from './Card';

export interface PlanCardProps {
  plan: Plan;
  /** marks the plan the account is on ("Vaš paket") */
  current?: boolean;
  /** heading level of the plan name (h2 on the public price list, h3 inside a page section) */
  as?: 'h2' | 'h3';
  /** more label–value rows after the standard ones (admin: "ID cene v Stripu") */
  extraRows?: { label: string; value: ReactNode }[];
  /** the one button of the card ("Izberi paket Rast", "Uredi paket"); sits at the bottom */
  action?: ReactNode;
  className?: string;
}

/**
 * THE plan card, the same on the public price list, the landing page, Naročnina and the
 * admin screen: name, price per month, what is included, one action. Everything shown comes
 * from the Plan record; the row names are one set (labels.ts → PLAN_FEATURE_LABELS).
 * The number of agents is not shown while an account can have only one.
 */
export function PlanCard({ plan, current = false, as: Heading = 'h3', extraRows, action, className }: PlanCardProps) {
  const rows = [...planFeatureRows(plan), ...(extraRows ?? [])];
  return (
    <Card className={cn('h-full', current && 'border-accent', className)}>
      <CardBody className="flex h-full flex-col gap-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <Heading className="font-display text-lg font-semibold text-fg">{plan.name}</Heading>
          {current ? <Badge tone="accent">Vaš paket</Badge> : null}
        </div>
        <p className="flex items-baseline gap-1.5">
          <span className="nums font-display text-3xl font-semibold tracking-tight text-fg">
            {formatEur(plan.price_month_eur)}
          </span>
          <span className="text-sm text-fg-muted">na mesec</span>
        </p>
        <dl className="divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <div key={row.label} className="flex min-w-0 items-baseline justify-between gap-3 py-2.5">
              <dt className="text-sm text-fg-muted">{row.label}</dt>
              <dd className="nums min-w-0 break-words text-right text-base font-medium text-fg">{row.value}</dd>
            </div>
          ))}
        </dl>
        {action ? <div className="mt-auto">{action}</div> : null}
      </CardBody>
    </Card>
  );
}

import { CircleCheck } from 'lucide-react';
import { Card, CardBody, CardHeader, CopyValue, EmptyState, FactList, ProgressBar, Stat, StatusPill } from '@/components/ui';
import {
  formatDate,
  formatDateTime,
  formatEur,
  formatMinutesOf,
  formatNumber,
  formatRelativeDateTime,
  plural,
} from '@/data/format';
import {
  ACCOUNT_STATUS,
  AGENT_STATUS,
  AGENT_STATUS_HELP_ADMIN,
  COUNT_LABELS,
  LANGUAGES,
  PAUSED_BY_ADMIN,
  SYNC_WORDS,
  TRIAL,
} from '@/data/labels';
import type { AdminAccountDetail, AdminErrorLine } from '@/data/types';
import { ERROR_FORMS } from './helpers';

/** "še ni bilo opravljeno" → "Še ni bilo opravljeno" (the one wording of labels.ts, at the start of a value). */
const NEVER_SYNCED = SYNC_WORDS.never.charAt(0).toUpperCase() + SYNC_WORDS.never.slice(1);

export function SubscriptionCard({ detail }: { detail: AdminAccountDetail }) {
  const { account, plan } = detail;
  const status = ACCOUNT_STATUS[account.status];
  const trialEnd = account.status === 'trial' ? (account.trial_ends_at ?? account.period_end) : null;

  return (
    <Card>
      <CardHeader title="Naročnina" action={<StatusPill tone={status.tone}>{status.label}</StatusPill>} />
      <CardBody className="flex flex-col gap-5">
        <FactList
          items={[
            { label: 'Paket', value: plan ? `${plan.name}, ${formatEur(plan.price_month_eur)} na mesec` : 'Brez paketa' },
            {
              label: 'Obračunsko obdobje',
              value: `${formatDate(account.period_start)} – ${formatDate(account.period_end)}`,
            },
            trialEnd
              ? { label: `${TRIAL.name} se konča`, value: formatDate(trialEnd) }
              : { label: 'Konec obdobja', value: formatDate(account.period_end) },
            { label: 'Strošek tega obdobja (ocena)', value: formatEur(detail.estimated_cost_eur) },
          ]}
        />
        <div className="min-w-0">
          <p className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-fg-subtle">Minute v tem obdobju</span>
            <span className="nums text-base text-fg">{formatMinutesOf(account.minutes_used, account.minutes_included)}</span>
          </p>
          <ProgressBar
            className="mt-2"
            label="Porabljene minute"
            value={account.minutes_used}
            max={account.minutes_included}
          />
        </div>
      </CardBody>
    </Card>
  );
}

export function AgentCard({ detail }: { detail: AdminAccountDetail }) {
  const { agent } = detail;
  const status = AGENT_STATUS[detail.agent_status];
  // EVERY pause in force, weightiest first: the admin's own pause is listed even when a failed
  // payment outranks it, so nobody has to guess why the agent stays off after lifting one.
  const reasons = detail.agent_status === 'paused' ? detail.agent_pause_reasons : [];
  return (
    <Card>
      <CardHeader title="Agent" action={<StatusPill tone={status.tone}>{status.label}</StatusPill>} />
      <CardBody className="flex flex-col gap-4">
        <div className="min-w-0">
          <p className="text-sm text-fg-muted">{AGENT_STATUS_HELP_ADMIN[detail.agent_status]}</p>
          {reasons.length > 1 ? (
            <p className="mt-1 text-sm text-fg-muted">Agent je ustavljen iz več razlogov. Odprava enega ne odpravi drugih.</p>
          ) : null}
          {reasons.length > 0 ? (
            <ul className="mt-1 flex flex-col gap-1">
              {reasons.map((reason) => (
                <li key={reason} className="text-sm text-fg">
                  <span className="font-medium">{PAUSED_BY_ADMIN[reason].label}.</span> {PAUSED_BY_ADMIN[reason].help}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <FactList
          items={[
            { label: 'Ime agenta', value: agent.name },
            { label: 'Jezik agenta', value: LANGUAGES.find((l) => l.value === agent.language)?.label ?? agent.language },
            {
              label: 'Dovoljena domena',
              value: agent.allowed_domain ? <span className="font-mono text-sm">{agent.allowed_domain}</span> : 'Ni nastavljena',
            },
            {
              label: 'ID agenta pri ElevenLabs',
              wide: true,
              value: agent.elevenlabs_agent_id ? (
                <CopyValue value={agent.elevenlabs_agent_id} mono copyLabel="Kopiraj ID agenta pri ElevenLabs" />
              ) : (
                <span className="text-fg-muted">Agent še ni ustvarjen.</span>
              ),
            },
          ]}
        />
      </CardBody>
    </Card>
  );
}

/** Viri znanja: counts only, including the sources that could not be read. */
export function KnowledgeCard({ detail }: { detail: AdminAccountDetail }) {
  const excluded = detail.sources_total - detail.sources_included;
  return (
    <Card>
      <CardHeader title="Viri znanja" />
      <CardBody className="flex flex-col gap-5">
        <div className="flex min-w-0 flex-wrap gap-x-8 gap-y-4">
          <Stat variant="inline" label="Vseh virov" value={formatNumber(detail.sources_total)} />
          <Stat variant="inline" label="Vključenih" value={formatNumber(detail.sources_included)} />
          <Stat variant="inline" label="Izključenih" value={formatNumber(excluded)} />
          <Stat variant="inline" label="Z napako" value={formatNumber(detail.sources_failed)} sub="ni bilo mogoče prebrati" />
        </div>
        <FactList
          columns={1}
          items={[
            {
              label: SYNC_WORDS.lastLabel,
              value: detail.agent.last_sync_at ? formatRelativeDateTime(detail.agent.last_sync_at) : NEVER_SYNCED,
            },
          ]}
        />
      </CardBody>
    </Card>
  );
}

/**
 * Aktivnost: numbers only, for the current billing period, counted exactly like the
 * customer's own Pregled (the data layer does it once: detail.period).
 */
export function ActivityCard({ detail }: { detail: AdminAccountDetail }) {
  const { period } = detail;
  const outcome = period.conversations.by_outcome;
  return (
    <Card>
      <CardHeader title="Aktivnost" description={`${formatDate(period.start)} – ${formatDate(period.end)}`} />
      <CardBody className="flex flex-col gap-5">
        <div className="flex min-w-0 flex-wrap gap-x-8 gap-y-4">
          <Stat
            variant="inline"
            label={COUNT_LABELS.conversationsInPeriod.label}
            value={formatNumber(period.conversations.total)}
            sub={COUNT_LABELS.conversationsInPeriod.sub}
          />
          <Stat
            variant="inline"
            label={COUNT_LABELS.leadsInPeriod.label}
            value={formatNumber(period.leads)}
            sub={COUNT_LABELS.leadsInPeriod.sub}
          />
          <Stat
            variant="inline"
            label={COUNT_LABELS.bookingsInPeriod.label}
            value={formatNumber(period.bookings)}
            sub={COUNT_LABELS.bookingsInPeriod.sub}
          />
        </div>
        <div className="flex min-w-0 flex-wrap gap-x-8 gap-y-4 border-t border-border pt-4">
          <Stat variant="inline" label={COUNT_LABELS.outcome.question} value={formatNumber(outcome.question)} />
          <Stat variant="inline" label={COUNT_LABELS.outcome.lead} value={formatNumber(outcome.lead)} />
          <Stat variant="inline" label={COUNT_LABELS.outcome.booking} value={formatNumber(outcome.booking)} />
        </div>
        <FactList
          items={[
            { label: 'Pogovorov od začetka', value: formatNumber(detail.conversations_total) },
            {
              label: 'Zadnji pogovor',
              value: detail.last_conversation_at ? formatRelativeDateTime(detail.last_conversation_at) : 'Še ni pogovorov',
            },
          ]}
        />
      </CardBody>
    </Card>
  );
}

const ERROR_KIND: Record<AdminErrorLine['kind'], string> = {
  email: 'E-pošta',
  source: 'Vir znanja',
  payment: 'Plačilo',
};

export function ErrorsCard({ detail }: { detail: AdminAccountDetail }) {
  const { errors } = detail;
  return (
    <Card>
      <CardHeader
        title="Napake"
        description={errors.length > 0 ? plural(errors.length, ERROR_FORMS) : undefined}
        divider={errors.length > 0}
      />
      {errors.length === 0 ? (
        <EmptyState compact icon={CircleCheck} title="Brez napak" />
      ) : (
        <ul>
          {errors.map((error, i) => (
            <li
              key={`${error.kind}-${error.at ?? 'brez-casa'}-${i}`}
              className="flex min-w-0 flex-col gap-0.5 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:gap-6 sm:px-5"
            >
              {/* The kind is always known; the moment only when the data has a real one. */}
              <span className="shrink-0 sm:w-44 sm:pt-px">
                <span className="block text-sm font-medium text-fg-muted">{ERROR_KIND[error.kind]}</span>
                {error.at ? <span className="nums block text-sm text-fg-subtle">{formatDateTime(error.at)}</span> : null}
              </span>
              <span className="min-w-0 break-words text-base text-fg">{error.text}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

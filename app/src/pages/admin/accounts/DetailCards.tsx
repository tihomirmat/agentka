import type { ReactNode } from 'react';
import { CircleCheck } from 'lucide-react';
import { Card, CardBody, CardHeader, CopyValue, EmptyState, ProgressBar, StatusPill } from '@/components/ui';
import {
  formatDate,
  formatDateTime,
  formatEur,
  formatMinutesOf,
  formatNumber,
  formatRelativeDateTime,
  plural,
} from '@/data/format';
import { ACCOUNT_STATUS, AGENT_STATUS, LANGUAGES } from '@/data/labels';
import type { AdminAccountDetail, ConversationOutcome } from '@/data/types';
import { Facts } from '@/pages/app/subscription/Facts';
import { ERROR_FORMS } from './helpers';

const MUTED = <span className="text-fg-subtle">–</span>;

export function SubscriptionCard({ detail }: { detail: AdminAccountDetail }) {
  const { account, plan } = detail;
  const status = ACCOUNT_STATUS[account.status];
  const trialEnd = account.status === 'trial' ? (account.trial_ends_at ?? account.period_end) : null;

  return (
    <Card>
      <CardHeader title="Naročnina" action={<StatusPill tone={status.tone}>{status.label}</StatusPill>} />
      <CardBody className="flex flex-col gap-5">
        <Facts
          items={[
            { label: 'Paket', value: plan ? `${plan.name}, ${formatEur(plan.price_month_eur)} na mesec` : 'Brez paketa' },
            {
              label: 'Obračunsko obdobje',
              value: `${formatDate(account.period_start)} – ${formatDate(account.period_end)}`,
            },
            trialEnd
              ? { label: 'Preizkus se konča', value: formatDate(trialEnd) }
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
  return (
    <Card>
      <CardHeader title="Agent" action={<StatusPill tone={status.tone}>{status.label}</StatusPill>} />
      <CardBody>
        <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Item label="Ime agenta">{agent.name}</Item>
          <Item label="Jezik agenta">{LANGUAGES.find((l) => l.value === agent.language)?.label ?? agent.language}</Item>
          <Item label="Dovoljena domena">
            {agent.allowed_domain ? <span className="font-mono text-sm">{agent.allowed_domain}</span> : 'Ni nastavljena'}
          </Item>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-sm text-fg-subtle">ID agenta pri ElevenLabs</dt>
            <dd className="mt-0.5 min-w-0">
              {agent.elevenlabs_agent_id ? (
                <CopyValue value={agent.elevenlabs_agent_id} mono copyLabel="Kopiraj ID agenta pri ElevenLabs" />
              ) : (
                <span className="text-base text-fg-muted">Agent še ni ustvarjen.</span>
              )}
            </dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 break-words text-base text-fg">{children}</dd>
    </div>
  );
}

export function KnowledgeCard({ detail }: { detail: AdminAccountDetail }) {
  const excluded = detail.sources_total - detail.sources_included;
  return (
    <Card>
      <CardHeader title="Viri znanja" />
      <CardBody>
        <Facts
          items={[
            { label: 'Vseh virov', value: formatNumber(detail.sources_total) },
            { label: 'Vključenih', value: formatNumber(detail.sources_included) },
            { label: 'Izključenih', value: formatNumber(excluded) },
            {
              label: 'Zadnja sinhronizacija',
              value: detail.agent.last_sync_at ? formatRelativeDateTime(detail.agent.last_sync_at) : 'Še ni bila',
            },
          ]}
        />
      </CardBody>
    </Card>
  );
}

const OUTCOMES: { key: ConversationOutcome; label: string }[] = [
  { key: 'question', label: 'Vprašanja' },
  { key: 'lead', label: 'Kontakti' },
  { key: 'booking', label: 'Rezervacije' },
];

/** Counts only: the API returns numbers for the current period, never a conversation. */
export function ActivityCard({ detail }: { detail: AdminAccountDetail }) {
  const inPeriod = detail.period.conversations;
  const counts = OUTCOMES.map(({ key, label }) => ({ label, n: inPeriod.by_outcome[key] }));

  return (
    <Card>
      <CardHeader title="Aktivnost" />
      <CardBody className="flex flex-col gap-5">
        <Facts
          items={[
            { label: 'Pogovorov skupaj', value: formatNumber(detail.conversations_total) },
            {
              label: 'Zadnji pogovor',
              value: detail.last_conversation_at ? formatRelativeDateTime(detail.last_conversation_at) : 'Še ni pogovorov',
            },
          ]}
        />
        <div className="min-w-0">
          <p className="text-sm text-fg-subtle">
            {inPeriod.total > 0 ? `Izid pogovorov v tem obdobju (${formatNumber(inPeriod.total)})` : 'Izid pogovorov v tem obdobju'}
          </p>
          <dl className="mt-1.5 grid grid-cols-3 gap-3">
            {counts.map((c) => (
              <div key={c.label} className="min-w-0 rounded border border-border px-3 py-2">
                <dd className="nums font-display text-xl font-semibold text-fg">{inPeriod.total > 0 ? c.n : MUTED}</dd>
                <dt className="truncate text-sm text-fg-muted">{c.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </CardBody>
    </Card>
  );
}

const EMAIL_IN_TEXT = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>().,;:]+/g;

/**
 * The API's error texts name the recipient of a failed e-mail, and that can be a visitor.
 * The platform admin needs to see that and why a message failed, not whom it was for.
 */
function hideAddresses(text: string): string {
  return text.replace(EMAIL_IN_TEXT, '[e-naslov skrit]');
}

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
              key={`${error.at}-${i}`}
              className="flex min-w-0 flex-col gap-0.5 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:gap-6 sm:px-5"
            >
              <span className="nums shrink-0 text-sm text-fg-subtle sm:w-44 sm:pt-px">
                {error.at ? formatDateTime(error.at) : 'Čas ni znan'}
              </span>
              <span className="min-w-0 break-words text-base text-fg">{hideAddresses(error.text)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

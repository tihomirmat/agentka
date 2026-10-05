import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CircleAlert, Search, SearchX } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  EmptyState,
  Input,
  PageHeader,
  ProgressBar,
  Select,
  Skeleton,
  SkeletonRows,
  Stat,
  StatusPill,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import * as api from '@/data/api';
import {
  formatEur,
  formatMinutesOf,
  formatNumber,
  formatRelativeDateTime,
  formatUrl,
  plural,
} from '@/data/format';
import { ACCOUNT_STATUS, AGENT_STATUS } from '@/data/labels';
import { ACCOUNT_FORMS, ERROR_FORMS, needsAttention, STATUS_ORDER } from './accounts/helpers';

type StatusFilter = 'all' | api.AccountStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Vsa stanja naročnine' },
  ...STATUS_ORDER.map((s) => ({ value: s, label: ACCOUNT_STATUS[s].label })),
];

function StatsRow({ rows }: { rows: api.AdminAccountRow[] }) {
  const count = (status: api.AccountStatus) => rows.filter((r) => r.account.status === status).length;
  const attention = rows.filter(needsAttention).length;
  const used = rows.reduce((sum, r) => sum + r.account.minutes_used, 0);
  const included = rows.reduce((sum, r) => sum + r.account.minutes_included, 0);
  // The cost comes from the API's own estimate per account; it is only added up here.
  const cost = Math.round(rows.reduce((sum, r) => sum + r.estimated_cost_eur, 0) * 100) / 100;

  return (
    <div className="mb-6 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <Stat
        className="col-span-2 sm:col-span-1"
        label="Uporabniški računi"
        value={formatNumber(rows.length)}
        sub={`Potrebujejo pozornost: ${attention}`}
      />
      <Stat label="Aktivne naročnine" value={formatNumber(count('active'))} />
      <Stat label="Poskusno obdobje" value={formatNumber(count('trial'))} />
      <Stat label="Zapadlo plačilo" value={formatNumber(count('past_due'))} />
      <Stat label="Minute ta mesec" value={formatNumber(Math.round(used))} unit={`/ ${formatNumber(included)} min`} sub="skupaj za vse stranke" />
      <Stat className="col-span-2 sm:col-span-1" label="Strošek (ocena)" value={formatEur(cost)} sub="ocena po porabljenih minutah" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="mb-6 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4" role="status" aria-label="Nalaganje">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-surface px-4 py-3.5 sm:px-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function Accounts() {
  const accounts = api.useQuery(() => api.adminListAccounts(), []);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [attentionOnly, setAttentionOnly] = useState(false);

  const rows = accounts.data;
  const attentionCount = rows?.filter(needsAttention).length ?? 0;

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (status !== 'all' && r.account.status !== status) return false;
        if (attentionOnly && !needsAttention(r)) return false;
        if (!q) return true;
        return r.account.name.toLowerCase().includes(q) || formatUrl(r.account.website_url).toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const byAttention = Number(needsAttention(b)) - Number(needsAttention(a));
        return byAttention !== 0 ? byAttention : a.account.name.localeCompare(b.account.name, 'sl');
      });
  }, [rows, search, status, attentionOnly]);

  const filtered = search.trim() !== '' || status !== 'all' || attentionOnly;
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setAttentionOnly(false);
  };

  const header = (
    <PageHeader title="Računi" description="Vsi uporabniški računi strank na platformi: paket, poraba minut in napake." />
  );

  if (accounts.loading) {
    return (
      <>
        {header}
        <StatsSkeleton />
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      </>
    );
  }

  if (accounts.error || !rows) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={accounts.error ?? 'Uporabniških računov ni bilo mogoče naložiti.'}
            action={<Button onClick={accounts.reload}>Poskusi znova</Button>}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      {header}
      <StatsRow rows={rows} />

      <Card>
        <CardHeader
          title="Uporabniški računi"
          description={
            attentionCount > 0
              ? `${plural(attentionCount, ['uporabniški račun potrebuje', 'uporabniška računa potrebujeta', 'uporabniški računi potrebujejo', 'uporabniških računov potrebuje'])} pozornost. Ti so na vrhu seznama.`
              : 'Noben uporabniški račun ne potrebuje pozornosti.'
          }
          divider={false}
        />
        {rows.length > 0 ? (
          <div className="grid min-w-0 items-center gap-x-4 gap-y-3 border-b border-border px-4 pb-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_15rem_auto]">
            <Input
              type="search"
              aria-label="Išči po imenu podjetja ali spletni strani"
              placeholder="Išči po imenu ali spletni strani"
              prefix={<Search size={16} aria-hidden="true" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            <Select<StatusFilter>
              aria-label="Filter po stanju naročnine"
              value={status}
              options={FILTER_OPTIONS}
              onValueChange={setStatus}
            />
            <Checkbox
              label={`Potrebujejo pozornost (${attentionCount})`}
              checked={attentionOnly}
              onChange={(e) => setAttentionOnly(e.target.checked)}
            />
          </div>
        ) : null}

        <Table
          minWidth={980}
          caption="Uporabniški računi strank"
          empty={
            rows.length === 0 ? (
              <EmptyState icon={Building2} title="Ko se prva stranka registrira, se tukaj pojavi njen uporabniški račun." />
            ) : visible.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={`Noben uporabniški račun ne ustreza ${filtered ? 'izbranim filtrom' : 'iskanju'}.`}
                action={<Button onClick={clearFilters}>Počisti filtre</Button>}
              />
            ) : null
          }
        >
          <THead>
            <TR>
              <TH>Podjetje</TH>
              <TH>Paket</TH>
              <TH>Naročnina</TH>
              <TH>Agent</TH>
              <TH>Minute ta mesec</TH>
              <TH>Zadnji pogovor</TH>
              <TH>Napake</TH>
            </TR>
          </THead>
          <TBody>
            {visible.map((row) => {
              const { account } = row;
              const sub = ACCOUNT_STATUS[account.status];
              const agent = AGENT_STATUS[row.agent_status];
              return (
                <TR key={account.id} interactive>
                  <TD className="max-w-[14rem]">
                    <Link
                      to={`/admin/racuni/${account.id}`}
                      className="block truncate rounded font-medium text-fg hover:text-accent hover:underline"
                    >
                      {account.name}
                    </Link>
                    <span className="block truncate text-sm text-fg-muted">{formatUrl(account.website_url) || 'Brez spletne strani'}</span>
                  </TD>
                  <TD nowrap>
                    {row.plan ? <Badge tone="accent">{row.plan.name}</Badge> : <span className="text-fg-subtle">Brez paketa</span>}
                  </TD>
                  <TD>
                    <StatusPill tone={sub.tone}>{sub.label}</StatusPill>
                  </TD>
                  <TD>
                    <StatusPill tone={agent.tone}>{agent.label}</StatusPill>
                  </TD>
                  <TD className="w-40">
                    <span className="nums block whitespace-nowrap text-sm text-fg">
                      {formatMinutesOf(account.minutes_used, account.minutes_included)}
                    </span>
                    <ProgressBar
                      size="sm"
                      className="mt-1.5"
                      label={`Porabljene minute: ${account.name}`}
                      value={account.minutes_used}
                      max={account.minutes_included}
                    />
                  </TD>
                  <TD nowrap muted>
                    {row.last_conversation_at ? formatRelativeDateTime(row.last_conversation_at) : 'Še ni pogovorov'}
                  </TD>
                  <TD>
                    {row.error_count > 0 ? (
                      <StatusPill tone="danger">{plural(row.error_count, ERROR_FORMS)}</StatusPill>
                    ) : (
                      <span className="text-fg-subtle">0</span>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
      <p className="mt-3 text-sm text-fg-subtle">
        {`Prikazano: ${plural(visible.length, ACCOUNT_FORMS)} od ${formatNumber(rows.length)}.`}
      </p>
    </>
  );
}

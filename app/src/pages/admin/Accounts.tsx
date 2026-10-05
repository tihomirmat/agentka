import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CircleAlert, SearchX } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FilterChips,
  PageHeader,
  ProgressBar,
  SearchField,
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
  useTableStacked,
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
import { ACCOUNT_STATUS, AGENT_STATUS, PAUSED_BY_ADMIN, TRIAL } from '@/data/labels';
import {
  ACCOUNT_FORMS,
  ACCOUNT_FORMS_OF,
  ERROR_FORMS,
  formIndex,
  needsAttention,
  STATUS_ORDER,
} from './accounts/helpers';

/** One filter, one word per state: the chips use the words the rows show. */
type Filter = 'all' | 'attention' | api.AccountStatus;

/** "Pozornost potrebujeta 2 uporabniška računa. Najdete ju na vrhu seznama." */
function attentionSentence(n: number): string {
  if (n === 0) return 'Noben uporabniški račun ne potrebuje pozornosti.';
  const i = formIndex(n);
  const verb = ['potrebuje', 'potrebujeta', 'potrebujejo', 'potrebuje'][i];
  const it = ['ga', 'ju', 'jih', 'jih'][i];
  return `Pozornost ${verb} ${plural(n, ACCOUNT_FORMS)}. Najdete ${it} na vrhu seznama.`;
}

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
      <Stat label={TRIAL.name} value={formatNumber(count('trial'))} />
      <Stat label={ACCOUNT_STATUS.past_due.label} value={formatNumber(count('past_due'))} />
      <Stat label="Minute v tem obdobju" value={formatNumber(Math.round(used))} unit={`/ ${formatNumber(included)} min`} sub="skupaj za vse stranke" />
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

/**
 * Company name (a link to the detail) and its website. On a phone it is the title of the row's
 * card. Both may wrap anywhere, so this column gives way before the table has to scroll sideways.
 */
function CompanyCell({ account }: { account: api.Account }) {
  return (
    <div className="min-w-[8rem] [overflow-wrap:anywhere]">
      <Link
        to={`/admin/racuni/${account.id}`}
        className="block rounded font-medium text-fg hover:text-accent hover:underline"
      >
        {account.name}
      </Link>
      <span className="block text-sm font-normal text-fg-muted">{formatUrl(account.website_url) || 'Brez spletne strani'}</span>
    </div>
  );
}

/** The agent's state; a paused agent also says who holds it, so no row needs a click to be understood. */
function AgentCell({ row }: { row: api.AdminAccountRow }) {
  const stacked = useTableStacked();
  const agent = AGENT_STATUS[row.agent_status];
  const heldBy = row.agent_status === 'paused' ? row.agent_paused_by : null;
  return (
    <div className={stacked ? 'flex min-w-0 flex-col items-end gap-1' : 'flex min-w-0 flex-col items-start gap-1'}>
      <StatusPill tone={agent.tone}>{agent.label}</StatusPill>
      {heldBy ? <span className="max-w-[11rem] text-sm text-fg-muted">{PAUSED_BY_ADMIN[heldBy].label}</span> : null}
    </div>
  );
}

export default function Accounts() {
  const accounts = api.useQuery(() => api.adminListAccounts(), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const rows = accounts.data;
  const attentionCount = rows?.filter(needsAttention).length ?? 0;

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === 'attention' && !needsAttention(r)) return false;
        if (filter !== 'all' && filter !== 'attention' && r.account.status !== filter) return false;
        if (!q) return true;
        return r.account.name.toLowerCase().includes(q) || formatUrl(r.account.website_url).toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const byAttention = Number(needsAttention(b)) - Number(needsAttention(a));
        return byAttention !== 0 ? byAttention : a.account.name.localeCompare(b.account.name, 'sl');
      });
  }, [rows, search, filter]);

  const filtered = search.trim() !== '' || filter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setFilter('all');
  };

  const header = (
    <PageHeader
      title="Uporabniški računi"
      description="Vsi uporabniški računi strank na platformi: paket, poraba minut in napake."
    />
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

  const chips: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'Vsi', count: rows.length },
    { value: 'attention', label: 'Potrebujejo pozornost', count: attentionCount },
    ...STATUS_ORDER.map((s) => ({
      value: s as Filter,
      label: ACCOUNT_STATUS[s].label,
      count: rows.filter((r) => r.account.status === s).length,
    })).filter((c) => c.count > 0 || c.value === filter),
  ];

  return (
    <>
      {header}
      <StatsRow rows={rows} />

      <Card>
        <CardHeader title="Seznam" description={attentionSentence(attentionCount)} divider={false} />
        {rows.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-3 border-b border-border px-4 pb-4 sm:px-5">
            <SearchField
              label="Iskanje po uporabniških računih"
              placeholder="Ime podjetja ali spletna stran"
              value={search}
              onChange={setSearch}
              className="w-full md:max-w-sm"
            />
            <FilterChips label="Stanje uporabniškega računa" value={filter} onChange={setFilter} options={chips} />
          </div>
        ) : null}

        <Table
          minWidth={980}
          stackBelow={980}
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
              <TH className="whitespace-normal">Minute v tem obdobju</TH>
              <TH>Zadnji pogovor</TH>
              <TH>Napake</TH>
            </TR>
          </THead>
          <TBody>
            {visible.map((row) => {
              const { account } = row;
              const sub = ACCOUNT_STATUS[account.status];
              return (
                <TR key={account.id} interactive>
                  <TD>
                    <CompanyCell account={account} />
                  </TD>
                  <TD nowrap label="Paket">
                    {row.plan ? <Badge tone="accent">{row.plan.name}</Badge> : <span className="text-fg-subtle">Brez paketa</span>}
                  </TD>
                  <TD label="Naročnina">
                    <StatusPill tone={sub.tone}>{sub.label}</StatusPill>
                  </TD>
                  <TD label="Agent">
                    <AgentCell row={row} />
                  </TD>
                  <TD label="Minute v tem obdobju">
                    <div className="w-28 max-w-full">
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
                    </div>
                  </TD>
                  <TD muted label="Zadnji pogovor">
                    {row.last_conversation_at ? formatRelativeDateTime(row.last_conversation_at).replace(' ob ', ' ob\u00a0') : 'Še ni pogovorov'}
                  </TD>
                  <TD label="Napake">
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
        {`Prikazano: ${formatNumber(visible.length)} od ${plural(rows.length, ACCOUNT_FORMS_OF)}.`}
      </p>
    </>
  );
}

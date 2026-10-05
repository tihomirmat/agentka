import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CircleAlert, EyeOff, Globe, Search } from 'lucide-react';
import * as api from '@/data/api';
import { formatNumber, formatRelativeDateTime, formatUrl } from '@/data/format';
import { SOURCE_STATUS } from '@/data/labels';
import {
  Button,
  Card,
  CardHeader,
  Checkbox,
  EmptyState,
  Input,
  Select,
  SkeletonRows,
  StatusPill,
  Switch,
  Table,
  TBody,
  TD,
  TH,
  THead,
  Tooltip,
  TR,
  useToast,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { fold, pagesNowIncluded } from './helpers';

type Filter = 'all' | 'included' | 'excluded' | 'error';

/*
 * The table switches from the compact layout (status, size and date under the title) to
 * the full one (own columns) at a viewport of 1360px. Tailwind needs the class names
 * written out in full, so they are constants and never built from parts.
 */
const FULL_CELL = 'hidden min-[1360px]:table-cell';
const COMPACT_ONLY = 'min-[1360px]:hidden';

interface PagesCardProps {
  pages: api.KnowledgeSource[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** an import or sync is running: the rows must not change under it */
  busy: boolean;
  onFocusUrl: () => void;
}

/** Table of the imported website pages with include switches, search, filter and bulk actions. */
export function PagesCard({ pages, loading, error, reload, busy, onFocusUrl }: PagesCardProps) {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // What the person just chose, until the refreshed list shows it (so a switch never jumps back).
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const toggle = api.useAction(api.toggleSource);
  const bulk = api.useAction(async (ids: string[], included: boolean) => {
    await Promise.all(ids.map((id) => api.toggleSource(id, included)));
    return ids.length;
  });

  useEffect(() => {
    setOptimistic((prev) => {
      let next: Record<string, boolean> | null = null;
      for (const p of pages) {
        if (p.id in prev && prev[p.id] === p.included) {
          next ??= { ...prev };
          delete next[p.id];
        }
      }
      return next ?? prev;
    });
  }, [pages]);

  const isIncluded = (p: api.KnowledgeSource) => optimistic[p.id] ?? p.included;

  const counts = {
    all: pages.length,
    included: pages.filter((p) => p.included).length,
    excluded: pages.filter((p) => !p.included).length,
    error: pages.filter((p) => p.status === 'error').length,
  };

  const needle = fold(query.trim());
  const visible = useMemo(
    () =>
      pages.filter((p) => {
        if (filter === 'included' && !p.included) return false;
        if (filter === 'excluded' && p.included) return false;
        if (filter === 'error' && p.status !== 'error') return false;
        if (!needle) return true;
        return fold(p.title).includes(needle) || fold(p.url ?? '').includes(needle);
      }),
    [pages, filter, needle],
  );

  const chosen = visible.filter((p) => selected.has(p.id));
  const allChosen = visible.length > 0 && chosen.length === visible.length;
  const canInclude = chosen.some((p) => !isIncluded(p));
  const canExclude = chosen.some((p) => isIncluded(p));

  function changeFilter(next: Filter) {
    setFilter(next);
    setSelected(new Set());
  }

  function changeQuery(next: string) {
    setQuery(next);
    setSelected(new Set());
  }

  async function setOne(p: api.KnowledgeSource, included: boolean) {
    setOptimistic((prev) => ({ ...prev, [p.id]: included }));
    const r = await toggle.run(p.id, included);
    if (!r) {
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      toast.error('Stanja strani ni bilo mogoče spremeniti. Poskusite znova.');
      return;
    }
    toast.success(
      included
        ? `Stran »${p.title}« je vključena. Agent jo bo uporabljal.`
        : `Stran »${p.title}« je izključena. Agent je ne uporablja več.`,
    );
  }

  async function setMany(included: boolean) {
    const targets = chosen.filter((p) => isIncluded(p) !== included);
    if (targets.length === 0) return;
    setOptimistic((prev) => {
      const next = { ...prev };
      for (const p of targets) next[p.id] = included;
      return next;
    });
    const n = await bulk.run(
      targets.map((p) => p.id),
      included,
    );
    if (n === undefined) {
      setOptimistic((prev) => {
        const next = { ...prev };
        for (const p of targets) delete next[p.id];
        return next;
      });
      toast.error('Strani ni bilo mogoče spremeniti. Poskusite znova.');
      return;
    }
    setSelected(new Set());
    toast.success(`${pagesNowIncluded(n, included)}.`);
  }

  function toggleRow(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const rowsLocked = busy || bulk.pending;

  let body: ReactNode;
  if (loading) {
    body = <SkeletonRows rows={6} />;
  } else if (error && pages.length === 0) {
    body = (
      <EmptyState
        icon={CircleAlert}
        title={error}
        action={<Button onClick={reload}>Poskusi znova</Button>}
      />
    );
  } else if (pages.length === 0) {
    body = (
      <EmptyState
        icon={Globe}
        title="Uvozite svojo spletno stran, da bo agent imel iz česa odgovarjati."
        action={
          <Button variant="secondary" onClick={onFocusUrl}>
            Vpišite naslov spletne strani
          </Button>
        }
      />
    );
  } else if (visible.length === 0) {
    body = (
      <EmptyState
        compact
        icon={Search}
        title="Nobena stran ne ustreza iskanju ali filtru."
        action={
          <Button
            size="sm"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
          >
            Počisti iskanje in filter
          </Button>
        }
      />
    );
  } else {
    body = (
      <Table minWidth={320} caption="Strani vaše spletne strani, ki jih agent lahko uporablja">
        <THead>
          <TR>
            <TH className="w-10 pr-0">
              <Checkbox
                aria-label="Izberi vse prikazane strani"
                checked={allChosen}
                onChange={(e) =>
                  setSelected(e.target.checked ? new Set(visible.map((p) => p.id)) : new Set())
                }
              />
            </TH>
            <TH>Naslov</TH>
            <TH>Vključena</TH>
            <TH className={FULL_CELL}>Stanje</TH>
            <TH className={FULL_CELL}>Naslov strani</TH>
            <TH numeric className={FULL_CELL}>
              Znaki
            </TH>
            <TH className={FULL_CELL}>Zadnja sinhronizacija</TH>
          </TR>
        </THead>
        <TBody>
          {visible.map((p) => {
            const on = isIncluded(p);
            const status = SOURCE_STATUS[p.status];
            const failed = p.status === 'error';
            const shownUrl = p.url ? formatUrl(p.url) : '';
            const hasNote = !on || failed;
            return (
              <Fragment key={p.id}>
                <TR muted={!on} className={cn(hasNote && 'border-b-0')}>
                  <TD className="w-10 pr-0 align-top">
                    <Checkbox
                      aria-label={`Izberi stran »${p.title}«`}
                      checked={selected.has(p.id)}
                      onChange={(e) => toggleRow(p.id, e.target.checked)}
                    />
                  </TD>
                  <TD className="min-w-0 align-top">
                    <p className={cn('break-words font-medium', on ? 'text-fg' : 'text-fg-muted')}>{p.title}</p>
                    <div className={cn('mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1', COMPACT_ONLY)}>
                      <StatusPill tone={status.tone} live={p.status === 'pending'}>
                        {status.label}
                      </StatusPill>
                      <span className="nums text-xs text-fg-subtle">{formatNumber(p.chars)} znakov</span>
                      <span className="text-xs text-fg-subtle">
                        {p.last_synced_at ? formatRelativeDateTime(p.last_synced_at) : 'še ni sinhronizirana'}
                      </span>
                    </div>
                    {shownUrl ? (
                      <p className={cn('mt-1 break-all font-mono text-xs text-fg-subtle', COMPACT_ONLY)}>
                        {shownUrl}
                      </p>
                    ) : null}
                  </TD>
                  <TD className="align-top">
                    <Switch
                      aria-label={`Agent uporablja stran »${p.title}«`}
                      checked={on}
                      disabled={rowsLocked || (p.id in optimistic && toggle.pending)}
                      onCheckedChange={(next) => void setOne(p, next)}
                    />
                  </TD>
                  <TD className={cn('align-top', FULL_CELL)}>
                    <StatusPill tone={status.tone} live={p.status === 'pending'}>
                      {status.label}
                    </StatusPill>
                  </TD>
                  <TD className={cn('align-top', FULL_CELL)}>
                    {shownUrl && p.url ? (
                      <Tooltip content={p.url}>
                        <span
                          tabIndex={0}
                          className="block max-w-[15rem] truncate rounded font-mono text-sm text-fg-muted"
                        >
                          {shownUrl}
                        </span>
                      </Tooltip>
                    ) : (
                      '—'
                    )}
                  </TD>
                  <TD numeric className={cn('align-top', FULL_CELL)}>
                    {formatNumber(p.chars)}
                  </TD>
                  <TD nowrap muted className={cn('align-top', FULL_CELL)}>
                    {p.last_synced_at ? formatRelativeDateTime(p.last_synced_at) : '—'}
                  </TD>
                </TR>
                {hasNote ? (
                  // The explanation gets a line of its own, as wide as the table: in the title column it wrapped into a tall, narrow strip.
                  <TR muted={!on}>
                    <TD colSpan={7} className="pt-0 first:pl-14 sm:first:pl-14">
                      {!on ? (
                        <p className="flex items-start gap-1.5 text-sm text-fg-subtle">
                          <EyeOff size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                          <span>Izključena stran: agent je ne uporablja.</span>
                        </p>
                      ) : null}
                      {failed ? (
                        <p className="flex items-start gap-1.5 text-sm text-danger">
                          <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                          <span>
                            {p.error ?? 'Strani ni bilo mogoče prebrati.'} Preverite, ali se stran odpre v brskalniku, nato
                            pritisnite »Sinhroniziraj zdaj«. Če se napaka ponovi, stran izključite.
                          </span>
                        </p>
                      ) : null}
                    </TD>
                  </TR>
                ) : null}
              </Fragment>
            );
          })}
        </TBody>
      </Table>
    );
  }

  const showTools = !loading && pages.length > 0;

  return (
    <Card>
      <CardHeader
        title="Strani"
        description="Agent uporablja samo vključene strani. Izključite tiste, ki jih agent ne sme uporabljati."
        divider={!showTools}
      />
      {showTools ? (
        <div className="flex flex-col gap-3 border-b border-border px-4 pb-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1 basis-56 sm:max-w-sm">
              <Input
                aria-label="Poiščite stran po naslovu ali naslovu strani"
                type="search"
                prefix={<Search size={16} aria-hidden="true" />}
                placeholder="Poiščite stran"
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
              />
            </div>
            <Select<Filter>
              aria-label="Prikaži strani"
              className="w-full sm:w-52"
              value={filter}
              onValueChange={changeFilter}
              options={[
                { value: 'all', label: `Vse strani (${counts.all})` },
                { value: 'included', label: `Vključene (${counts.included})` },
                { value: 'excluded', label: `Izključene (${counts.excluded})` },
                { value: 'error', label: `Z napako (${counts.error})` },
              ]}
            />
          </div>
          <div className="flex min-h-9 flex-wrap items-center gap-x-4 gap-y-2">
            <p className="nums text-sm text-fg-muted" aria-live="polite">
              {chosen.length > 0 ? `Izbrano: ${chosen.length} od ${visible.length}` : 'Označite strani v tabeli, da jih spremenite naenkrat.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={!canInclude || rowsLocked} onClick={() => void setMany(true)}>
                Vključi izbrane
              </Button>
              <Button size="sm" disabled={!canExclude || rowsLocked} onClick={() => void setMany(false)}>
                Izključi izbrane
              </Button>
              {chosen.length > 0 ? (
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Počisti izbiro
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {body}
    </Card>
  );
}

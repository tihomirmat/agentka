import { RefreshCw } from 'lucide-react';
import { Button, ButtonLink, Card, CardBody, CardFooter, CardHeader, StatusPill, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { formatNumber, formatRelativeDateTime, plural } from '@/data/format';
import { Notice, Pending } from './parts';

/** "Viri znanja": what the agent answers from, when it was last read, what went wrong. */
export function KnowledgeCard() {
  const toast = useToast();
  const sources = api.useQuery(() => api.listSources(), []);
  const agent = api.useQuery(() => api.getAgent(), []);
  const sync = api.useAction(api.syncWebsite, { onError: toast.error });

  async function runSync() {
    const result = await sync.run();
    if (result) (result.simulated ? toast.info : toast.success)(result.message);
  }

  const rows = sources.data;
  const included = rows?.filter((s) => s.included) ?? [];
  const failed = rows?.filter((s) => s.status === 'error') ?? [];
  const reading = rows?.some((s) => s.status === 'pending') ?? false;
  const count = (type: api.KnowledgeSourceType) => included.filter((s) => s.type === type).length;

  let pill = null;
  if (rows) {
    pill =
      failed.length > 0 ? (
        <StatusPill tone="danger">{plural(failed.length, ['napaka', 'napaki', 'napake', 'napak'])}</StatusPill>
      ) : reading ? (
        <StatusPill tone="info" live>
          V obdelavi
        </StatusPill>
      ) : included.length === 0 ? (
        <StatusPill tone="warning">Ni virov</StatusPill>
      ) : (
        <StatusPill tone="success">Sinhronizirano</StatusPill>
      );
  }

  return (
    <Card>
      <CardHeader
        title="Viri znanja"
        description="Agent odgovarja samo iz teh virov."
        action={pill}
      />
      {rows && agent.data ? (
        <>
          <CardBody className="flex flex-col gap-4">
            <dl className="grid grid-cols-3 gap-3">
              {(
                [
                  ['Spletne strani', 'Strani', 'website_page'],
                  ['Datoteke', 'Datoteke', 'file'],
                  ['Besedila', 'Besedila', 'text'],
                ] as const
              ).map(([label, shortLabel, type]) => (
                <div key={type} className="min-w-0 rounded-lg bg-surface-2 px-3 py-2.5">
                  <dt className="truncate text-sm text-fg-muted">
                    {/* the full word does not fit a third of a phone screen */}
                    <span className="sm:hidden" aria-hidden="true">
                      {shortLabel}
                    </span>
                    <span className="sr-only sm:not-sr-only">{label}</span>
                  </dt>
                  <dd className="nums m-0 font-display text-xl font-semibold text-fg">{formatNumber(count(type))}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-fg-muted">
              Zadnja sinhronizacija:{' '}
              <span className="font-medium text-fg">
                {agent.data.last_sync_at ? formatRelativeDateTime(agent.data.last_sync_at) : 'še ni bila opravljena'}
              </span>
            </p>
            {included.length === 0 ? (
              <Notice tone="warning" title="Agent zdaj ne ve ničesar o vašem podjetju.">
                Uvozite spletno stran ali dodajte besedilo, da bo imel iz česa odgovarjati.
              </Notice>
            ) : null}
            {failed.length > 0 ? (
              <Notice
                tone="danger"
                title={
                  failed.length === 1
                    ? 'En vir ni bil prebran.'
                    : `${plural(failed.length, ['vir', 'vira', 'viri', 'virov'])} ni bilo prebranih.`
                }
              >
                <ul className="flex flex-col gap-0.5">
                  {failed.map((s) => (
                    <li key={s.id}>
                      <span className="font-medium text-fg">{s.title}</span>
                      {s.error ? `: ${s.error}` : null}
                    </li>
                  ))}
                </ul>
              </Notice>
            ) : null}
          </CardBody>
          <CardFooter>
            <ButtonLink to="/app/viri" size="sm">
              Uredi vire
            </ButtonLink>
            <Button size="sm" icon={RefreshCw} loading={sync.pending} onClick={runSync}>
              Sinhroniziraj
            </Button>
          </CardFooter>
        </>
      ) : (
        <Pending queries={[sources, agent]} />
      )}
    </Card>
  );
}

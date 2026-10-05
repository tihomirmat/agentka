import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, ButtonLink, Card, CardBody, CardFooter, CardHeader, Notice, Stat, StatusPill, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { formatNumber, formatRelativeDateTime, plural } from '@/data/format';
import { SOURCE_STATUS, SYNC_WORDS } from '@/data/labels';
import { Pending } from './parts';

/**
 * "Viri znanja": what the agent answers from, when it was last read, what went wrong.
 * A missing source is NOT repeated here: "Kaj še manjka" says it once.
 */
export function KnowledgeCard() {
  const toast = useToast();
  const sources = api.useQuery(() => api.listSources(), []);
  const agent = api.useQuery(() => api.getAgent(), []);
  // The re-read is a simulated outside action: its result stays next to the button, no toast.
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const sync = api.useAction(api.syncWebsite, { onError: toast.error });

  async function runSync() {
    setSyncNote(null);
    const result = await sync.run();
    if (result) setSyncNote(result.message);
  }

  const rows = sources.data;
  const included = rows?.filter((s) => s.included) ?? [];
  const failed = rows?.filter((s) => s.status === 'error') ?? [];
  const reading = rows?.some((s) => s.status === 'pending') ?? false;
  const count = (type: api.KnowledgeSourceType) => included.filter((s) => s.type === type).length;
  const readablePages = count('website_page');

  let pill = null;
  if (rows) {
    pill =
      failed.length > 0 ? (
        <StatusPill tone="danger">{plural(failed.length, ['napaka', 'napaki', 'napake', 'napak'])}</StatusPill>
      ) : reading ? (
        <StatusPill tone={SOURCE_STATUS.pending.tone} live>
          {SOURCE_STATUS.pending.label}
        </StatusPill>
      ) : included.length === 0 ? (
        <StatusPill tone="warning">Ni virov</StatusPill>
      ) : (
        <StatusPill tone={SOURCE_STATUS.synced.tone}>{SOURCE_STATUS.synced.label}</StatusPill>
      );
  }

  return (
    <Card>
      <CardHeader title="Viri znanja" description="Agent odgovarja samo iz teh virov." action={pill} />
      {rows && agent.data ? (
        <>
          <CardBody className="flex flex-col gap-4">
            <div className="flex min-w-0 flex-wrap gap-x-8 gap-y-4">
              <Stat variant="inline" label="Spletne strani" value={formatNumber(readablePages)} />
              <Stat variant="inline" label="Datoteke" value={formatNumber(count('file'))} />
              <Stat variant="inline" label="Besedila" value={formatNumber(count('text'))} />
            </div>
            <p className="text-sm text-fg-muted">
              {SYNC_WORDS.lastLabel}:{' '}
              <span className="font-medium text-fg">
                {agent.data.last_sync_at ? formatRelativeDateTime(agent.data.last_sync_at) : SYNC_WORDS.never}
              </span>
            </p>
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
                    <li key={s.id} className="break-words">
                      <span className="font-medium text-fg">{s.title}</span>
                      {s.error ? `: ${s.error}` : null}
                    </li>
                  ))}
                </ul>
              </Notice>
            ) : null}
            {syncNote ? (
              <Notice size="sm" tone="neutral">
                {syncNote}
              </Notice>
            ) : null}
          </CardBody>
          <CardFooter>
            <ButtonLink to="/app/viri" size="sm">
              Uredi vire
            </ButtonLink>
            <Button
              size="sm"
              icon={RefreshCw}
              loading={sync.pending}
              disabledReason={readablePages === 0 && 'Najprej uvozite spletno stran ali vključite vsaj eno stran.'}
              onClick={runSync}
            >
              Preberi strani znova
            </Button>
          </CardFooter>
        </>
      ) : (
        <Pending queries={[sources, agent]} />
      )}
    </Card>
  );
}

import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import * as api from '@/data/api';
import { formatRelativeDateTime, plural } from '@/data/format';
import { SYNC_WORDS } from '@/data/labels';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  StatusPill,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { FilesTab } from './knowledge/FilesTab';
import { TextTab } from './knowledge/TextTab';
import { WebsiteTab } from './knowledge/WebsiteTab';

const NO_SOURCES: api.KnowledgeSource[] = [];

const DESCRIPTION = 'Agent odgovarja samo iz tega, kar je navedeno tukaj. Česar ni na seznamu, agent ne ve.';

/** Viri znanja: everything the agent may answer from. */
export default function Knowledge() {
  const sources = api.useQuery(() => api.listSources(), []);
  const agent = api.useQuery(() => api.getAgent(), []);
  const account = api.useQuery(() => api.getAccount(), []);
  const [tab, setTab] = useState('stran');

  const all = sources.data ?? NO_SOURCES;
  const pages = all.filter((s) => s.type === 'website_page');
  const files = all.filter((s) => s.type === 'file');
  const texts = all.filter((s) => s.type === 'text');

  // The number on a tab and the number in the summary are the same one: what the agent uses.
  const includedPages = pages.filter((s) => s.included).length;
  const includedFiles = files.filter((s) => s.included).length;
  const includedTexts = texts.filter((s) => s.included).length;
  const withError = all.filter((s) => s.status === 'error').length;
  const lastRead = agent.data?.last_sync_at ?? null;

  if (sources.error && sources.data === undefined && !sources.loading) {
    return (
      <>
        <PageHeader title="Viri znanja" description={DESCRIPTION} />
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={sources.error}
            action={<Button onClick={sources.reload}>Poskusi znova</Button>}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Viri znanja" description={DESCRIPTION} />

      <Card tone="quiet" className="mb-6">
        <div className="px-4 py-3 sm:px-5">
          {sources.loading ? (
            <Skeleton className="h-5 w-3/4 max-w-xl" />
          ) : (
            <p className="flex flex-col items-start gap-y-1 text-base text-fg-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1.5">
              <span className="nums font-medium text-fg">
                Vključeno: {includedPages} od {pages.length} strani
              </span>
              <Dot className="hidden sm:inline" />
              {/* On a phone the three parts stand on their own lines, so no separator dangles at a line end. */}
              <span className="inline-flex items-center gap-x-2">
                <span className="nums font-medium text-fg">
                  {plural(includedFiles, ['datoteka', 'datoteki', 'datoteke', 'datotek'])}
                </span>
                <Dot />
                <span className="nums font-medium text-fg">
                  {plural(includedTexts, ['besedilo', 'besedili', 'besedila', 'besedil'])}
                </span>
              </span>
              <Dot className="hidden sm:inline" />
              <span>
                {SYNC_WORDS.lastLabel}:{' '}
                <span className="font-medium text-fg">
                  {lastRead ? formatRelativeDateTime(lastRead) : SYNC_WORDS.never}
                </span>
              </span>
              {withError > 0 ? (
                <StatusPill tone="danger" className="ml-1">
                  {plural(withError, ['vir z napako', 'vira z napako', 'viri z napako', 'virov z napako'])}
                </StatusPill>
              ) : null}
            </p>
          )}
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Vrste virov znanja">
          <TabsTrigger value="stran" count={sources.loading ? undefined : includedPages}>
            Spletne strani
          </TabsTrigger>
          <TabsTrigger value="datoteke" count={sources.loading ? undefined : includedFiles}>
            Datoteke
          </TabsTrigger>
          <TabsTrigger value="besedilo" count={sources.loading ? undefined : includedTexts}>
            Besedila
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stran">
          <WebsiteTab
            pages={pages}
            loading={sources.loading}
            error={sources.error}
            reload={sources.reload}
            agent={agent.data}
            account={account.data}
          />
        </TabsContent>
        <TabsContent value="datoteke">
          <FilesTab files={files} loading={sources.loading} error={sources.error} reload={sources.reload} />
        </TabsContent>
        <TabsContent value="besedilo">
          <TextTab texts={texts} loading={sources.loading} error={sources.error} reload={sources.reload} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Dot({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('text-fg-subtle', className)}>
      ·
    </span>
  );
}

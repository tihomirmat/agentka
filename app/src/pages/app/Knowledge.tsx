import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import * as api from '@/data/api';
import { formatRelativeDateTime, plural } from '@/data/format';
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
import { FilesTab } from './knowledge/FilesTab';
import { TextTab } from './knowledge/TextTab';
import { WebsiteTab } from './knowledge/WebsiteTab';

const NO_SOURCES: api.KnowledgeSource[] = [];

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

  const includedPages = pages.filter((s) => s.included).length;
  const withError = all.filter((s) => s.status === 'error').length;
  const lastSync = agent.data?.last_sync_at ?? null;

  if (sources.error && sources.data === undefined && !sources.loading) {
    return (
      <>
        <PageHeader
          title="Viri znanja"
          description="Agent odgovarja samo iz tega, kar je navedeno tukaj. Česar ni na seznamu, agent ne ve."
        />
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
      <PageHeader
        title="Viri znanja"
        description="Agent odgovarja samo iz tega, kar je navedeno tukaj. Česar ni na seznamu, agent ne ve."
      />

      <Card tone="quiet" className="mb-6">
        <div className="px-4 py-3 sm:px-5">
          {sources.loading ? (
            <Skeleton className="h-5 w-3/4 max-w-xl" />
          ) : (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-base text-fg-muted">
              <span className="nums font-medium text-fg">
                {plural(includedPages, ['vključena stran', 'vključeni strani', 'vključene strani', 'vključenih strani'])}
              </span>
              <Dot />
              <span className="nums font-medium text-fg">
                {plural(files.length, ['datoteka', 'datoteki', 'datoteke', 'datotek'])}
              </span>
              <Dot />
              <span className="nums font-medium text-fg">
                {plural(texts.length, ['besedilo', 'besedili', 'besedila', 'besedil'])}
              </span>
              <Dot />
              <span>
                Zadnja sinhronizacija:{' '}
                <span className="font-medium text-fg">
                  {lastSync ? formatRelativeDateTime(lastSync) : 'še ni bila izvedena'}
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
          <TabsTrigger value="stran" count={sources.loading ? undefined : pages.length}>
            Spletna stran
          </TabsTrigger>
          <TabsTrigger value="datoteke" count={sources.loading ? undefined : files.length}>
            Datoteke
          </TabsTrigger>
          <TabsTrigger value="besedilo" count={sources.loading ? undefined : texts.length}>
            Besedilo
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

function Dot() {
  return (
    <span aria-hidden="true" className="text-fg-subtle">
      ·
    </span>
  );
}

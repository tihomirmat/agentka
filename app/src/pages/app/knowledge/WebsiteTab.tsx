import { useRef, useState } from 'react';
import { ChevronRight, Download, RefreshCw } from 'lucide-react';
import * as api from '@/data/api';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  Field,
  Input,
  ProgressBar,
  Select,
  useToast,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { ResultNote } from '../screen-kit/ResultNote';
import { everyDays, SYNC_CHOICES } from './helpers';
import { PagesCard } from './PagesCard';

interface WebsiteTabProps {
  pages: api.KnowledgeSource[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  agent: api.Agent | undefined;
  account: api.Account | undefined;
}

function withoutProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, '');
}

/** "Spletna stran" tab: address and import, automatic sync, and the table of pages. */
export function WebsiteTab({ pages, loading, error, reload, agent, account }: WebsiteTabProps) {
  const toast = useToast();
  const urlRef = useRef<HTMLInputElement>(null);

  const [urlDraft, setUrlDraft] = useState<string | null>(null);
  const [sitemap, setSitemap] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<api.ActionResult | null>(null);
  const [autoDays, setAutoDays] = useState<number | null>(null);

  const importPages = api.useAction(api.importWebsite, {
    onError: (m) => {
      setUrlError(m);
      toast.error(m);
    },
  });
  const syncPages = api.useAction(api.syncWebsite, {
    onError: (m) => {
      setActionError(m);
      toast.error(m);
    },
  });
  const saveAgent = api.useAction(api.updateAgent, { onError: toast.error });

  const url = urlDraft ?? withoutProtocol(account?.website_url ?? '');
  const busy = importPages.pending || syncPages.pending;
  const hasPages = pages.length > 0;

  const included = pages.filter((p) => p.included);
  const pending = included.filter((p) => p.status === 'pending').length;
  const done = included.length - pending;

  async function runImport() {
    setResult(null);
    setActionError(null);
    if (!url.trim()) {
      setUrlError('Vpišite naslov spletne strani, na primer vasepodjetje.si');
      urlRef.current?.focus();
      return;
    }
    setUrlError(null);
    const r = await importPages.run(url);
    if (r) {
      setResult(r);
      setUrlDraft(null);
      if (r.simulated) toast.info(r.message);
      else toast.success(r.message);
    }
  }

  async function runSync() {
    setResult(null);
    setActionError(null);
    const r = await syncPages.run();
    if (r) {
      setResult(r);
      if (r.simulated) toast.info(r.message);
      else toast.success(r.message);
    }
  }

  async function changeAutoDays(days: number) {
    setAutoDays(days);
    const saved = await saveAgent.run({ auto_sync_days: days });
    setAutoDays(null);
    if (saved) toast.success(`Strani se samodejno znova preberejo ${everyDays(days)}.`);
  }

  const currentDays = autoDays ?? agent?.auto_sync_days ?? 7;
  const dayOptions = Array.from(new Set([...SYNC_CHOICES, currentDays]))
    .sort((a, b) => a - b)
    .map((n) => {
      const label = everyDays(n);
      return { value: String(n), label: label.charAt(0).toUpperCase() + label.slice(1) };
    });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="Naslov spletne strani"
          description="Agent prebere besedilo strani z vašega naslova in iz njega odgovarja obiskovalcem."
        />
        <CardBody className="flex flex-col gap-4">
          <Field label="Naslov spletne strani" error={urlError ?? undefined} className="max-w-xl">
            <Input
              ref={urlRef}
              prefix="https://"
              placeholder="vasepodjetje.si"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              value={url}
              disabled={account === undefined}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                setUrlError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !busy) {
                  e.preventDefault();
                  if (hasPages) setConfirmImport(true);
                  else void runImport();
                }
              }}
            />
          </Field>

          <div>
            <button
              type="button"
              aria-expanded={advancedOpen}
              aria-controls="viri-napredno"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded text-sm font-medium text-fg-muted transition-colors hover:text-fg"
            >
              <ChevronRight
                size={16}
                aria-hidden="true"
                className={cn('transition-transform duration-100', advancedOpen && 'rotate-90')}
              />
              Napredno
            </button>
            {advancedOpen ? (
              <div id="viri-napredno" className="mt-3 max-w-xl">
                <Field
                  label="Naslov zemljevida strani (sitemap)"
                  optional
                  hint="Uporabite ga, če agent ne najde vseh vaših strani. Primer: https://vasepodjetje.si/sitemap.xml"
                >
                  <Input
                    mono
                    inputMode="url"
                    spellCheck={false}
                    placeholder="https://vasepodjetje.si/sitemap.xml"
                    value={sitemap}
                    onChange={(e) => setSitemap(e.target.value)}
                  />
                </Field>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={hasPages ? 'secondary' : 'primary'}
              icon={Download}
              loading={importPages.pending}
              disabled={syncPages.pending}
              onClick={() => (hasPages ? setConfirmImport(true) : void runImport())}
            >
              Uvozi stran
            </Button>
            <Button
              variant={hasPages ? 'primary' : 'secondary'}
              icon={RefreshCw}
              loading={syncPages.pending}
              disabled={importPages.pending}
              onClick={() => void runSync()}
            >
              Sinhroniziraj zdaj
            </Button>
          </div>

          {busy ? (
            <div role="status" aria-live="polite" className="rounded-lg bg-surface-2 px-4 py-3">
              <p className="text-sm font-medium text-fg">
                {importPages.pending ? 'Uvoz poteka' : 'Sinhronizacija poteka'}
                {pending > 0 ? `: obdelanih ${done} od ${included.length}` : ''}
              </p>
              {pending > 0 ? (
                <ProgressBar
                  className="mt-2"
                  size="sm"
                  tone="accent"
                  label="Obdelane strani"
                  value={done}
                  max={Math.max(included.length, 1)}
                />
              ) : (
                <p className="mt-0.5 text-sm text-fg-muted">Strani se pripravljajo.</p>
              )}
            </div>
          ) : null}
          {!busy ? <ResultNote message={result?.message} /> : null}
          {!busy ? <ResultNote tone="danger" message={actionError} /> : null}

          <div className="border-t border-border pt-4">
            <Field
              label="Samodejna sinhronizacija"
              hint={`Strani se samodejno znova preberejo ${everyDays(currentDays)}.`}
              className="max-w-xs"
            >
              <Select
                value={String(currentDays)}
                options={dayOptions}
                disabled={agent === undefined || saveAgent.pending}
                onValueChange={(v) => void changeAutoDays(Number(v))}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <PagesCard
        pages={pages}
        loading={loading}
        error={error}
        reload={reload}
        busy={busy}
        onFocusUrl={() => urlRef.current?.focus()}
      />

      <ConfirmDialog
        open={confirmImport}
        onOpenChange={setConfirmImport}
        title="Uvozim stran znova?"
        description="Seznam strani se zamenja z novim, vaše izbire vključenih in izključenih strani pa se ponastavijo. Datoteke in besedila ostanejo."
        confirmLabel="Uvozi stran znova"
        onConfirm={runImport}
      />
    </div>
  );
}

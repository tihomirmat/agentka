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
  Notice,
  ProgressBar,
  Select,
  useToast,
} from '@/components/ui';
import { cn } from '@/lib/cn';
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

/** "Spletne strani" tab: address, the two ways to fill the list, automatic re-reading, and the pages. */
export function WebsiteTab({ pages, loading, error, reload, agent, account }: WebsiteTabProps) {
  const toast = useToast();
  const urlRef = useRef<HTMLInputElement>(null);

  const [urlDraft, setUrlDraft] = useState<string | null>(null);
  const [sitemap, setSitemap] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  // The api's own sentence for the last import or re-read: ONE inline notice, never a toast as well.
  const [result, setResult] = useState<api.ActionResult | null>(null);
  const [autoDays, setAutoDays] = useState<number | null>(null);

  // An import that is refused is about the address: the message belongs to the field.
  const importPages = api.useAction(api.importWebsite, { onError: (m) => setUrlError(m) });
  const readAgain = api.useAction(api.syncWebsite, { onError: toast.error });
  const saveAgent = api.useAction(api.updateAgent, { onError: toast.error });

  const url = urlDraft ?? withoutProtocol(account?.website_url ?? '');
  const busy = importPages.pending || readAgain.pending;
  const hasPages = pages.length > 0;

  const included = pages.filter((p) => p.included);
  const pending = included.filter((p) => p.status === 'pending').length;
  const done = included.length - pending;

  async function runImport() {
    setResult(null);
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
    }
  }

  async function runReadAgain() {
    setResult(null);
    const r = await readAgain.run();
    if (r) setResult(r);
  }

  async function changeAutoDays(days: number) {
    setAutoDays(days);
    const saved = await saveAgent.run({ auto_sync_days: days });
    setAutoDays(null);
    if (saved) toast.success(`Strani se bodo samodejno znova prebrale ${everyDays(days)}.`);
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
          title="Vaša spletna stran"
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

          {/* Two actions that look alike but do different things: each says what it does under its button. */}
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <Button
                variant={hasPages ? 'secondary' : 'primary'}
                icon={Download}
                loading={importPages.pending}
                disabled={readAgain.pending}
                onClick={() => (hasPages ? setConfirmImport(true) : void runImport())}
              >
                Uvozi stran
              </Button>
              <p className="text-sm text-fg-subtle">
                Poišče nove strani na vašem naslovu in sestavi nov seznam. Vaše izbire vključenih in izključenih strani
                se ponastavijo.
              </p>
            </div>
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <Button
                variant={hasPages ? 'primary' : 'secondary'}
                icon={RefreshCw}
                loading={readAgain.pending}
                disabled={importPages.pending}
                onClick={() => void runReadAgain()}
              >
                Preberi strani znova
              </Button>
              <p className="text-sm text-fg-subtle">
                Znova prebere strani s seznama, ki so vključene, da agent pozna zadnje spremembe. Vaše izbire ostanejo.
              </p>
            </div>
          </div>

          {busy ? (
            <Notice
              size="sm"
              tone="neutral"
              title={`${importPages.pending ? 'Uvoz poteka' : 'Branje strani poteka'}${
                pending > 0 ? `: obdelanih ${done} od ${included.length}` : ''
              }`}
            >
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
                'Strani se pripravljajo.'
              )}
            </Notice>
          ) : result ? (
            <Notice size="sm" tone={result.simulated ? 'neutral' : 'success'}>
              {result.message}
            </Notice>
          ) : null}

          <div className="border-t border-border pt-4">
            <Field
              label="Samodejno ponovno branje"
              hint={`Strani se bodo samodejno znova prebrale ${everyDays(currentDays)}.`}
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

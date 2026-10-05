import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { WizardStep } from '@/components/layout';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Notice,
  SkeletonRows,
  StatusPill,
  Switch,
  useToast,
} from '@/components/ui';
import * as api from '@/data/api';
import { formatNumber, formatUrl } from '@/data/format';
import { SOURCE_STATUS } from '@/data/labels';
import { cn } from '@/lib/cn';
import { hostOf, messageOf, urlProblem, type StepNav, type WebsiteDraft } from '../draft';

interface Props extends StepNav {
  draft: WebsiteDraft;
  onChange: (patch: Partial<WebsiteDraft>) => void;
  account: api.Account;
}

export function WebsiteStep({ draft, onChange, account, onSkip, onDone }: Props) {
  const toast = useToast();
  const sources = api.useQuery(() => api.listSources(), []);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);
  const [busyNext, setBusyNext] = useState(false);
  // What the switches should show right away, until the stored value has caught up.
  const [shown, setShown] = useState<Record<string, boolean>>({});

  const importSite = api.useAction(api.importWebsite, { onError: setFieldError });
  const toggle = api.useAction(api.toggleSource, { onError: toast.error });

  const all = sources.data;
  const pages = (all ?? []).filter((s) => s.type === 'website_page');
  const includedPages = pages.filter((p) => (shown[p.id] ?? p.included)).length;
  // Pages the import left out on its own, with the reason in `note` (gone once the person decides).
  const leftOut = pages.some((p) => p.note && !(shown[p.id] ?? p.included));
  const knowsNothing = all !== undefined && !all.some((s) => s.included);
  const importing = importSite.pending;
  const hasAddress = draft.url.trim() !== '';
  // The address on screen is not the one the pages were read from.
  const typedNotImported = hasAddress && hostOf(draft.url) !== hostOf(account.website_url);
  // Until the pages of THIS address are in, "Uvozi stran" is the step's main action.
  const needsImport = hasAddress && all !== undefined && (pages.length === 0 || typedNotImported);

  // Forget a local switch value as soon as the stored one matches it.
  useEffect(() => {
    setShown((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [id, value] of Object.entries(prev)) {
        const row = sources.data?.find((s) => s.id === id);
        if (!row || row.included === value) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sources.data]);

  async function runImport() {
    const problem = urlProblem(draft.url);
    if (!draft.url.trim() || problem) {
      setFieldError(problem ?? 'Vpišite naslov spletne strani, na primer vasepodjetje.si');
      return;
    }
    setFieldError(null);
    setImportNote(null);
    const result = await importSite.run(draft.url.trim());
    if (!result) return;
    setImportNote(result.message);
    // The api keeps one spelling of the address (no "www.", no path); show it in the field too.
    try {
      onChange({ url: hostOf((await api.getAccount()).website_url) });
    } catch {
      // the field keeps what was typed; the pages and the message already use the saved address
    }
  }

  async function setIncluded(id: string, included: boolean) {
    setShown((s) => ({ ...s, [id]: included }));
    const result = await toggle.run(id, included);
    if (!result) setShown((s) => omit(s, id));
  }

  async function next() {
    const problem = urlProblem(draft.url);
    if (problem) {
      setFieldError(problem);
      return;
    }
    setBusyNext(true);
    try {
      if (typedNotImported) {
        await api.updateAccount({ website_url: `https://${hostOf(draft.url)}` });
      }
      await onDone();
    } catch (e) {
      setFieldError(messageOf(e));
    } finally {
      setBusyNext(false);
    }
  }

  return (
    <WizardStep
      title="Vaša spletna stran"
      description="Agent odgovarja samo iz besedila vaših strani, zato jih najprej uvozite."
      skip={
        <Button variant="ghost" onClick={onSkip}>
          Preskoči
        </Button>
      }
      next={
        <Button variant={needsImport ? 'secondary' : 'primary'} loading={busyNext} disabled={importing} onClick={next}>
          Naprej
        </Button>
      }
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start">
            <Field
              className="sm:flex-1"
              label="Naslov spletne strani"
              hint="Vpišite glavni naslov, na primer vasepodjetje.si. Poti do podstrani ne potrebujete."
              error={fieldError}
            >
              <Input
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                prefix="https://"
                placeholder="vasepodjetje.si"
                value={draft.url}
                disabled={importing}
                onChange={(e) => {
                  setFieldError(null);
                  onChange({ url: e.target.value.replace(/^\s*[a-z]+:\/\//i, '') });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void runImport();
                  }
                }}
              />
            </Field>
            {/* Same height as the field's label row, so the button lines up with the input on wide screens. */}
            <div className="sm:pt-[1.625rem]">
              <Button
                variant={needsImport ? 'primary' : 'secondary'}
                loading={importing}
                onClick={runImport}
                className="w-full sm:w-auto"
              >
                Uvozi stran
              </Button>
            </div>
          </div>
          {/* The result of the (simulated) import stays next to the button that caused it. */}
          {importNote && !importing ? <Notice size="sm" tone="neutral">{importNote}</Notice> : null}
        </div>

        <section aria-labelledby="wizard-pages-title" className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="wizard-pages-title" className="text-md font-semibold text-fg">
              Najdene strani
            </h2>
            {pages.length > 0 ? (
              <p className="nums text-sm font-medium text-fg-muted" aria-live="polite">
                Vključeno: {formatNumber(includedPages)} od {formatNumber(pages.length)} strani
              </p>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            {leftOut
              ? 'Nekatere strani smo že izključili; razlog piše pod njihovim naslovom. Izklopite še strani, ki jih agent ne sme uporabljati, na primer testne strani.'
              : 'Izklopite strani, ki jih agent ne sme uporabljati, na primer testne strani ali pravne strani, kot sta politika zasebnosti in piškotki.'}
          </p>

          <Card className="mt-3">
            {sources.data === undefined && !sources.error ? (
              <SkeletonRows rows={4} />
            ) : pages.length === 0 ? (
              importing ? (
                <SkeletonRows rows={4} />
              ) : (
                <EmptyState
                  compact
                  icon={Globe}
                  title="Ko uvozite spletno stran, se tukaj prikažejo njene strani."
                />
              )
            ) : (
              <ul
                aria-label="Najdene strani"
                tabIndex={0}
                className="relative max-h-[26rem] min-w-0 overflow-y-auto rounded-lg"
              >
                {pages.map((p) => {
                  const included = shown[p.id] ?? p.included;
                  const status = SOURCE_STATUS[p.status];
                  const showPill = p.status === 'pending' || p.status === 'error';
                  return (
                    <li
                      key={p.id}
                      className="flex min-w-0 items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:px-5"
                    >
                      <Switch
                        checked={included}
                        disabled={importing}
                        onCheckedChange={(value) => void setIncluded(p.id, value)}
                        aria-label={`Vključi stran »${p.title}«`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-base font-medium', included ? 'text-fg' : 'text-fg-subtle')}>
                          {p.title}
                        </p>
                        <p className="truncate font-mono text-xs text-fg-subtle">{formatUrl(p.url ?? '')}</p>
                        {/* Why the import suggests leaving this page out; gone as soon as the person decides. */}
                        {p.note ? <p className="mt-0.5 text-sm text-fg-muted">{p.note}</p> : null}
                        {p.status === 'error' && p.error ? (
                          <p className="mt-0.5 text-sm text-danger">{p.error}</p>
                        ) : null}
                      </div>
                      {showPill ? (
                        <StatusPill tone={status.tone} live={p.status === 'pending'}>
                          {status.label}
                        </StatusPill>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>

        {importing && pages.length > 0 ? (
          <Notice tone="info" title="Branje strani poteka.">
            Najdenih je {formatNumber(pages.length)} strani. Počakajte, da se stanje vseh strani spremeni v »
            {SOURCE_STATUS.synced.label}«.
          </Notice>
        ) : null}

        {sources.error && sources.data === undefined ? (
          <Notice
            tone="danger"
            title={sources.error}
            action={
              <Button size="sm" onClick={sources.reload}>
                Poskusi znova
              </Button>
            }
          />
        ) : null}

        {knowsNothing && !importing ? (
          <Notice tone="warning" title="Agent zdaj ne ve ničesar o vašem podjetju.">
            {hasAddress && pages.length === 0
              ? 'Naslov ste vpisali, strani pa še niste uvozili. Pritisnite »Uvozi stran«. Če greste naprej brez uvoza, agent ne bo znal odgovarjati, dokler ne uvozite vsaj ene strani.'
              : 'Naprej lahko greste tudi brez strani, vendar agent ne bo znal odgovarjati, dokler ne uvozite vsaj ene strani. Uvoz lahko opravite tudi pozneje v razdelku Viri znanja.'}
          </Notice>
        ) : null}
      </div>
    </WizardStep>
  );
}

function omit(record: Record<string, boolean>, key: string): Record<string, boolean> {
  const next = { ...record };
  delete next[key];
  return next;
}

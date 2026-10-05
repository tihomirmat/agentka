import { useRef, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CodeBlock,
  copyFallbackSentence,
  CopyButton,
  EmptyState,
  Notice,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { builderMessage } from './helpers';

interface CodeCardProps {
  /** the embed code; undefined while it loads */
  code: string | undefined;
  error: string | null;
  onRetry: () => void;
  /** called only when the clipboard really took the code (alone or inside the message) */
  onCopied: () => void;
  /** called when the clipboard refused the code and it was only marked for copying by hand */
  onCodeSelected: () => void;
  business: string;
  agentName: string;
  /** the saved allowed domain, may be empty */
  domain: string;
}

/** Step "Kopirajte kodo": the embed code and, in tabs, where to put it. */
export function CodeCard({ code, error, onRetry, onCopied, onCodeSelected, business, agentName, domain }: CodeCardProps) {
  return (
    <Card>
      <CardHeader
        title="Vgradite pripomoček"
        description="Ena vrstica kode. Vstavite jo v nogo spletne strani, na vseh straneh, kjer naj se pripomoček prikaže."
      />
      <CardBody className="flex flex-col gap-5">
        {code ? (
          <CodeBlock code={code} label="Koda za vgradnjo" onCopied={onCopied} onFallback={onCodeSelected} />
        ) : error ? (
          <EmptyState
            icon={CircleAlert}
            title={error}
            action={<Button onClick={onRetry}>Poskusi znova</Button>}
          />
        ) : (
          <Skeleton className="h-24 w-full rounded-lg" />
        )}

        <Tabs defaultValue="wordpress">
          <TabsList aria-label="Kje vstaviti kodo" className="min-w-0 flex-wrap gap-x-5">
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            <TabsTrigger value="drugo">Drugi</TabsTrigger>
            <TabsTrigger value="izdelovalec">Izdelovalec strani</TabsTrigger>
          </TabsList>

          <TabsContent value="wordpress">
            <div className="flex flex-col gap-3">
              <ol className="list-decimal space-y-2 pl-5 text-base text-fg marker:text-fg-subtle">
                <li>V WordPressu namestite vtičnik za dodajanje kode v glavo in nogo strani.</li>
                <li>Odprite nastavitve vtičnika in poiščite polje za kodo v nogi strani.</li>
                <li>Prilepite kodo, ki ste jo kopirali zgoraj, in shranite.</li>
                <li>Osvežite svojo spletno stran. Pripomoček se mora pokazati na strani.</li>
              </ol>
              <p className="text-sm text-fg-subtle">
                Pripomoček bo deloval samo na domeni, ki jo vpišete spodaj. Preverite, ali se ujema z naslovom vaše
                strani.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="drugo">
            <div className="flex flex-col gap-3">
              <p className="text-base text-fg-muted">Postopek je v večini drugih urejevalnikov spletnih strani enak:</p>
              <ol className="list-decimal space-y-2 pl-5 text-base text-fg marker:text-fg-subtle">
                <li>V nastavitvah strani poiščite razdelek za vstavljanje lastne kode, običajno v glavi ali nogi strani.</li>
                <li>
                  Kodo prilepite v nogo strani, tik pred zaključno oznako{' '}
                  <code className="rounded-sm bg-surface-2 px-1 font-mono text-sm">&lt;/body&gt;</code>, da se naloži na
                  vseh straneh.
                </li>
                <li>Shranite in objavite spletno stran.</li>
              </ol>
              <p className="text-sm text-fg-subtle">
                Nekatere osnovne ali brezplačne različice urejevalnikov lastne kode ne dovoljujejo. Če take možnosti ne
                najdete, uporabite zavihek »Izdelovalec strani«.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="izdelovalec">
            <div className="flex flex-col gap-3">
              <p className="text-base text-fg-muted">
                Kopirajte spodnje sporočilo in ga pošljite osebi ali podjetju, ki skrbi za vašo spletno stran. Koda je že
                v njem.
              </p>
              {code ? (
                <BuilderMessage text={builderMessage({ code, business, agentName, domain })} onCopied={onCopied} />
              ) : (
                <Skeleton className="h-40 w-full rounded-lg" />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardBody>
    </Card>
  );
}

/** The message in a box of its own: it is prose, so it reads in the normal font, not as code. */
function BuilderMessage({ text, onCopied }: { text: string; onCopied: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // said when the browser refused the clipboard and the message was only marked
  const [markedNote, setMarkedNote] = useState<string | null>(null);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface-2">
        <div className="flex items-center justify-between gap-3 border-b border-border py-2 pl-4 pr-2">
          <span className="eyebrow truncate">Sporočilo za izdelovalca</span>
          <CopyButton
            text={text}
            targetRef={ref}
            label="Kopiraj sporočilo"
            onCopied={() => {
              setMarkedNote(null);
              onCopied();
            }}
            onFallback={() => setMarkedNote(copyFallbackSentence({ object: 'Sporočilo', pronoun: 'ga' }))}
          />
        </div>
        <div ref={ref} className="whitespace-pre-wrap break-words px-4 py-3 text-base text-fg">
          {text}
        </div>
      </div>
      {markedNote ? (
        <Notice size="sm" tone="neutral">
          {markedNote}
        </Notice>
      ) : null}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CircleAlert, FileSpreadsheet, SearchX, Users } from 'lucide-react';
import {
  Button,
  ButtonLink,
  Card,
  ClampedText,
  copyFallbackSentence,
  CopyButton,
  CopyValue,
  Dialog,
  EmptyState,
  FilterChips,
  Notice,
  PageHeader,
  SearchField,
  SkeletonRows,
  SkeletonText,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import * as api from '@/data/api';
import { formatNumber, formatRelativeDateTime, plural } from '@/data/format';
import { LEAD_STATUS, LEAD_STATUS_ORDER } from '@/data/labels';
import { LeadStatusSelect } from './inbox/LeadStatusSelect';
import { matchesAllWords } from './inbox/search';
import { useSearchText } from './inbox/useSearchText';

type StatusFilter = 'all' | api.LeadStatus;

/** Room (px) the table needs; narrower than this every contact becomes a card. */
const TABLE_MIN_WIDTH = 940;

const LINK =
  'tap inline-flex items-center gap-1 rounded text-sm font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline';

function readStatus(value: string | null): StatusFilter {
  return value === 'new' || value === 'contacted' || value === 'won' || value === 'lost' ? value : 'all';
}

function writeParams(status: StatusFilter, q: string): URLSearchParams {
  const params = new URLSearchParams();
  if (status !== 'all') params.set('stanje', status);
  if (q.trim()) params.set('q', q);
  return params;
}

function matches(lead: api.Lead, q: string): boolean {
  return matchesAllWords([lead.name, lead.email, lead.phone, lead.what_they_wanted], q);
}

/* --------------------------------------------------------------- csv dialog */

function CsvDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const load = api.useAction(api.exportLeadsCsv);
  const [result, setResult] = useState<{ csv: string; rows: number } | null>(null);
  // said when the browser refused the clipboard and the text was only marked
  const [markedNote, setMarkedNote] = useState<string | null>(null);
  const textRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setMarkedNote(null);
    load.run().then((r) => {
      if (r) setResult(r);
    });
  }, [open, load.run]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Izvoz kontaktov v CSV"
      description="Predogled: datoteke še ni mogoče prenesti. Kopirajte besedilo in ga prilepite v preglednico. V polni različici datoteko prenesete s klikom."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Zapri
          </Button>
          {result ? (
            <CopyButton
              text={result.csv}
              targetRef={textRef}
              label="Kopiraj besedilo"
              variant="primary"
              size="md"
              onCopied={() => setMarkedNote(null)}
              onFallback={() => setMarkedNote(copyFallbackSentence({ object: 'Besedilo', pronoun: 'ga' }))}
              className="h-auto min-h-10 max-w-full whitespace-normal py-1.5 text-left"
            />
          ) : null}
        </>
      }
    >
      {load.error ? (
        <p className="flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
          <span>{load.error}</span>
        </p>
      ) : !result ? (
        <SkeletonText lines={5} />
      ) : (
        <div className="flex flex-col gap-3">
          <pre
            ref={textRef}
            aria-label="Kontakti, CSV"
            className="m-0 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-surface-2 px-4 py-3 font-mono text-sm text-fg"
          >
            {result.csv}
          </pre>
          {markedNote ? (
            <Notice size="sm" tone="neutral">
              {markedNote}
            </Notice>
          ) : null}
          <p className="text-sm text-fg-subtle">
            Izvoz vsebuje {plural(result.rows, ['kontakt', 'kontakta', 'kontakte', 'kontaktov'])}, ne glede na izbrani
            filter.
          </p>
        </div>
      )}
    </Dialog>
  );
}

/* --------------------------------------------------------------------- rows */

function TableRow({ lead }: { lead: api.Lead }) {
  return (
    <TR className="align-top">
      <TD nowrap className="align-top">
        <p className="whitespace-nowrap font-medium text-fg">{lead.name}</p>
        <p className="nums whitespace-nowrap text-sm font-normal text-fg-subtle">
          {formatRelativeDateTime(lead.created_at)}
        </p>
      </TD>
      <TD nowrap className="align-top">
        <div className="flex flex-col gap-0.5">
          <CopyValue value={lead.email} copyLabel="Kopiraj e-naslov" />
          <CopyValue value={lead.phone} copyLabel="Kopiraj telefonsko številko" />
        </div>
      </TD>
      <TD className="w-full min-w-[12rem] align-top">
        <ClampedText text={lead.what_they_wanted} lines={2} />
      </TD>
      <TD label="Stanje" className="align-top">
        <LeadStatusSelect lead={lead} className="w-40" />
      </TD>
      <TD className="align-top">
        <Link to={`/app/pogovori/${lead.conversation_id}`} className={LINK}>
          Pogovor
          <ArrowRight size={14} aria-hidden="true" />
          <span className="sr-only"> ({lead.name})</span>
        </Link>
      </TD>
    </TR>
  );
}

/* --------------------------------------------------------------------- page */

export default function Leads() {
  const leads = api.useQuery(() => api.listLeads(), []);
  const [params, setParams] = useSearchParams();
  const status = readStatus(params.get('stanje'));
  const statusRef = useRef(status);
  statusRef.current = status;
  const [csvOpen, setCsvOpen] = useState(false);

  const setStatus = (next: StatusFilter) => setParams(writeParams(next, text), { replace: true });
  const [text, setText] = useSearchText(params.get('q') ?? '', (q) =>
    setParams(writeParams(statusRef.current, q), { replace: true }),
  );
  const clear = () => setParams(new URLSearchParams(), { replace: true });

  const all = leads.data ?? [];
  const count = (s: StatusFilter) => (s === 'all' ? all.length : all.filter((l) => l.status === s).length);
  const shown = all.filter((l) => (status === 'all' || l.status === status) && matches(l, text));
  const narrowed = status !== 'all' || text.trim() !== '';

  // The chip says the same word as the row (labels.ts), so "Dogovorjeno" is never also "Stranke".
  const chips: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Vsi', count: count('all') },
    ...LEAD_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS[s].label, count: count(s) })),
  ];

  let body;
  if (leads.loading) {
    body = (
      <Card>
        <SkeletonRows rows={6} />
      </Card>
    );
  } else if (leads.error) {
    body = (
      <Card>
        <EmptyState
          icon={CircleAlert}
          title={leads.error}
          action={<Button onClick={leads.reload}>Poskusi znova</Button>}
        />
      </Card>
    );
  } else if (all.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon={Users}
          title="Ko obiskovalec agentu pusti svoje podatke, se kontakt pojavi tukaj."
          description="Če agenta še niste namestili, začnite tam."
          action={
            <ButtonLink variant="primary" to="/app/namestitev">
              Namesti agenta
            </ButtonLink>
          }
        />
      </Card>
    );
  } else {
    body = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <FilterChips label="Stanje kontakta" value={status} onChange={setStatus} options={chips} />
          <SearchField
            label="Iskanje po kontaktih"
            placeholder="Ime, e-naslov, telefon ali želja"
            value={text}
            onChange={setText}
            className="w-full sm:ml-auto sm:w-80"
          />
        </div>

        {narrowed && shown.length > 0 ? (
          <p className="text-sm text-fg-muted" aria-live="polite">
            Prikazano: {formatNumber(shown.length)} od{' '}
            {plural(all.length, ['kontakta', 'kontaktov', 'kontaktov', 'kontaktov'])}.{' '}
            <button
              type="button"
              onClick={clear}
              className="tap rounded font-medium text-accent underline-offset-2 hover:underline"
            >
              Počisti filtre
            </button>
          </p>
        ) : null}

        <Card className="overflow-hidden">
          <Table
            minWidth={TABLE_MIN_WIDTH}
            stackBelow={TABLE_MIN_WIDTH}
            caption="Kontakti, najnovejši na vrhu"
            empty={
              shown.length === 0 && (
                <EmptyState
                  icon={SearchX}
                  title="Noben kontakt ne ustreza izbranim filtrom."
                  description="Poskusite z drugim stanjem ali drugimi iskalnimi besedami."
                  action={<Button onClick={clear}>Počisti filtre</Button>}
                />
              )
            }
          >
            <THead>
              <TR>
                <TH>Ime</TH>
                <TH>E-naslov in telefon</TH>
                <TH>Kaj so želeli</TH>
                <TH>Stanje</TH>
                <TH>Pogovor</TH>
              </TR>
            </THead>
            <TBody>
              {shown.map((lead) => (
                <TableRow key={lead.id} lead={lead} />
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Kontakti"
        description="Obiskovalci, ki so agentu pustili svoje podatke. Označite, kdo je že kontaktiran."
        actions={
          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            disabled={leads.loading}
            disabledReason={!leads.loading && all.length === 0 ? 'Izvoz je mogoč, ko je na seznamu vsaj en kontakt.' : undefined}
            onClick={() => setCsvOpen(true)}
          >
            Izvozi CSV
          </Button>
        }
      />
      {body}
      <CsvDialog open={csvOpen} onOpenChange={setCsvOpen} />
    </>
  );
}

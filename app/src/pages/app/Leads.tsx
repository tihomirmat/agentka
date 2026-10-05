import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CircleAlert, FileSpreadsheet, SearchX, Users } from 'lucide-react';
import {
  Button,
  ButtonLink,
  Card,
  CodeBlock,
  CopyValue,
  Dialog,
  EmptyState,
  PageHeader,
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
import { formatNumber, plural } from '@/data/format';
import { LEAD_STATUS } from '@/data/labels';
import { cn } from '@/lib/cn';
import { ClampedText } from './inbox/ClampedText';
import { formatListDateTime } from './inbox/dates';
import { LeadStatusSelect } from './inbox/LeadStatusSelect';
import { matchesAllWords } from './inbox/search';
import { SearchField } from './inbox/SearchField';
import { useContainerWidth } from './inbox/useContainerWidth';
import { useSearchText } from './inbox/useSearchText';

type StatusFilter = 'all' | api.LeadStatus;

/** "Stranke" are the contacts that became a deal (state »Dogovorjeno«). */
const CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Vsi' },
  { value: 'new', label: 'Novi' },
  { value: 'contacted', label: 'Kontaktirani' },
  { value: 'won', label: 'Stranke' },
  { value: 'lost', label: LEAD_STATUS.lost.label },
];

/** Room (px) the table needs; narrower than this every contact becomes a card. */
const TABLE_MIN_WIDTH = 940;

const LINK =
  'inline-flex items-center gap-1 rounded text-sm font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline';

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

/* -------------------------------------------------------------------- chips */

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors duration-100',
        active
          ? 'border-accent bg-accent-soft text-accent-soft-fg'
          : 'border-border-strong bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg',
      )}
    >
      {label}
      <span className={cn('nums text-xs', active ? 'text-accent-soft-fg' : 'text-fg-subtle')}>{formatNumber(count)}</span>
    </button>
  );
}

/* --------------------------------------------------------------- csv dialog */

function CsvDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const load = api.useAction(api.exportLeadsCsv);
  const [result, setResult] = useState<{ csv: string; rows: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
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
      description="Prenos datoteke bo deloval, ko bo povezan strežnik; do takrat kopirajte besedilo in ga prilepite v preglednico."
      footer={
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Zapri
        </Button>
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
          <CodeBlock code={result.csv} label="Kontakti, CSV" copyLabel="Kopiraj besedilo" />
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

function ContactValues({ lead }: { lead: api.Lead }) {
  return (
    <>
      <CopyValue value={lead.email} copyLabel="Kopiraj e-naslov" />
      <CopyValue value={lead.phone} copyLabel="Kopiraj telefonsko številko" />
    </>
  );
}

function ConversationLink({ lead }: { lead: api.Lead }) {
  return (
    <Link to={`/app/pogovori/${lead.conversation_id}`} className={LINK}>
      Pogovor
      <ArrowRight size={14} aria-hidden="true" />
      <span className="sr-only"> ({lead.name})</span>
    </Link>
  );
}

function TableRow({ lead }: { lead: api.Lead }) {
  return (
    <TR className="align-top">
      <TD nowrap className="align-top">
        <p className="whitespace-nowrap font-medium text-fg">{lead.name}</p>
        <p className="nums whitespace-nowrap text-sm text-fg-subtle">{formatListDateTime(lead.created_at)}</p>
      </TD>
      <TD nowrap className="align-top">
        <div className="flex flex-col gap-0.5">
          <ContactValues lead={lead} />
        </div>
      </TD>
      <TD className="w-full min-w-[12rem] align-top">
        <ClampedText text={lead.what_they_wanted} lines={2} />
      </TD>
      <TD className="align-top">
        <LeadStatusSelect lead={lead} className="w-40" />
      </TD>
      <TD className="align-top">
        <ConversationLink lead={lead} />
      </TD>
    </TR>
  );
}

function CardRow({ lead }: { lead: api.Lead }) {
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-medium text-fg">{lead.name}</p>
          <p className="nums text-sm text-fg-subtle">{formatListDateTime(lead.created_at)}</p>
        </div>
        <LeadStatusSelect lead={lead} className="w-40 shrink-0" />
      </div>
      <ClampedText text={lead.what_they_wanted} lines={3} className="mt-2" />
      <div className="mt-3 flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
        <ContactValues lead={lead} />
      </div>
      <div className="mt-3">
        <ConversationLink lead={lead} />
      </div>
    </li>
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
  const [boxRef, boxWidth] = useContainerWidth();
  const asTable = boxWidth >= TABLE_MIN_WIDTH;

  const setStatus = (next: StatusFilter) => setParams(writeParams(next, text), { replace: true });
  const [text, setText] = useSearchText(params.get('q') ?? '', (q) =>
    setParams(writeParams(statusRef.current, q), { replace: true }),
  );
  const clear = () => setParams(new URLSearchParams(), { replace: true });

  const all = leads.data ?? [];
  const count = (s: StatusFilter) => (s === 'all' ? all.length : all.filter((l) => l.status === s).length);
  const shown = all.filter((l) => (status === 'all' || l.status === status) && matches(l, text));
  const narrowed = status !== 'all' || text.trim() !== '';

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
          <div role="group" aria-label="Stanje kontakta" className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <FilterChip
                key={chip.value}
                label={chip.label}
                count={count(chip.value)}
                active={status === chip.value}
                onClick={() => setStatus(chip.value)}
              />
            ))}
          </div>
          <SearchField
            label="Iskanje po kontaktih"
            placeholder="Ime, e-pošta, telefon ali želja"
            value={text}
            onChange={setText}
            className="w-full sm:ml-auto sm:w-80"
          />
        </div>

        {narrowed && shown.length > 0 ? (
          <p className="text-sm text-fg-muted" aria-live="polite">
            Prikazanih {formatNumber(shown.length)} od {plural(all.length, ['kontakta', 'kontaktov', 'kontaktov', 'kontaktov'])}.{' '}
            <button type="button" onClick={clear} className="rounded font-medium text-accent underline-offset-2 hover:underline">
              Počisti filtre
            </button>
          </p>
        ) : null}

        <Card className="overflow-hidden">
          {shown.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Noben kontakt ne ustreza izbranim filtrom."
              description="Poskusite z drugim stanjem ali drugačnim iskalnim nizom."
              action={<Button onClick={clear}>Počisti filtre</Button>}
            />
          ) : asTable ? (
            <Table minWidth={TABLE_MIN_WIDTH} caption="Kontakti, najnovejši na vrhu">
              <THead>
                <TR>
                  <TH>Ime</TH>
                  <TH>E-pošta in telefon</TH>
                  <TH>Kaj so želeli</TH>
                  <TH>Stanje</TH>
                  <TH>
                    <span className="sr-only">Povezava</span>
                  </TH>
                </TR>
              </THead>
              <TBody>
                {shown.map((lead) => (
                  <TableRow key={lead.id} lead={lead} />
                ))}
              </TBody>
            </Table>
          ) : (
            <ul className="divide-y divide-border" aria-label="Kontakti, najnovejši na vrhu">
              {shown.map((lead) => (
                <CardRow key={lead.id} lead={lead} />
              ))}
            </ul>
          )}
        </Card>

      </div>
    );
  }

  return (
    <div ref={boxRef}>
      <PageHeader
        title="Kontakti"
        description="Obiskovalci, ki so agentu pustili svoje podatke. Označite, kdo je že kontaktiran."
        actions={
          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            disabled={leads.loading || all.length === 0}
            onClick={() => setCsvOpen(true)}
          >
            Izvozi CSV
          </Button>
        }
      />
      {body}
      <CsvDialog open={csvOpen} onOpenChange={setCsvOpen} />
    </div>
  );
}

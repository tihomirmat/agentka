import { useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CircleAlert, MessagesSquare, SearchX } from 'lucide-react';
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  Select,
  SkeletonRows,
  StatusPill,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import * as api from '@/data/api';
import { formatDuration, formatMinutes, formatNumber, plural } from '@/data/format';
import { BOOKING_STATUS, CONVERSATION_OUTCOME } from '@/data/labels';
import { cn } from '@/lib/cn';
import {
  filterConversations,
  inPeriod,
  readFilters,
  writeFilters,
  type ConversationFilters,
  type OutcomeFilter,
  type Period,
} from './inbox/conversationFilters';
import { EmailProblem, emailProblem, TopicAndSummary, VisitorName } from './inbox/conversationBits';
import { formatListDateTime } from './inbox/dates';
import { SearchField } from './inbox/SearchField';
import { Segmented } from './inbox/Segmented';
import { useContainerWidth } from './inbox/useContainerWidth';
import { useSearchText } from './inbox/useSearchText';

const PERIODS: { value: Period; label: string }[] = [
  { value: '7', label: '7 dni' },
  { value: '30', label: '30 dni' },
  { value: 'all', label: 'Vse' },
];

/** Sentence for a period with no conversations at all. */
const NONE_IN_PERIOD: Record<Period, string> = {
  '7': 'V zadnjih 7 dneh ni pogovorov.',
  '30': 'V zadnjih 30 dneh ni pogovorov.',
  all: 'Pogovorov ni.',
};

const OUTCOMES: { value: OutcomeFilter; label: string }[] = [
  { value: 'all', label: 'Vsi' },
  { value: 'question', label: CONVERSATION_OUTCOME.question.label },
  { value: 'lead', label: CONVERSATION_OUTCOME.lead.label },
  { value: 'booking', label: CONVERSATION_OUTCOME.booking.label },
];

/** Room (px) the table needs; narrower than this the list becomes stacked cards. */
const TABLE_MIN_WIDTH = 720;
/** Room (px) the two segmented controls and the search field need side by side. */
const SEGMENTS_MIN_WIDTH = 640;

/* ------------------------------------------------------------------ summary */

function SummaryStrip({ list }: { list: api.Conversation[] }) {
  const withContact = list.filter((c) => c.outcome === 'lead').length;
  const withBooking = list.filter((c) => c.outcome === 'booking').length;
  const seconds = list.reduce((sum, c) => sum + c.duration_sec, 0);
  const minutes = seconds === 0 ? 0 : Math.max(1, Math.round(seconds / 60));

  const cells: { label: string; value: string; cell: string }[] = [
    { label: 'Pogovori', value: formatNumber(list.length), cell: '' },
    { label: 'S kontaktom', value: formatNumber(withContact), cell: 'border-l border-border' },
    { label: 'Z rezervacijo', value: formatNumber(withBooking), cell: 'border-t border-border sm:border-l sm:border-t-0' },
    { label: 'Skupno trajanje', value: formatMinutes(minutes), cell: 'border-l border-t border-border sm:border-t-0' },
  ];

  return (
    <section aria-labelledby="pogovori-povzetek">
      <h2 id="pogovori-povzetek" className="sr-only">
        Povzetek izbranega obdobja
      </h2>
      <Card className="overflow-hidden">
        <dl className="grid grid-cols-2 sm:grid-cols-4">
          {cells.map((c) => (
            <div key={c.label} className={cn('min-w-0 px-4 py-3 sm:px-5', c.cell)}>
              <dt className="eyebrow truncate">{c.label}</dt>
              <dd className="nums mt-1 truncate font-display text-xl font-semibold tracking-tight text-fg">{c.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>
  );
}

/* --------------------------------------------------------------------- rows */

interface RowProps {
  conversation: api.Conversation;
  /** a booking of this conversation still waits for the owner */
  waiting: boolean;
  /** search part of the current address, so the detail page can bring the person back */
  search: string;
}

function detailLink(id: string, search: string) {
  return { pathname: `/app/pogovori/${id}`, search };
}

function OutcomePills({ conversation, waiting }: { conversation: api.Conversation; waiting: boolean }) {
  const outcome = CONVERSATION_OUTCOME[conversation.outcome];
  return (
    <span className="flex flex-col items-start gap-1">
      <StatusPill tone={outcome.tone}>{outcome.label}</StatusPill>
      {waiting ? <StatusPill tone={BOOKING_STATUS.requested.tone}>{BOOKING_STATUS.requested.label}</StatusPill> : null}
    </span>
  );
}

function TableRow({ conversation: c, waiting, search }: RowProps) {
  const problem = emailProblem(c);
  return (
    // The row is positioned so that the link in the name cell can cover all of it.
    <TR interactive className="relative">
      <TD nowrap>{formatListDateTime(c.started_at)}</TD>
      <TD numeric>{formatDuration(c.duration_sec)}</TD>
      <TD>
        <OutcomePills conversation={c} waiting={waiting} />
      </TD>
      <TD className="max-w-[17rem]">
        <Link
          to={detailLink(c.id, search)}
          className="block truncate rounded after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
        >
          <VisitorName name={c.visitor_name} />
        </Link>
        {problem ? <EmailProblem text={problem} /> : null}
      </TD>
      <TD className="w-full max-w-0">
        <span className="block truncate">
          <TopicAndSummary topic={c.topic} summary={c.summary} />
        </span>
      </TD>
    </TR>
  );
}

function CardRow({ conversation: c, waiting, search }: RowProps) {
  const problem = emailProblem(c);
  return (
    <li>
      <Link
        to={detailLink(c.id, search)}
        className="block px-4 py-3.5 transition-colors duration-100 hover:bg-surface-2 focus-visible:outline-offset-[-2px] sm:px-5"
      >
        <span className="flex items-start justify-between gap-3">
          <VisitorName name={c.visitor_name} className="min-w-0 break-words" />
          <OutcomePills conversation={c} waiting={waiting} />
        </span>
        <span className="nums mt-0.5 block text-sm text-fg-subtle">
          {formatListDateTime(c.started_at)} · trajanje {formatDuration(c.duration_sec)}
        </span>
        <span className="mt-1.5 line-clamp-3 block text-base">
          <TopicAndSummary topic={c.topic} summary={c.summary} />
        </span>
        {problem ? <EmailProblem text={problem} /> : null}
      </Link>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Nalaganje pogovorov">
      <Card className="h-[4.75rem]" aria-hidden="true" />
      <Card>
        <SkeletonRows rows={7} />
      </Card>
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export default function Conversations() {
  const [params, setParams] = useSearchParams();
  const { search } = useLocation();
  const filters = readFilters(params);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const conversations = api.useQuery(() => api.listConversations(), []);
  const bookings = api.useQuery(() => api.listBookings(), []);
  const [boxRef, boxWidth] = useContainerWidth();
  const asTable = boxWidth >= TABLE_MIN_WIDTH;
  const withSegments = boxWidth >= SEGMENTS_MIN_WIDTH;

  const update = (patch: Partial<ConversationFilters>) =>
    setParams(writeFilters({ ...filtersRef.current, ...patch }), { replace: true });
  const [text, setText] = useSearchText(filters.q, (q) => update({ q }));
  const clear = () => setParams(new URLSearchParams(), { replace: true });

  const all = conversations.data ?? [];
  const inRange = inPeriod(all, filters.period);
  const shown = filterConversations(all, { ...filters, q: text });
  const narrowed = filters.outcome !== 'all' || text.trim() !== '';

  const now = new Date().toISOString();
  const waitingIds = new Set(
    (bookings.data ?? []).filter((b) => b.status === 'requested' && b.start >= now).map((b) => b.conversation_id),
  );

  let body;
  if (conversations.loading) {
    body = <LoadingState />;
  } else if (conversations.error) {
    body = (
      <Card>
        <EmptyState
          icon={CircleAlert}
          title={conversations.error}
          action={<Button onClick={conversations.reload}>Poskusi znova</Button>}
        />
      </Card>
    );
  } else if (all.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon={MessagesSquare}
          title="Pogovorov še ni. Agent mora biti najprej nameščen na vaši spletni strani."
          description="Ko bo obiskovalec začel govoriti z njim, se pogovor pojavi tukaj."
          action={
            <ButtonLink variant="primary" to="/app/namestitev">
              Namesti agenta
            </ButtonLink>
          }
        />
      </Card>
    );
  } else {
    // No results for the filters. When only the period hides everything, offer to widen it.
    const onlyPeriod = !narrowed && filters.period !== 'all';
    const empty =
      shown.length === 0 ? (
        onlyPeriod ? (
          <EmptyState
            icon={SearchX}
            title={NONE_IN_PERIOD[filters.period]}
            action={<Button onClick={() => update({ period: 'all' })}>Pokaži vse pogovore</Button>}
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title="Noben pogovor ne ustreza izbranim filtrom."
            description="Poskusite z daljšim obdobjem ali drugačnim iskalnim nizom."
            action={<Button onClick={clear}>Počisti filtre</Button>}
          />
        )
      ) : null;

    body = (
      <div className="flex flex-col gap-6">
        <SummaryStrip list={inRange} />

        <section aria-labelledby="pogovori-seznam" className="flex flex-col gap-3">
          <h2 id="pogovori-seznam" className="sr-only">
            Seznam pogovorov
          </h2>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {withSegments ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-fg-muted">Obdobje</span>
                  <Segmented
                    label="Obdobje"
                    value={filters.period}
                    onChange={(period) => update({ period })}
                    options={PERIODS}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-fg-muted">Izid</span>
                  <Segmented
                    label="Izid pogovora"
                    value={filters.outcome}
                    onChange={(outcome) => update({ outcome })}
                    options={OUTCOMES}
                  />
                </div>
              </>
            ) : (
              <div className="grid w-full grid-cols-2 gap-3">
                <Select
                  aria-label="Obdobje"
                  value={filters.period}
                  onValueChange={(period) => update({ period })}
                  leading={<span className="text-fg-subtle">Obdobje</span>}
                  options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
                />
                <Select
                  aria-label="Izid pogovora"
                  value={filters.outcome}
                  onValueChange={(outcome) => update({ outcome })}
                  leading={<span className="text-fg-subtle">Izid</span>}
                  options={OUTCOMES}
                />
              </div>
            )}
            <SearchField
              label="Iskanje po pogovorih"
              placeholder="Ime, tema ali povzetek"
              value={text}
              onChange={setText}
              className={withSegments ? 'ml-auto w-72' : undefined}
            />
          </div>

          {narrowed && shown.length > 0 ? (
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-fg-muted" aria-live="polite">
              <span>
                Prikazanih {formatNumber(shown.length)} od {plural(inRange.length, ['pogovora', 'pogovorov', 'pogovorov', 'pogovorov'])}.
              </span>
              <button
                type="button"
                onClick={clear}
                className="rounded font-medium text-accent underline-offset-2 hover:underline"
              >
                Počisti filtre
              </button>
            </p>
          ) : null}

          <Card className="overflow-hidden">
            {empty ? (
              empty
            ) : asTable ? (
              <Table minWidth={TABLE_MIN_WIDTH} caption="Pogovori, najnovejši na vrhu">
                <THead>
                  <TR>
                    <TH>Datum in ura</TH>
                    <TH numeric>Trajanje</TH>
                    <TH>Izid</TH>
                    <TH>Obiskovalec</TH>
                    <TH>Povzetek</TH>
                  </TR>
                </THead>
                <TBody>
                  {shown.map((c) => (
                    <TableRow key={c.id} conversation={c} waiting={waitingIds.has(c.id)} search={search} />
                  ))}
                </TBody>
              </Table>
            ) : (
              <ul className="divide-y divide-border" aria-label="Pogovori, najnovejši na vrhu">
                {shown.map((c) => (
                  <CardRow key={c.id} conversation={c} waiting={waitingIds.has(c.id)} search={search} />
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div ref={boxRef}>
      <PageHeader
        title="Pogovori"
        description="Kdo je govoril z vašim agentom, kaj je želel in ali morate kaj storiti."
      />
      {body}
    </div>
  );
}

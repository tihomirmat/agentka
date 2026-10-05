import { useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CircleAlert, MessagesSquare, SearchX } from 'lucide-react';
import {
  Button,
  ButtonLink,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  SearchField,
  Segmented,
  SkeletonRows,
  Stat,
  StatusPill,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  useContainerWidth,
} from '@/components/ui';
import * as api from '@/data/api';
import { formatDuration, formatMinutes, formatNumber, formatRelativeDateTime, plural } from '@/data/format';
import { BOOKING_STATUS, CONVERSATION_OUTCOME, COUNT_LABELS } from '@/data/labels';
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
import { useSearchText } from './inbox/useSearchText';

const PERIODS: { value: Period; label: string }[] = [
  { value: '7', label: '7 dni' },
  { value: '30', label: '30 dni' },
  { value: 'all', label: 'Vse' },
];

/** What the numbers of the summary cover. Pregled counts the billing period, so this says which one it is. */
const PERIOD_SUB: Record<Period, string> = {
  '7': 'v zadnjih 7 dneh',
  '30': 'v zadnjih 30 dneh',
  all: 'ves čas',
};

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

/** Room (px) the table needs; narrower than this every conversation becomes a card. */
const TABLE_MIN_WIDTH = 960;

/* ------------------------------------------------------------------ summary */

function SummaryStrip({ list, period }: { list: api.Conversation[]; period: Period }) {
  const counts = api.summarizeConversations(list);
  const minutes = counts.duration_sec === 0 ? 0 : Math.max(1, Math.round(counts.duration_sec / 60));

  return (
    <section aria-labelledby="pogovori-povzetek">
      <h2 id="pogovori-povzetek" className="sr-only">
        Povzetek izbranega obdobja
      </h2>
      <Card>
        <CardBody className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          <Stat
            variant="inline"
            label={COUNT_LABELS.conversationsInPeriod.label}
            value={formatNumber(counts.total)}
            sub={PERIOD_SUB[period]}
          />
          <Stat variant="inline" label={COUNT_LABELS.outcome.lead} value={formatNumber(counts.by_outcome.lead)} />
          <Stat variant="inline" label={COUNT_LABELS.outcome.booking} value={formatNumber(counts.by_outcome.booking)} />
          <Stat variant="inline" label="Skupno trajanje" value={formatMinutes(minutes)} />
        </CardBody>
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
      <TD nowrap>{formatRelativeDateTime(c.started_at)}</TD>
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

/**
 * Below TABLE_MIN_WIDTH a conversation is a card, not a stacked table row: the visitor is the
 * title, the date and length sit under it, the summary gets the full width. A stacked table
 * would make the date the title and put a label before every value (about twice the height).
 */
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
          {formatRelativeDateTime(c.started_at)} · trajanje {formatDuration(c.duration_sec)}
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
      <Card className="h-[5.5rem]" aria-hidden="true" />
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
            description="Poskusite z daljšim obdobjem ali drugimi iskalnimi besedami."
            action={<Button onClick={clear}>Počisti filtre</Button>}
          />
        )
      ) : null;

    body = (
      <div className="flex flex-col gap-6">
        <SummaryStrip list={inRange} period={filters.period} />

        <section aria-labelledby="pogovori-seznam" className="flex flex-col gap-3">
          <h2 id="pogovori-seznam" className="sr-only">
            Seznam pogovorov
          </h2>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex w-full min-w-0 items-center gap-2 min-[480px]:w-auto">
              <span className="w-16 shrink-0 text-sm text-fg-muted min-[480px]:w-auto">Obdobje</span>
              <Segmented
                label="Obdobje"
                value={filters.period}
                onChange={(period) => update({ period })}
                options={PERIODS}
                className="flex-1 min-[480px]:flex-none"
              />
            </div>
            <div className="flex w-full min-w-0 items-center gap-2 min-[480px]:w-auto">
              <span className="w-16 shrink-0 text-sm text-fg-muted min-[480px]:w-auto">Izid</span>
              <Segmented
                label="Izid pogovora"
                value={filters.outcome}
                onChange={(outcome) => update({ outcome })}
                options={OUTCOMES}
                className="flex-1 min-[480px]:flex-none"
              />
            </div>
            <SearchField
              label="Iskanje po pogovorih"
              placeholder="Ime, tema ali povzetek"
              value={text}
              onChange={setText}
              className="w-full sm:ml-auto sm:w-72"
            />
          </div>

          {narrowed && shown.length > 0 ? (
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-fg-muted" aria-live="polite">
              <span>
                Prikazano: {formatNumber(shown.length)} od{' '}
                {plural(inRange.length, ['pogovora', 'pogovorov', 'pogovorov', 'pogovorov'])}.
              </span>
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

import type { ReactNode } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, CircleAlert, SearchX } from 'lucide-react';
import {
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  CopyValue,
  EmptyState,
  PageHeader,
  SkeletonText,
  StatusPill,
} from '@/components/ui';
import { TranscriptBubble } from '@/components/widget';
import * as api from '@/data/api';
import {
  formatDateLong,
  formatDuration,
  formatRelativeDateTime,
  formatTime,
  plural,
} from '@/data/format';
import { BOOKING_STATUS, CONVERSATION_OUTCOME, EMAIL_STATUS, type StateLabel } from '@/data/labels';
import { filterConversations, readFilters } from './inbox/conversationFilters';
import { VisitorName } from './inbox/conversationBits';
import { formatClockRange, formatWeekdayDate, minutesBetween } from './inbox/dates';
import { LeadStatusSelect } from './inbox/LeadStatusSelect';

const SECTION = 'px-4 py-4 sm:px-5';
const LINK = 'inline-flex items-center gap-1 rounded text-sm font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline';

/* ------------------------------------------------------------- small pieces */

function Missing() {
  return <span className="text-fg-subtle">ni podatka</span>;
}

function DataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 min-w-0 break-words text-base text-fg">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------ e-mail section */

interface MailRow {
  key: string;
  who: string;
  to: string | null;
  status: StateLabel;
  error: string | null;
  at: string | null;
}

function mailRows(conversation: api.Conversation, log: api.EmailLog[]): MailRow[] {
  const rows: MailRow[] = log.map((e) => ({
    key: e.id,
    who: e.kind === 'visitor_confirmation' ? 'Obiskovalcu' : e.kind === 'owner_notification' ? 'Vam' : 'Testno sporočilo',
    to: e.to,
    status: EMAIL_STATUS[e.status],
    error: e.status === 'failed' ? (e.error ?? 'Razlog ni naveden. Preverite naslov prejemnika.') : null,
    at: e.sent_at,
  }));
  // A visitor who left no address gets no e-mail; say so instead of showing nothing.
  const hasVisitorRow = log.some((e) => e.kind === 'visitor_confirmation');
  if (!hasVisitorRow && conversation.visitor_email_status === 'skipped') {
    rows.push({
      key: 'visitor-skipped',
      who: 'Obiskovalcu',
      to: null,
      status: EMAIL_STATUS.skipped,
      error: null,
      at: null,
    });
  }
  return rows;
}

function SentMessages({ rows, loading }: { rows: MailRow[]; loading: boolean }) {
  if (loading) return <SkeletonText lines={3} />;
  if (rows.length === 0) return <p className="text-sm text-fg-muted">Za ta pogovor ni poslanih sporočil.</p>;
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.key} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-fg">{r.who}</span>
            <StatusPill tone={r.status.tone}>{r.status.label}</StatusPill>
          </div>
          {r.to || r.at ? (
            <p className="mt-0.5 break-words text-sm text-fg-muted">
              {r.to}
              {r.at ? (
                <span className="nums text-fg-subtle">
                  {r.to ? ' · ' : ''}
                  {formatRelativeDateTime(r.at)}
                </span>
              ) : null}
            </p>
          ) : null}
          {r.error ? (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-danger">
              <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
              <span className="min-w-0">{r.error}</span>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------- side panel */

function SidePanel({
  conversation: c,
  lead,
  booking,
  mails,
  mailsLoading,
}: {
  conversation: api.Conversation;
  lead: api.Lead | undefined;
  booking: api.Booking | undefined;
  mails: MailRow[];
  mailsLoading: boolean;
}) {
  const bookingStatus = booking ? BOOKING_STATUS[booking.status] : null;
  return (
    <Card className="divide-y divide-border">
      <section aria-labelledby="zbrani-podatki" className={SECTION}>
        <h2 id="zbrani-podatki" className="mb-3 text-md font-semibold text-fg">
          Zbrani podatki
        </h2>
        <dl className="flex flex-col gap-3">
          <DataRow label="Ime">
            {c.visitor_name ? <CopyValue value={c.visitor_name} copyLabel="Kopiraj ime" /> : <Missing />}
          </DataRow>
          <DataRow label="E-pošta">
            {c.visitor_email ? <CopyValue value={c.visitor_email} copyLabel="Kopiraj e-naslov" /> : <Missing />}
          </DataRow>
          <DataRow label="Telefon">
            {c.visitor_phone ? (
              <CopyValue value={c.visitor_phone} copyLabel="Kopiraj telefonsko številko" />
            ) : (
              <Missing />
            )}
          </DataRow>
          <DataRow label="Tema">{c.topic ? c.topic : <Missing />}</DataRow>
          <DataRow label="Dogovorjeno">{c.agreed ? c.agreed : <Missing />}</DataRow>
        </dl>
      </section>

      {booking && bookingStatus ? (
        <section aria-labelledby="rezervacija" className={SECTION}>
          <h2 id="rezervacija" className="mb-3 text-md font-semibold text-fg">
            Rezervacija
          </h2>
          <p className="font-medium text-fg">{formatWeekdayDate(booking.start)}</p>
          <p className="nums text-base text-fg-muted">
            {formatClockRange(booking.start, booking.end)} · {minutesBetween(booking.start, booking.end)} min
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <StatusPill tone={bookingStatus.tone}>{bookingStatus.label}</StatusPill>
            <Link to="/app/rezervacije" className={LINK}>
              Odpri rezervacije
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {booking.status === 'requested' ? (
            <p className="mt-2 text-sm text-fg-muted">Želeni termin potrdite ali zavrnite na strani Rezervacije.</p>
          ) : null}
        </section>
      ) : null}

      {lead ? (
        <section aria-labelledby="kontakt" className={SECTION}>
          <h2 id="kontakt" className="mb-3 text-md font-semibold text-fg">
            Kontakt
          </h2>
          <LeadStatusSelect lead={lead} size="md" className="w-full" />
        </section>
      ) : null}

      <section aria-labelledby="poslana-sporocila" className={SECTION}>
        <h2 id="poslana-sporocila" className="mb-3 text-md font-semibold text-fg">
          Poslana sporočila
        </h2>
        <SentMessages rows={mails} loading={mailsLoading} />
      </section>
    </Card>
  );
}

/* --------------------------------------------------------------------- page */

export default function ConversationDetail() {
  const { id = '' } = useParams();
  const { search } = useLocation();
  const [params] = useSearchParams();

  const conversation = api.useQuery(() => api.getConversation(id), [id]);
  const list = api.useQuery(() => api.listConversations(), []);
  const emails = api.useQuery(() => api.listEmailLog(id), [id]);
  const leads = api.useQuery(() => api.listLeads(), []);
  const bookings = api.useQuery(() => api.listBookings(), []);
  const agent = api.useQuery(() => api.getAgent(), []);

  const backTo = { to: `/app/pogovori${search}`, label: 'Vsi pogovori' };

  if (conversation.loading) {
    return (
      <>
        <PageHeader title="Pogovor" back={backTo} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" role="status" aria-label="Nalaganje pogovora">
          <Card>
            <CardBody>
              <SkeletonText lines={4} />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <SkeletonText lines={6} />
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  if (conversation.error) {
    return (
      <>
        <PageHeader title="Pogovor" back={backTo} />
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={conversation.error}
            action={<Button onClick={conversation.reload}>Poskusi znova</Button>}
          />
        </Card>
      </>
    );
  }

  const c = conversation.data;
  if (!c) {
    return (
      <>
        <PageHeader title="Pogovor" back={backTo} />
        <Card>
          <EmptyState
            icon={SearchX}
            title="Tega pogovora ni."
            description="Povezava morda ni pravilna ali pa je pogovor že odstranjen."
            action={
              <ButtonLink variant="secondary" to="/app/pogovori">
                Vsi pogovori
              </ButtonLink>
            }
          />
        </Card>
      </>
    );
  }

  // Previous / next follow the list the person came from: same filters, same order (newest first).
  const everything = list.data ?? [];
  let ordered = filterConversations(everything, readFilters(params));
  let position = ordered.findIndex((x) => x.id === c.id);
  if (position === -1) {
    ordered = everything;
    position = ordered.findIndex((x) => x.id === c.id);
  }
  const newer = position > 0 ? ordered[position - 1] : undefined;
  const older = position >= 0 ? ordered[position + 1] : undefined;
  const to = (target: api.Conversation) => ({ pathname: `/app/pogovori/${target.id}`, search });

  const outcome = CONVERSATION_OUTCOME[c.outcome];
  const lead = leads.data?.find((l) => l.conversation_id === c.id);
  const booking = bookings.data?.find((b) => b.conversation_id === c.id);
  const agentName = agent.data?.name ?? 'Agent';

  return (
    <>
      <PageHeader
        back={backTo}
        title={<VisitorName name={c.visitor_name} className="font-display text-xl font-semibold tracking-tight" />}
        meta={<StatusPill tone={outcome.tone}>{outcome.label}</StatusPill>}
        description={
          <span className="nums">
            {formatDateLong(c.started_at)} ob {formatTime(c.started_at)} · trajanje {formatDuration(c.duration_sec)}
          </span>
        }
        actions={
          position >= 0 ? (
            <>
              <span className="nums mr-1 text-sm text-fg-subtle">
                {position + 1} od {ordered.length}
              </span>
              {newer ? (
                <ButtonLink
                  to={to(newer)}
                  size="sm"
                  variant="secondary"
                  icon={ChevronLeft}
                  aria-label="Prejšnji pogovor (novejši)"
                >
                  Prejšnji
                </ButtonLink>
              ) : (
                <Button size="sm" variant="secondary" icon={ChevronLeft} disabled aria-label="Prejšnji pogovor (ni novejšega)">
                  Prejšnji
                </Button>
              )}
              {older ? (
                <ButtonLink to={to(older)} size="sm" variant="secondary" aria-label="Naslednji pogovor (starejši)">
                  Naslednji
                  <ChevronRight size={14} aria-hidden="true" />
                </ButtonLink>
              ) : (
                <Button size="sm" variant="secondary" disabled aria-label="Naslednji pogovor (ni starejšega)">
                  Naslednji
                  <ChevronRight size={14} aria-hidden="true" />
                </Button>
              )}
            </>
          ) : null
        }
      />

      {/* Phone: summary, collected data, transcript. Desktop: summary and transcript left, data right. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="lg:col-start-1 lg:row-start-1">
          <CardHeader title="Povzetek" />
          <CardBody className="pt-0 sm:pt-0">
            <p className="max-w-prose text-base">{c.summary}</p>
          </CardBody>
        </Card>

        <aside
          aria-label="Podatki o pogovoru"
          className="min-w-0 lg:[@media(min-height:56rem)]:sticky-top lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-mt-4 lg:self-start lg:pt-4"
        >
          <SidePanel
            conversation={c}
            lead={lead}
            booking={booking}
            mails={mailRows(c, emails.data ?? [])}
            mailsLoading={emails.loading}
          />
        </aside>

        <Card className="lg:col-start-1 lg:row-start-2">
          <CardHeader
            divider
            title="Prepis"
            description={`${plural(c.transcript.length, ['izjava', 'izjavi', 'izjave', 'izjav'])}, trajanje ${formatDuration(c.duration_sec)}`}
          />
          {c.transcript.length === 0 ? (
            <CardBody>
              <p className="text-base text-fg-muted">Za ta pogovor prepis ni na voljo.</p>
            </CardBody>
          ) : (
            <CardBody className="pt-4 sm:pt-5">
              <ol className="flex flex-col gap-4">
                {c.transcript.map((turn, i) => (
                  <li key={`${turn.timeSec}-${i}`}>
                    <TranscriptBubble
                      role={turn.role}
                      speaker={turn.role === 'agent' ? agentName : 'Obiskovalec'}
                      time={formatDuration(turn.timeSec)}
                    >
                      {turn.text}
                    </TranscriptBubble>
                  </li>
                ))}
              </ol>
            </CardBody>
          )}
        </Card>
      </div>
    </>
  );
}

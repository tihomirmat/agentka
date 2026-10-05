import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Check, CircleAlert, History } from 'lucide-react';
import {
  Button,
  ButtonLink,
  Card,
  CardFooter,
  CardHeader,
  ConfirmDialog,
  CopyValue,
  EmptyState,
  PageHeader,
  Skeleton,
  SkeletonRows,
  StatusPill,
  useToast,
} from '@/components/ui';
import * as api from '@/data/api';
import { formatTime, plural } from '@/data/format';
import { BOOKING_MODE, BOOKING_STATUS } from '@/data/labels';
import { cn } from '@/lib/cn';
import { formatClockRange, formatWeekdayDate, minutesBetween, nearDayHint } from './inbox/dates';
import { useContainerWidth } from './inbox/useContainerWidth';

/** How many past or cancelled bookings are listed before "Pokaži več". */
const PAST_VISIBLE = 10;
/** Room (px) a row needs to put date, visitor and actions side by side. */
const ROW_MIN_WIDTH = 860;

const LINK =
  'inline-flex items-center gap-1 rounded text-sm font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline';

const TERMINI = ['termin', 'termina', 'termini', 'terminov'] as [string, string, string, string];
const TERMINI_WAITING = ['termin čaka', 'termina čakata', 'termini čakajo', 'terminov čaka'] as [
  string,
  string,
  string,
  string,
];

/* --------------------------------------------------------------------- rows */

interface RowProps {
  booking: api.Booking;
  /** true for the upcoming section: only there a booking can be confirmed or cancelled */
  upcoming: boolean;
  wide: boolean;
  busy: boolean;
  onConfirm: (booking: api.Booking) => void;
  onAskCancel: (booking: api.Booking) => void;
}

function BookingRow({ booking: b, upcoming, wide, busy, onConfirm, onAskCancel }: RowProps) {
  const status = BOOKING_STATUS[b.status];
  const waiting = upcoming && b.status === 'requested';
  const cancelled = b.status === 'cancelled';
  const hint = upcoming ? nearDayHint(b.start) : null;

  const when = (
    <div className="min-w-0">
      <p className={cn('font-medium', cancelled ? 'text-fg-muted' : 'text-fg')}>
        {formatWeekdayDate(b.start)}
        {hint ? (
          <>
            {' '}
            <span className="whitespace-nowrap font-normal text-fg-subtle">({hint})</span>
          </>
        ) : null}
      </p>
      <p className="nums text-base text-fg-muted">
        {formatClockRange(b.start, b.end)} · {minutesBetween(b.start, b.end)} min
      </p>
    </div>
  );

  const state = (
    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
      <StatusPill tone={status.tone}>{status.label}</StatusPill>
      <span className="text-xs text-fg-subtle">Način: {BOOKING_MODE[b.mode].label.toLowerCase()}</span>
    </div>
  );

  const who = (
    <div className="min-w-0">
      <p className={cn('break-words font-medium', cancelled ? 'text-fg-muted' : 'text-fg')}>{b.customer_name}</p>
      <p className="break-words text-base text-fg-muted">{b.topic}</p>
      <div className="mt-2 flex flex-col gap-0.5 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
        <CopyValue value={b.customer_email} copyLabel="Kopiraj e-naslov" />
        <CopyValue value={b.customer_phone} copyLabel="Kopiraj telefonsko številko" />
      </div>
    </div>
  );

  const actions = (
    <div className={cn('flex flex-wrap items-center gap-2', wide && 'justify-end')}>
      {waiting ? (
        <>
          <Button size="sm" variant="secondary" icon={Check} loading={busy} onClick={() => onConfirm(b)}>
            Potrdi termin
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onAskCancel(b)}>
            Zavrni
          </Button>
        </>
      ) : upcoming && b.status === 'confirmed' ? (
        <Button size="sm" variant="ghost" onClick={() => onAskCancel(b)}>
          Odpovej termin
        </Button>
      ) : null}
      <Link to={`/app/pogovori/${b.conversation_id}`} className={cn(LINK, 'px-1')}>
        Pogovor
        <ArrowRight size={14} aria-hidden="true" />
        <span className="sr-only"> ({b.customer_name})</span>
      </Link>
    </div>
  );

  // A booking that waits for the owner is tinted: it is the one thing on this page to act on.
  const tint = waiting ? 'bg-warning-soft' : '';

  if (wide) {
    return (
      <li className={cn('grid grid-cols-[13rem_minmax(0,1fr)_auto] items-start gap-6 px-5 py-4', tint)}>
        {when}
        {who}
        <div className="flex min-w-0 flex-col items-end gap-3">
          {state}
          {actions}
        </div>
      </li>
    );
  }
  return (
    <li className={cn('flex flex-col gap-3 px-4 py-4 sm:px-5', tint)}>
      <div className="flex items-start justify-between gap-3">
        {when}
        {state}
      </div>
      {who}
      {actions}
    </li>
  );
}

/* ----------------------------------------------------------------- sections */

function Section({
  label,
  title,
  description,
  children,
  footer,
}: {
  label: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section aria-label={label}>
      <Card className="overflow-hidden">
        <CardHeader title={title} description={description} divider />
        {children}
        {footer}
      </Card>
    </section>
  );
}

function cancelDescription(b: api.Booking): ReactNode {
  const when = `${formatWeekdayDate(b.start)} ob ${formatTime(b.start)}`;
  return (
    <>
      Termin {when} bo odpovedan. Obiskovalcu na {b.customer_email} sporočimo, da je termin odpovedan
      {b.calendar_event_id ? ', dogodek v koledarju pa izbrišemo' : ''}. V predogledu se to samo simulira: sporočilo se
      ne pošlje{b.calendar_event_id ? ' in dogodek v koledarju ostane' : ''}.
    </>
  );
}

/* --------------------------------------------------------------------- page */

export default function Bookings() {
  const toast = useToast();
  const bookings = api.useQuery(() => api.listBookings(), []);
  const settings = api.useQuery(() => api.getBookingSettings(), []);
  const confirm = api.useAction(api.confirmBooking, { onError: (message) => toast.error(message) });
  const cancel = api.useAction(api.cancelBooking, { onError: (message) => toast.error(message) });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<api.Booking | null>(null);
  const [showAllPast, setShowAllPast] = useState(false);
  const [boxRef, boxWidth] = useContainerWidth();
  const wide = boxWidth >= ROW_MIN_WIDTH;

  function notify(result: api.ActionResult) {
    if (result.simulated) toast.info(result.message);
    else toast.success(result.message);
  }

  async function handleConfirm(b: api.Booking) {
    setBusyId(b.id);
    const result = await confirm.run(b.id);
    setBusyId(null);
    if (result) notify(result);
  }

  async function handleCancel() {
    if (!toCancel) return;
    const result = await cancel.run(toCancel.id);
    if (result) notify(result);
  }

  const now = new Date().toISOString();
  const list = bookings.data ?? [];
  const upcoming = list
    .filter((b) => b.status !== 'cancelled' && b.start >= now)
    .sort((a, b) => {
      const aw = a.status === 'requested' ? 0 : 1;
      const bw = b.status === 'requested' ? 0 : 1;
      return aw - bw || a.start.localeCompare(b.start);
    });
  const past = list
    .filter((b) => b.status === 'cancelled' || b.start < now)
    .sort((a, b) => b.start.localeCompare(a.start));
  const pastShown = showAllPast ? past : past.slice(0, PAST_VISIBLE);
  const waitingCount = upcoming.filter((b) => b.status === 'requested').length;

  const mode = settings.data ? BOOKING_MODE[settings.data.mode] : null;

  let body;
  if (bookings.loading) {
    body = (
      <div className="flex flex-col gap-6">
        <Card>
          <SkeletonRows rows={3} />
        </Card>
        <Card>
          <SkeletonRows rows={2} />
        </Card>
      </div>
    );
  } else if (bookings.error) {
    body = (
      <Card>
        <EmptyState
          icon={CircleAlert}
          title={bookings.error}
          action={<Button onClick={bookings.reload}>Poskusi znova</Button>}
        />
      </Card>
    );
  } else {
    body = (
      <div className="flex flex-col gap-6">
        <Section
          label="Prihajajoči termini"
          title="Prihajajoče"
          description={
            upcoming.length === 0
              ? undefined
              : `${plural(upcoming.length, TERMINI)}${
                  waitingCount > 0 ? ` · ${plural(waitingCount, TERMINI_WAITING)} na vašo potrditev` : ''
                }.`
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Prihajajočih terminov ni."
              description="Pojavijo se, ko obiskovalec prek agenta izbere čas."
              action={
                <ButtonLink variant="secondary" to="/app/termini">
                  Nastavitve terminov
                </ButtonLink>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  upcoming
                  wide={wide}
                  busy={confirm.pending && busyId === b.id}
                  onConfirm={handleConfirm}
                  onAskCancel={setToCancel}
                />
              ))}
            </ul>
          )}
        </Section>

        <Section
          label="Pretekle in preklicane rezervacije"
          title="Pretekle in preklicane"
          description={past.length > 0 ? `${plural(past.length, TERMINI)}. Najnovejši je na vrhu.` : undefined}
          footer={
            past.length > PAST_VISIBLE ? (
              <CardFooter className="justify-center">
                <Button variant="ghost" size="sm" onClick={() => setShowAllPast((v) => !v)}>
                  {showAllPast ? 'Pokaži manj' : `Pokaži več (še ${past.length - PAST_VISIBLE})`}
                </Button>
              </CardFooter>
            ) : null
          }
        >
          {past.length === 0 ? (
            <EmptyState compact icon={History} title="Preteklih in preklicanih terminov še ni." />
          ) : (
            <ul className="divide-y divide-border">
              {pastShown.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  upcoming={false}
                  wide={wide}
                  busy={false}
                  onConfirm={handleConfirm}
                  onAskCancel={setToCancel}
                />
              ))}
            </ul>
          )}
        </Section>
      </div>
    );
  }

  return (
    <div ref={boxRef}>
      <PageHeader
        className="mb-4"
        title="Rezervacije"
        description="Termini, ki jih je dogovoril agent. Prihajajoči so na vrhu."
      />
      {settings.loading ? (
        <Card tone="quiet" className="mb-6 px-4 py-3" aria-hidden="true">
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ) : mode ? (
        <Card tone="quiet" className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm text-fg-muted">
          <CalendarClock size={16} className="shrink-0 text-fg-subtle" aria-hidden="true" />
          <p className="min-w-0 flex-1 basis-64">
            Način rezervacije: <span className="font-medium text-fg">{mode.label}</span>. {mode.description}
          </p>
          <Link to="/app/termini" className={LINK}>
            Spremeni v Terminih
          </Link>
        </Card>
      ) : null}
      {body}
      <ConfirmDialog
        open={toCancel !== null}
        onOpenChange={(open) => {
          if (!open) setToCancel(null);
        }}
        tone="danger"
        title={toCancel?.status === 'requested' ? 'Zavrnem povpraševanje za termin?' : 'Odpovem potrjeni termin?'}
        description={toCancel ? cancelDescription(toCancel) : undefined}
        confirmLabel={toCancel?.status === 'requested' ? 'Zavrni termin' : 'Odpovej termin'}
        onConfirm={handleCancel}
      />
    </div>
  );
}

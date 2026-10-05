import { ButtonLink, Card, CardBody, CardFooter, CardHeader, StatusPill } from '@/components/ui';
import * as api from '@/data/api';
import { formatRelativeDateTime } from '@/data/format';
import { BOOKING_MODE, BOOKING_STATUS } from '@/data/labels';
import { Detail, Details, Pending } from './parts';

function CalendarState({
  connection,
  mode,
}: {
  connection: api.CalendarConnection | null;
  mode: api.BookingMode;
}) {
  if (connection?.status === 'connected') {
    return (
      <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
        <StatusPill tone="success">Povezan</StatusPill>
        <span className="min-w-0 max-w-full truncate font-mono text-sm">{connection.connected_email}</span>
      </span>
    );
  }
  if (connection) {
    const expired = connection.status === 'expired';
    return (
      <span className="flex min-w-0 flex-col gap-1">
        <span>
          <StatusPill tone={expired ? 'warning' : 'danger'}>{expired ? 'Povezava je potekla' : 'Napaka povezave'}</StatusPill>
        </span>
        <span className="text-sm text-fg-muted">Koledar povežite znova pod Termini.</span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span>
        <StatusPill tone={mode === 'auto' ? 'danger' : 'neutral'}>Ni povezan</StatusPill>
      </span>
      <span className="text-sm text-fg-muted">
        {mode === 'auto'
          ? 'Samodejna rezervacija brez koledarja ne more delovati.'
          : 'Za povpraševanja koledar ni potreben.'}
      </span>
    </span>
  );
}

/** "Termini": how the agent handles appointments, calendar state, the next booking. */
export function BookingCard() {
  const settings = api.useQuery(() => api.getBookingSettings(), []);
  const calendar = api.useQuery(() => api.getCalendarConnection(), []);
  const bookings = api.useQuery(() => api.listBookings(), []);

  const next = bookings.data?.find((b) => b.status !== 'cancelled' && new Date(b.start).getTime() >= Date.now());

  return (
    <Card>
      <CardHeader
        title="Termini"
        description="Kaj agent naredi, ko obiskovalec želi termin."
        action={
          settings.data ? (
            <StatusPill tone={settings.data.mode === 'auto' ? 'accent' : 'neutral'}>
              {BOOKING_MODE[settings.data.mode].label}
            </StatusPill>
          ) : null
        }
      />
      {settings.data && calendar.data !== undefined && bookings.data ? (
        <>
          <CardBody className="flex flex-col gap-4">
            <Details>
              <Detail label="Koledar">
                <CalendarState connection={calendar.data} mode={settings.data.mode} />
              </Detail>
              <Detail label="Naslednji termin">
                {next ? (
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="font-medium">{formatRelativeDateTime(next.start)}</span>
                      <StatusPill tone={BOOKING_STATUS[next.status].tone}>{BOOKING_STATUS[next.status].label}</StatusPill>
                    </span>
                    <span className="truncate text-sm text-fg-muted">{next.customer_name}</span>
                  </span>
                ) : (
                  <span className="text-fg-muted">Ni prihajajočih terminov.</span>
                )}
              </Detail>
            </Details>
          </CardBody>
          <CardFooter>
            <ButtonLink to="/app/termini" size="sm">
              Uredi termine
            </ButtonLink>
          </CardFooter>
        </>
      ) : (
        <Pending queries={[settings, calendar, bookings]} lines={2} />
      )}
    </Card>
  );
}

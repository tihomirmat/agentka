import { forwardRef, useState } from 'react';
import { CalendarPlus, Unplug } from 'lucide-react';
import * as api from '@/data/api';
import { formatDate } from '@/data/format';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  CopyValue,
  Field,
  Select,
  SkeletonText,
  StatusPill,
  useToast,
} from '@/components/ui';
import type { LabelTone } from '@/data/labels';
import { ResultNote } from '../screen-kit/ResultNote';

const CONNECTION_STATE: Record<api.CalendarConnection['status'], { label: string; tone: LabelTone }> = {
  connected: { label: 'Povezan', tone: 'success' },
  expired: { label: 'Povezava je potekla', tone: 'warning' },
  error: { label: 'Napaka pri povezavi', tone: 'danger' },
};

interface CalendarCardProps {
  loading: boolean;
  connection: api.CalendarConnection | null | undefined;
  /** the calendar that receives bookings (saved value plus unsaved edit) */
  calendarId: string | null;
  onCalendarChange: (id: string) => void;
  /** called after the calendar was disconnected, so the page can drop edits the api just changed */
  onDisconnected: () => void;
}

/** Google Calendar connection: state, connected address, calendar picker, connect and disconnect. */
export const CalendarCard = forwardRef<HTMLButtonElement, CalendarCardProps>(function CalendarCard(
  { loading, connection, calendarId, onCalendarChange, onDisconnected },
  connectRef,
) {
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const connect = api.useAction(api.connectCalendar, {
    onError: (m) => {
      setProblem(m);
      toast.error(m);
    },
  });
  const disconnect = api.useAction(api.disconnectCalendar, {
    onError: (m) => {
      setProblem(m);
      toast.error(m);
    },
  });

  async function runConnect() {
    setNote(null);
    setProblem(null);
    const r = await connect.run();
    if (r) {
      setNote(r.message);
      if (r.simulated) toast.info(r.message);
      else toast.success(r.message);
    }
  }

  async function runDisconnect() {
    setNote(null);
    setProblem(null);
    const r = await disconnect.run();
    if (r) {
      onDisconnected();
      setNote(r.message);
      if (r.simulated) toast.info(r.message);
      else toast.success(r.message);
    }
  }

  const state = connection ? CONNECTION_STATE[connection.status] : null;

  return (
    <Card>
      <CardHeader
        title="Google Koledar"
        description="Samodejna rezervacija potrebuje koledar: agent iz njega prebere, kdaj ste prosti, in vanj vpiše termin."
        action={
          loading ? null : state ? (
            <StatusPill tone={state.tone}>{state.label}</StatusPill>
          ) : (
            <StatusPill tone="neutral">Ni povezan</StatusPill>
          )
        }
      />
      <CardBody className="flex flex-col gap-4">
        {loading ? (
          <SkeletonText lines={3} />
        ) : connection ? (
          <>
            <dl className="grid min-w-0 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-sm font-medium text-fg">Povezan račun</dt>
                <dd className="mt-1 min-w-0">
                  <CopyValue value={connection.connected_email} copyLabel="Kopiraj e-naslov" />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-sm font-medium text-fg">Povezano od</dt>
                <dd className="mt-1 text-base text-fg-muted">{formatDate(connection.connected_at)}</dd>
              </div>
            </dl>
            {connection.status !== 'connected' ? (
              <ResultNote
                tone="danger"
                message="Agent trenutno ne more brati koledarja. Povežite Google Koledar znova, da bo samodejna rezervacija spet delovala."
              />
            ) : null}
            <Field
              label="Koledar za rezervacije"
              hint="V ta koledar agent vpiše nove termine."
              className="max-w-sm"
            >
              <Select
                value={calendarId ?? undefined}
                placeholder="Izberite koledar"
                options={connection.calendars.map((c) => ({ value: c.id, label: c.name }))}
                onValueChange={onCalendarChange}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              {connection.status !== 'connected' ? (
                <Button ref={connectRef} icon={CalendarPlus} loading={connect.pending} onClick={() => void runConnect()}>
                  Poveži Google Koledar
                </Button>
              ) : null}
              <Button
                icon={Unplug}
                loading={disconnect.pending}
                onClick={() => setConfirmOpen(true)}
              >
                Prekini povezavo
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-base text-fg-muted">
              Koledar ni povezan. Agent zato zapisuje samo želje za termin, vi pa jih potrdite po e-pošti.
            </p>
            <div>
              <Button ref={connectRef} icon={CalendarPlus} loading={connect.pending} onClick={() => void runConnect()}>
                Poveži Google Koledar
              </Button>
            </div>
          </>
        )}
        <ResultNote message={note} />
        <ResultNote tone="danger" message={problem} />
      </CardBody>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Prekinem povezavo z Google Koledarjem?"
        description="Agent bo spet samo zapisoval želje za termin, vi jih potrdite po e-pošti. Način se vrne na »Povpraševanje«. Povezavo lahko kadar koli znova vzpostavite."
        confirmLabel="Prekini povezavo"
        onConfirm={runDisconnect}
      />
    </Card>
  );
});

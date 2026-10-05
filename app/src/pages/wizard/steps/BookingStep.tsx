import { useState } from 'react';
import { CalendarCheck, CalendarPlus, Inbox } from 'lucide-react';
import { WizardStep } from '@/components/layout';
import {
  Button,
  Card,
  CardBody,
  ChoiceCard,
  Field,
  Notice,
  Select,
  SkeletonText,
  StatusPill,
  Switch,
  TimeSelect,
  useToast,
} from '@/components/ui';
import * as api from '@/data/api';
import { BOOKING_MODE, WEEKDAYS } from '@/data/labels';
import { cn } from '@/lib/cn';
import { LENGTH_CHOICES, messageOf, type BookingDraft, type StepNav } from '../draft';

interface Props extends StepNav {
  draft: BookingDraft;
  onChange: (patch: Partial<BookingDraft>) => void;
}

type HourProblems = Partial<Record<api.Weekday, string>>;

function checkHours(hours: api.WorkingHours): { days: HourProblems; general: string | null } {
  const days: HourProblems = {};
  for (const d of WEEKDAYS) {
    const day = hours[d.key];
    if (!day.open) continue;
    if (!day.from || !day.to) days[d.key] = 'Vpišite začetek in konec delovnega časa.';
    else if (day.from >= day.to) days[d.key] = 'Konec mora biti po začetku. Primer: od 08:00 do 16:00.';
  }
  const general = WEEKDAYS.some((d) => hours[d.key].open) ? null : 'Izberite vsaj en delovni dan.';
  return { days, general };
}

export function BookingStep({ draft, onChange, onBack, onSkip, onDone }: Props) {
  const toast = useToast();
  const calendar = api.useQuery(() => api.getCalendarConnection(), []);
  const [connectNote, setConnectNote] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [problems, setProblems] = useState<{ days: HourProblems; general: string | null }>({ days: {}, general: null });
  const [busy, setBusy] = useState(false);
  const connect = api.useAction(api.connectCalendar, { onError: toast.error });

  const connection = calendar.data;
  const connected = connection?.status === 'connected';
  const auto = draft.mode === 'auto';

  async function runConnect() {
    setConnectNote(null);
    const result = await connect.run();
    if (!result) return;
    // A simulated outside action: its result stays next to the button, no toast.
    setConnectNote(result.message);
    setBlocked(null);
  }

  function setDay(key: api.Weekday, patch: Partial<api.WorkingDay>) {
    onChange({ hours: { ...draft.hours, [key]: { ...draft.hours[key], ...patch } } });
    setProblems({ days: {}, general: null });
  }

  async function next() {
    setBlocked(null);
    if (auto && connected) {
      const found = checkHours(draft.hours);
      setProblems(found);
      if (found.general || Object.keys(found.days).length > 0) return;
    }
    setBusy(true);
    try {
      await api.updateBookingSettings(
        auto
          ? { mode: 'auto', working_hours: draft.hours, appointment_length_min: draft.lengthMin }
          : { mode: 'request' },
      );
      await onDone();
    } catch (e) {
      const message = messageOf(e);
      if (auto && !connected) {
        // The api refuses automatic booking without a calendar: stay on Povpraševanje and say why.
        setBlocked(message);
        onChange({ mode: 'request' });
      } else {
        toast.error(message);
      }
    } finally {
      setBusy(false);
    }
  }

  const lengthOptions = [...new Set([...LENGTH_CHOICES, draft.lengthMin])]
    .sort((a, b) => a - b)
    .map((n) => ({ value: String(n), label: `${n} minut` }));

  return (
    <WizardStep
      title="Dogovarjanje terminov"
      description="Od izbire je odvisno, ali termin potrdite vi ali ga agent sam vpiše v vaš koledar."
      back={
        <Button variant="ghost" onClick={onBack}>
          Nazaj
        </Button>
      }
      skip={
        <Button variant="ghost" onClick={onSkip}>
          Preskoči
        </Button>
      }
      next={
        <Button variant="primary" loading={busy} onClick={next}>
          Naprej
        </Button>
      }
    >
      <div className="flex min-w-0 flex-col gap-6">
        <fieldset className="min-w-0">
          <legend className="sr-only">Način dogovarjanja terminov</legend>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <ChoiceCard
              name="wizard-mode"
              value="request"
              checked={!auto}
              onSelect={() => onChange({ mode: 'request' })}
              icon={Inbox}
              title={BOOKING_MODE.request.label}
              description={BOOKING_MODE.request.description}
              className="p-5"
            />
            <ChoiceCard
              name="wizard-mode"
              value="auto"
              checked={auto}
              onSelect={() => {
                setBlocked(null);
                onChange({ mode: 'auto' });
              }}
              icon={CalendarCheck}
              title={BOOKING_MODE.auto.label}
              description={BOOKING_MODE.auto.description}
              className="p-5"
            />
          </div>
        </fieldset>

        {blocked ? (
          <Notice tone="warning" title={blocked}>
            Izbran je ostal način »{BOOKING_MODE.request.label}«. Povežite koledar in znova izberite samodejno
            rezervacijo ali pritisnite »Naprej« in nadaljujte s povpraševanji.
          </Notice>
        ) : null}

        {auto ? (
          <section aria-labelledby="wizard-calendar-title" className="min-w-0">
            <h2 id="wizard-calendar-title" className="text-md font-semibold text-fg">
              Google Koledar
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Agent iz koledarja prebere, kdaj ste prosti, in vanj vpiše dogovorjene termine.
            </p>
            <Card className="mt-3">
              <CardBody>
                {calendar.data === undefined && !calendar.error ? (
                  <SkeletonText lines={2} />
                ) : connected && connection ? (
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                      <StatusPill tone="success">Koledar povezan</StatusPill>
                      <span className="min-w-0 truncate font-mono text-sm text-fg">{connection.connected_email}</span>
                    </div>
                    {connectNote ? <Notice size="sm" tone="neutral">{connectNote}</Notice> : null}
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-col items-start gap-3">
                    <p className="text-base text-fg">
                      {connection
                        ? 'Povezava z Google Koledarjem ni več veljavna. Povežite koledar znova.'
                        : 'Koledar še ni povezan. Brez njega samodejna rezervacija ne more delovati.'}
                    </p>
                    <Button icon={CalendarPlus} loading={connect.pending} onClick={runConnect}>
                      Poveži Google Koledar
                    </Button>
                    {calendar.error ? <p className="text-sm text-danger">{calendar.error}</p> : null}
                  </div>
                )}
              </CardBody>
            </Card>
          </section>
        ) : null}

        {auto && connected ? (
          <>
            <section aria-labelledby="wizard-hours-title" className="min-w-0">
              <h2 id="wizard-hours-title" className="text-md font-semibold text-fg">
                Delovni čas
              </h2>
              <p className="mt-1 text-sm text-fg-muted">Agent ponudi proste termine samo znotraj teh ur.</p>
              <Card className="mt-3">
                <ul>
                  {WEEKDAYS.map((d) => {
                    const day = draft.hours[d.key];
                    const problem = problems.days[d.key];
                    const state = day.open ? 'odprto' : 'zaprto';
                    return (
                      <li key={d.key} className="border-b border-border px-4 py-2.5 last:border-b-0 sm:px-5">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
                          <div className="flex w-24 shrink-0 items-center gap-2.5 sm:w-52 sm:gap-3">
                            <Switch
                              checked={day.open}
                              onCheckedChange={(open) => setDay(d.key, { open })}
                              aria-label={`${d.label}: ${state}`}
                            />
                            <span className={cn('text-base font-medium', day.open ? 'text-fg' : 'text-fg-muted')}>
                              <span className="sm:hidden" aria-hidden="true">
                                {d.short}
                              </span>
                              <span className="sr-only sm:not-sr-only">{d.label}</span>
                            </span>
                            <span className="hidden text-sm text-fg-subtle sm:inline" aria-hidden="true">
                              {state}
                            </span>
                          </div>
                          {day.open ? (
                            <div className="flex items-center gap-2">
                              <TimeSelect
                                aria-label={`${d.label}, začetek`}
                                aria-invalid={problem ? true : undefined}
                                aria-describedby={problem ? `wizard-hours-${d.key}-error` : undefined}
                                value={day.from}
                                onValueChange={(from) => setDay(d.key, { from })}
                                className="w-[6.25rem]"
                              />
                              <span aria-hidden="true" className="text-fg-subtle">
                                –
                              </span>
                              <TimeSelect
                                aria-label={`${d.label}, konec`}
                                aria-invalid={problem ? true : undefined}
                                aria-describedby={problem ? `wizard-hours-${d.key}-error` : undefined}
                                value={day.to}
                                onValueChange={(to) => setDay(d.key, { to })}
                                className="w-[6.25rem]"
                              />
                            </div>
                          ) : (
                            <span className="min-w-0 text-sm text-fg-subtle">Agent ta dan ne ponuja terminov.</span>
                          )}
                        </div>
                        {problem ? (
                          <p id={`wizard-hours-${d.key}-error`} role="alert" className="mt-1.5 text-sm text-danger">
                            {d.label}: {problem}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </Card>
              {problems.general ? (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {problems.general}
                </p>
              ) : null}
            </section>

            <Field className="sm:max-w-xs" label="Dolžina termina" hint="Toliko časa agent rezervira za en termin.">
              <Select
                value={String(draft.lengthMin)}
                onValueChange={(v) => onChange({ lengthMin: Number(v) })}
                options={lengthOptions}
              />
            </Field>
          </>
        ) : null}
      </div>
    </WizardStep>
  );
}

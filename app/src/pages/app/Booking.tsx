import { useRef, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import * as api from '@/data/api';
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  SaveBar,
  Skeleton,
  SkeletonText,
  useDraft,
  useToast,
} from '@/components/ui';
import { CalendarCard } from './booking/CalendarCard';
import { HoursCard, invalidDays } from './booking/HoursCard';
import { ModeCard } from './booking/ModeCard';
import { PreviewCard } from './booking/PreviewCard';
import { RulesCard, ruleErrors } from './booking/RulesCard';

/** Termini: how the agent handles appointments and when the business is available. */
export default function Booking() {
  const settings = api.useQuery(() => api.getBookingSettings(), []);
  const connection = api.useQuery(() => api.getCalendarConnection(), []);
  const agent = api.useQuery(() => api.getAgent(), []);
  const toast = useToast();

  const draft = useDraft<api.BookingSettings>(settings.data);
  const save = api.useAction(api.updateBookingSettings);
  const [blocked, setBlocked] = useState<string | null>(null);
  const connectRef = useRef<HTMLButtonElement>(null);
  const calendarAnchor = useRef<HTMLDivElement>(null);

  const value = draft.value;
  const conn = connection.data;

  if (settings.error && !value && !settings.loading) {
    return (
      <>
        <PageHeader title="Termini" description="Kako agent dogovarja termine in kdaj ste na voljo." />
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={settings.error}
            action={<Button onClick={settings.reload}>Poskusi znova</Button>}
          />
        </Card>
      </>
    );
  }

  if (!value) {
    return (
      <>
        <PageHeader title="Termini" description="Kako agent dogovarja termine in kdaj ste na voljo." />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" role="status" aria-label="Nalaganje">
          <div className="flex min-w-0 flex-col gap-6">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardBody className="flex flex-col gap-3">
                  <Skeleton className="h-5 w-48" />
                  <SkeletonText lines={3} />
                </CardBody>
              </Card>
            ))}
          </div>
          <Skeleton className="hidden h-64 w-full rounded-lg lg:block" />
        </div>
      </>
    );
  }

  const hourErrors = invalidDays(value.working_hours);
  const rules = ruleErrors(value);
  const rulesInvalid = Boolean(rules.min_notice_hours ?? rules.max_days_ahead);
  const invalid = hourErrors.length > 0 || rulesInvalid;
  const blockedReason = invalid ? 'Popravite polja, označena z napako, da lahko shranite.' : undefined;

  async function selectMode(mode: api.BookingMode) {
    if (!value || mode === value.mode || conn === undefined) return;
    if (mode === 'auto' && !conn) {
      // The api itself refuses automatic booking without a calendar; show its sentence as it is.
      // It throws before changing anything, so this call cannot save the mode by accident.
      const refused = await api.updateBookingSettings({ mode: 'auto' }).then(
        () => null,
        (e: unknown) => (e instanceof Error ? e.message : 'Samodejne rezervacije ni mogoče vklopiti.'),
      );
      if (refused) {
        setBlocked(refused);
        return;
      }
    }
    setBlocked(null);
    draft.patch({ mode });
  }

  function goToCalendar() {
    calendarAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => connectRef.current?.focus({ preventScroll: true }), 350);
  }

  async function submit() {
    if (invalid) return;
    const saved = await save.run(draft.changes);
    if (saved) {
      draft.commit(saved);
      setBlocked(null);
      toast.success('Nastavitve terminov so shranjene.');
    }
  }

  return (
    <>
      <PageHeader title="Termini" description="Kako agent dogovarja termine in kdaj ste na voljo." />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <ModeCard
            value={value.mode}
            saved={draft.server?.mode ?? value.mode}
            calendarEmail={conn ? conn.connected_email : null}
            onSelect={(m) => void selectMode(m)}
            blocked={conn ? null : blocked}
            onGoToCalendar={goToCalendar}
          />

          <div ref={calendarAnchor} className="scroll-mt-6">
            <CalendarCard
              ref={connectRef}
              loading={connection.loading}
              connection={conn}
              calendarId={value.calendar_id}
              onCalendarChange={(id) => draft.patch({ calendar_id: id })}
              onDisconnected={() => {
                // The api has just switched the mode back and cleared the calendar: drop edits of those two.
                draft.drop(['mode', 'calendar_id']);
                setBlocked(null);
              }}
            />
          </div>

          <HoursCard hours={value.working_hours} onChange={(next) => draft.patch({ working_hours: next })} />

          <RulesCard value={value} resetKey={draft.version} onChange={draft.patch} />
        </div>

        <div className="min-w-0 self-start lg:sticky-top lg:top-6">
          <PreviewCard
            settings={value}
            mode={value.mode}
            agentName={agent.data?.name ?? 'Agent'}
            invalid={rulesInvalid}
          />
        </div>
      </div>

      <SaveBar
        dirty={draft.dirty}
        saving={save.pending}
        canSave={!invalid}
        blockedReason={blockedReason}
        error={save.error}
        onSave={() => void submit()}
        onDiscard={() => {
          draft.discard();
          setBlocked(null);
        }}
      />
    </>
  );
}

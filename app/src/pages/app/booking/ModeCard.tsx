import { CalendarCheck, CalendarOff, ClipboardList, type LucideIcon } from 'lucide-react';
import { BOOKING_MODE } from '@/data/labels';
import type { BookingMode } from '@/data/types';
import { Card, CardBody, CardHeader, ChoiceCard, Notice, StatusPill } from '@/components/ui';

const ICONS: Record<BookingMode, LucideIcon> = { request: ClipboardList, auto: CalendarCheck };
const MODES: BookingMode[] = ['request', 'auto'];

interface ModeCardProps {
  /** the mode shown as chosen (saved value plus unsaved edit) */
  value: BookingMode;
  /** the mode that is saved and in force now */
  saved: BookingMode;
  calendarEmail: string | null;
  onSelect: (mode: BookingMode) => void;
  /** the api's sentence when switching to automatic booking was refused */
  blocked: string | null;
  onGoToCalendar: () => void;
}

/** Two large selectable cards: the way the agent handles an appointment wish. */
export function ModeCard({ value, saved, calendarEmail, onSelect, blocked, onGoToCalendar }: ModeCardProps) {
  return (
    <Card>
      <CardHeader
        title="Način dogovarjanja terminov"
        description="Kaj agent naredi, ko obiskovalec želi termin."
      />
      <CardBody className="flex flex-col gap-4">
        <fieldset className="min-w-0">
          <legend className="sr-only">Način dogovarjanja terminov</legend>
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {MODES.map((mode) => {
              const info = BOOKING_MODE[mode];
              const showsCalendar = mode === 'auto';
              return (
                <ChoiceCard
                  key={mode}
                  name="nacin-terminov"
                  value={mode}
                  checked={value === mode}
                  onSelect={() => onSelect(mode)}
                  icon={ICONS[mode]}
                  title={info.label}
                  description={info.description}
                  footer={
                    saved === mode || showsCalendar ? (
                      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                        {saved === mode ? <StatusPill tone="success">Trenutno velja</StatusPill> : null}
                        {showsCalendar ? (
                          calendarEmail ? (
                            <span className="min-w-0 truncate">Koledar: {calendarEmail}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarOff size={14} aria-hidden="true" />
                              Potrebuje povezan Google Koledar
                            </span>
                          )
                        ) : null}
                      </span>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        </fieldset>

        {blocked ? (
          <Notice
            size="sm"
            tone="warning"
            action={
              <button
                type="button"
                onClick={onGoToCalendar}
                className="tap rounded text-sm font-medium text-accent underline underline-offset-2 hover:no-underline"
              >
                Pojdite na gumb »Poveži Google Koledar«
              </button>
            }
          >
            {blocked}
          </Notice>
        ) : null}
      </CardBody>
    </Card>
  );
}

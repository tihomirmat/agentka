import { CalendarCheck, CalendarOff, ClipboardList, type LucideIcon } from 'lucide-react';
import { BOOKING_MODE } from '@/data/labels';
import type { BookingMode } from '@/data/types';
import { Card, CardBody, CardHeader, StatusPill } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ResultNote } from '../screen-kit/ResultNote';

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
        description="Kaj agent stori, ko obiskovalec želi termin."
      />
      <CardBody className="flex flex-col gap-4">
        <fieldset className="min-w-0">
          <legend className="sr-only">Način dogovarjanja terminov</legend>
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {MODES.map((mode) => {
              const Icon = ICONS[mode];
              const selected = value === mode;
              const info = BOOKING_MODE[mode];
              return (
                <label key={mode} className="relative flex min-w-0 cursor-pointer">
                  <input
                    type="radio"
                    name="nacin-terminov"
                    className="peer sr-only"
                    checked={selected}
                    onChange={() => onSelect(mode)}
                  />
                  <span
                    className={cn(
                      'flex w-full min-w-0 flex-col gap-2.5 rounded-lg border p-4 transition-colors duration-100',
                      'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                      selected
                        ? 'border-accent bg-accent-soft'
                        : 'border-border-strong bg-surface hover:bg-surface-2',
                    )}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded',
                            selected ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-fg-muted',
                          )}
                        >
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <span className={cn('text-md font-semibold', selected ? 'text-accent-soft-fg' : 'text-fg')}>
                          {info.label}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-1 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border',
                          selected ? 'border-accent bg-accent' : 'border-border-strong bg-surface',
                        )}
                      >
                        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-accent-fg" /> : null}
                      </span>
                    </span>
                    <span className={cn('text-base', selected ? 'text-accent-soft-fg' : 'text-fg-muted')}>
                      {info.description}
                    </span>
                    <span className="mt-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
                      {saved === mode ? <StatusPill tone="success">Trenutno velja</StatusPill> : null}
                      {mode === 'auto' ? (
                        calendarEmail ? (
                          <span className="min-w-0 truncate text-sm text-fg-muted">Koledar: {calendarEmail}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
                            <CalendarOff size={14} aria-hidden="true" />
                            Potrebuje povezan Google Koledar
                          </span>
                        )
                      ) : null}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {blocked ? (
          <div className="flex flex-col gap-2">
            <ResultNote tone="danger" message={blocked} />
            <div>
              <button
                type="button"
                onClick={onGoToCalendar}
                className="rounded text-sm font-medium text-accent underline underline-offset-2 hover:no-underline"
              >
                Pojdi na gumb »Poveži Google Koledar«
              </button>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

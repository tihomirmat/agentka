import { CircleAlert, Copy } from 'lucide-react';
import { WEEKDAYS } from '@/data/labels';
import type { Weekday, WorkingDay, WorkingHours } from '@/data/types';
import { Button, Card, CardHeader, deepEqual, Switch, TimeSelect } from '@/components/ui';
import { cn } from '@/lib/cn';
import { isValidDay } from './slots';

const WEEKDAY_KEYS = WEEKDAYS.filter((d) => ['tue', 'wed', 'thu', 'fri'].includes(d.key)).map((d) => d.key);

/** Which days have a time range that does not make sense (start not before end). */
export function invalidDays(hours: WorkingHours): Weekday[] {
  return WEEKDAYS.filter((d) => hours[d.key].open && !isValidDay(hours[d.key].from, hours[d.key].to)).map(
    (d) => d.key,
  );
}

interface HoursCardProps {
  hours: WorkingHours;
  onChange: (next: WorkingHours) => void;
}

/** Working hours per weekday: open or closed switch and a from–to range, always in 24-hour times. */
export function HoursCard({ hours, onChange }: HoursCardProps) {
  const bad = new Set(invalidDays(hours));

  function setDay(key: Weekday, change: Partial<WorkingDay>) {
    onChange({ ...hours, [key]: { ...hours[key], ...change } });
  }

  const monday = hours.mon;
  const alreadyCopied = WEEKDAY_KEYS.every((k) => deepEqual(hours[k], monday));

  function copyMonday() {
    const next: WorkingHours = { ...hours };
    for (const k of WEEKDAY_KEYS) next[k] = { ...monday };
    onChange(next);
  }

  const copyButton = (
    <Button
      size="sm"
      icon={Copy}
      disabledReason={alreadyCopied && 'Torek do petek že imajo enak čas kot ponedeljek.'}
      onClick={copyMonday}
    >
      Uporabi ponedeljkov čas za vse delovne dni
    </Button>
  );

  return (
    <Card>
      {/* On a phone the button sits on a line of its own: next to the title it would squeeze the text. */}
      <CardHeader
        title="Delovni čas"
        description="Agent ponudi termine samo v urah, ko je dan odprt."
        action={<div className="hidden sm:block">{copyButton}</div>}
        divider
      />
      <div className="border-b border-border px-4 py-3 sm:hidden">{copyButton}</div>
      <ul>
        {WEEKDAYS.map(({ key, label, short }) => {
          const day = hours[key];
          const invalid = bad.has(key);
          return (
            <li key={key} className="border-b border-border px-4 py-2.5 last:border-b-0 sm:px-5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
                <div className="flex w-20 shrink-0 items-center gap-2.5 sm:w-44 sm:gap-3">
                  <Switch
                    aria-label={`${label}: ${day.open ? 'odprto' : 'zaprto'}`}
                    checked={day.open}
                    onCheckedChange={(open) => setDay(key, { open })}
                  />
                  <span className={cn('text-base font-medium', day.open ? 'text-fg' : 'text-fg-muted')}>
                    <span className="sm:hidden" aria-hidden="true">
                      {short}
                    </span>
                    <span className="sr-only sm:not-sr-only">{label}</span>
                  </span>
                </div>
                {day.open ? (
                  <div className="flex items-center gap-2">
                    <TimeSelect
                      aria-label={`${label}: začetek`}
                      aria-invalid={invalid || undefined}
                      aria-describedby={invalid ? `hours-${key}-error` : undefined}
                      value={day.from}
                      onValueChange={(from) => setDay(key, { from })}
                      className="w-[6.25rem]"
                    />
                    <span aria-hidden="true" className="text-fg-subtle">
                      –
                    </span>
                    <TimeSelect
                      aria-label={`${label}: konec`}
                      aria-invalid={invalid || undefined}
                      aria-describedby={invalid ? `hours-${key}-error` : undefined}
                      value={day.to}
                      onValueChange={(to) => setDay(key, { to })}
                      className="w-[6.25rem]"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-fg-subtle">Zaprto</span>
                )}
              </div>
              {invalid ? (
                <p id={`hours-${key}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
                  <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                  <span>
                    {label}: začetek mora biti pred koncem. Primer: od 08:00 do 16:00.
                  </span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

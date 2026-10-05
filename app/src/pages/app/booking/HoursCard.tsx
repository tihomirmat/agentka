import { CircleAlert, Copy } from 'lucide-react';
import { WEEKDAYS } from '@/data/labels';
import type { Weekday, WorkingDay, WorkingHours } from '@/data/types';
import { Button, Card, CardHeader, Input, Switch } from '@/components/ui';
import { cn } from '@/lib/cn';
import { deepEqual } from '../screen-kit/useDraft';
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

/** Working hours per weekday: open or closed switch and a from–to time range. */
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
    <Button size="sm" icon={Copy} disabled={alreadyCopied} onClick={copyMonday}>
      Kopiraj ponedeljek na delovne dni
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
        {WEEKDAYS.map(({ key, label }) => {
          const day = hours[key];
          const invalid = bad.has(key);
          const errorId = `delovni-cas-${key}-napaka`;
          return (
            <li
              key={key}
              className="grid min-w-0 gap-x-4 gap-y-2 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Switch
                  aria-label={`${label}: ${day.open ? 'odprto' : 'zaprto'}`}
                  checked={day.open}
                  onCheckedChange={(open) => setDay(key, { open })}
                />
                <span className={cn('text-base font-medium', day.open ? 'text-fg' : 'text-fg-muted')}>{label}</span>
                <span className="text-sm text-fg-subtle" aria-hidden="true">
                  {day.open ? 'odprto' : 'zaprto'}
                </span>
              </div>
              <div className="min-w-0">
                {day.open ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-fg-muted">od</span>
                    <Input
                      type="time"
                      aria-label={`${label}, začetek`}
                      aria-describedby={invalid ? errorId : undefined}
                      aria-invalid={invalid || undefined}
                      className="w-32"
                      value={day.from}
                      onChange={(e) => setDay(key, { from: e.target.value })}
                    />
                    <span className="text-sm text-fg-muted">do</span>
                    <Input
                      type="time"
                      aria-label={`${label}, konec`}
                      aria-describedby={invalid ? errorId : undefined}
                      aria-invalid={invalid || undefined}
                      className="w-32"
                      value={day.to}
                      onChange={(e) => setDay(key, { to: e.target.value })}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-fg-subtle">Agent ta dan ne ponuja terminov.</p>
                )}
                {invalid ? (
                  <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
                    <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                    <span>Konec mora biti po začetku. Primer: od 08:00 do 16:00.</span>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

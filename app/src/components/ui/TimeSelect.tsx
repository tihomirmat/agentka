import { clockToMinutes, minutesToClock } from '@/data/format';
import { Select } from './Select';

export interface TimeSelectProps {
  /** "HH:MM", 24-hour */
  value: string;
  onValueChange: (value: string) => void;
  /** minutes between two offered times. Default 15. */
  step?: number;
  /** first offered time, "HH:MM". Default "00:00". */
  min?: string;
  /** last offered time, "HH:MM". Default: the last step before midnight ("23:45" for step 15). */
  max?: string;
  disabled?: boolean;
  id?: string;
  /** needed when the select is not inside a <Field> ("Ponedeljek, od") */
  'aria-label'?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * THE way to enter a time of day: a list of 24-hour times ("08:00", "16:30"). Never use
 * <input type="time"> — browsers draw it by the device's habits and may show "04:00 PM".
 * A value that is not on the step grid (saved earlier with another step) stays selectable.
 */
export function TimeSelect({ value, onValueChange, step = 15, min = '00:00', max, ...rest }: TimeSelectProps) {
  const every = Math.max(1, Math.round(step));
  const from = clockToMinutes(min);
  const to = max ? clockToMinutes(max) : 24 * 60 - 1;
  const times: number[] = [];
  for (let m = from; m <= to; m += every) times.push(m);
  const current = /^\d{1,2}:\d{2}$/.test(value) ? clockToMinutes(value) : null;
  if (current !== null && !times.includes(current)) {
    times.push(current);
    times.sort((a, b) => a - b);
  }
  return (
    <Select
      value={current === null ? undefined : minutesToClock(current)}
      onValueChange={onValueChange}
      options={times.map((m) => ({ value: minutesToClock(m), label: minutesToClock(m) }))}
      placeholder="Izberite uro"
      {...rest}
    />
  );
}

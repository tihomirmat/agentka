import type { BookingSettings } from '@/data/types';
import { Card, CardBody, CardHeader, Field, Input, Select } from '@/components/ui';

const LENGTHS = [15, 30, 45, 60];
const BUFFERS = [0, 5, 10, 15];

export const MAX_DAYS_LIMIT = 365;

export interface RuleErrors {
  min_notice_hours?: string;
  max_days_ahead?: string;
}

/** What is wrong with the two number fields, in plain Slovenian. */
export function ruleErrors(s: Pick<BookingSettings, 'min_notice_hours' | 'max_days_ahead'>): RuleErrors {
  const errors: RuleErrors = {};
  if (!Number.isInteger(s.min_notice_hours) || s.min_notice_hours < 0) {
    errors.min_notice_hours = 'Vpišite celo število ur, na primer 4. Za rezervacijo brez roka vpišite 0.';
  }
  if (!Number.isInteger(s.max_days_ahead) || s.max_days_ahead < 1 || s.max_days_ahead > MAX_DAYS_LIMIT) {
    errors.max_days_ahead = `Vpišite število dni med 1 in ${MAX_DAYS_LIMIT}, na primer 21.`;
  } else if (!errors.min_notice_hours && s.min_notice_hours >= s.max_days_ahead * 24) {
    errors.min_notice_hours =
      'Najkrajši rok je daljši od obdobja, za katero se lahko rezervira, zato agent ne bi ponudil nobenega termina.';
  }
  return errors;
}

interface RulesCardProps {
  value: Pick<BookingSettings, 'appointment_length_min' | 'buffer_min' | 'min_notice_hours' | 'max_days_ahead'>;
  /** changes whenever the page reset the form: the number fields keep their own text and restart from it */
  resetKey: number;
  onChange: (changes: Partial<BookingSettings>) => void;
}

function options(values: number[], current: number, label: (n: number) => string) {
  return Array.from(new Set([...values, current]))
    .sort((a, b) => a - b)
    .map((n) => ({ value: String(n), label: label(n) }));
}

/** A whole number from what was typed; NaN when it is empty or not a whole number. */
function parseWhole(text: string): number {
  const t = text.trim();
  return /^\d+$/.test(t) ? Number(t) : Number.NaN;
}

/** Appointment length, break, minimum notice and days ahead — each with a one-line hint. */
export function RulesCard({ value, resetKey, onChange }: RulesCardProps) {
  const errors = ruleErrors(value);
  return (
    <Card>
      <CardHeader title="Pravila za termine" description="Po teh pravilih agent izbere termine, ki jih ponudi." />
      <CardBody className="grid min-w-0 gap-x-6 gap-y-5 md:grid-cols-2">
        <Field label="Dolžina termina" hint="Toliko časa agent rezervira za en termin.">
          <Select
            value={String(value.appointment_length_min)}
            options={options(LENGTHS, value.appointment_length_min, (n) => `${n} min`)}
            onValueChange={(v) => onChange({ appointment_length_min: Number(v) })}
          />
        </Field>
        <Field label="Odmor med termini" hint="Prosti čas po terminu, preden agent ponudi naslednjega.">
          <Select
            value={String(value.buffer_min)}
            options={options(BUFFERS, value.buffer_min, (n) => (n === 0 ? 'Brez odmora' : `${n} min`))}
            onValueChange={(v) => onChange({ buffer_min: Number(v) })}
          />
        </Field>
        <Field
          label="Najkrajši rok za rezervacijo"
          hint="Agent ponudi samo termine, do katerih je še vsaj toliko ur."
          error={errors.min_notice_hours}
        >
          <Input
            key={`notice-${resetKey}`}
            type="number"
            inputMode="numeric"
            min={0}
            suffix="ur"
            defaultValue={Number.isNaN(value.min_notice_hours) ? '' : value.min_notice_hours}
            onChange={(e) => onChange({ min_notice_hours: parseWhole(e.target.value) })}
          />
        </Field>
        <Field
          label="Največ dni vnaprej"
          hint="Agent ponudi termine največ toliko dni vnaprej."
          error={errors.max_days_ahead}
        >
          <Input
            key={`ahead-${resetKey}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_DAYS_LIMIT}
            suffix="dni"
            defaultValue={Number.isNaN(value.max_days_ahead) ? '' : value.max_days_ahead}
            onChange={(e) => onChange({ max_days_ahead: parseWhole(e.target.value) })}
          />
        </Field>
      </CardBody>
    </Card>
  );
}

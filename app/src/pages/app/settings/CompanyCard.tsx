import { Card, CardBody, CardHeader, Field, Input, Select } from '@/components/ui';
import { TIMEZONES } from '@/data/labels';
import type { FormErrors, SettingsForm } from './form';

export interface CompanyCardProps {
  form: SettingsForm;
  errors: FormErrors;
  /** the time zone saved so far; kept in the list even if it is not one of the usual ones */
  savedTimezone: string;
  onChange: (changes: Partial<SettingsForm>) => void;
}

/** Podjetje: the fields are part of the page's one draft; saving is the page's save bar. */
export function CompanyCard({ form, errors, savedTimezone, onChange }: CompanyCardProps) {
  const timezoneOptions = TIMEZONES.some((t) => t.value === savedTimezone)
    ? TIMEZONES
    : [...TIMEZONES, { value: savedTimezone, label: savedTimezone }];

  return (
    <Card>
      <CardHeader title="Podjetje" description="Ime in spletna stran podjetja ter časovni pas." />
      <CardBody>
        <div className="grid min-w-0 gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Ime podjetja" required error={errors.name}>
            <Input value={form.name} onChange={(e) => onChange({ name: e.target.value })} autoComplete="organization" />
          </Field>
          <Field
            label="Naslov spletne strani"
            optional
            error={errors.website}
            hint="Uvoz strani za agenta poženete v Virih znanja."
          >
            <Input
              prefix="https://"
              value={form.website}
              placeholder="vasepodjetje.si"
              inputMode="url"
              autoComplete="url"
              onChange={(e) => onChange({ website: e.target.value })}
            />
          </Field>
          <Field label="Časovni pas" hint="Uporabi se za delovni čas in termine.">
            <Select value={form.timezone} options={timezoneOptions} onValueChange={(timezone) => onChange({ timezone })} />
          </Field>
        </div>
      </CardBody>
    </Card>
  );
}

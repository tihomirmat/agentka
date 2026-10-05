import { Card, CardBody, CardHeader, Field, Input } from '@/components/ui';
import { domainError, normalizeDomain } from './helpers';

interface DomainCardProps {
  value: string;
  /** the domain that is saved and in force now */
  saved: string;
  onChange: (domain: string) => void;
}

/** The one website the widget is meant to run on. */
export function DomainCard({ value, saved, onChange }: DomainCardProps) {
  const error = domainError(value);
  const leaving = saved && value !== saved && !error;

  return (
    <Card>
      <CardHeader
        title="Dovoljena domena"
        description="Naslov spletne strani, na kateri bo pripomoček deloval."
      />
      <CardBody>
        <Field
          label="Domena"
          error={error}
          hint="Pripomoček bo deloval samo na tej domeni."
          warning={
            leaving
              ? `Ko shranite, bo pripomoček deloval samo na novi domeni, na »${saved}« ne več. Koda na spletni strani ostane enaka.`
              : undefined
          }
        >
          <Input
            mono
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="vasepodjetje.si"
            value={value}
            onChange={(e) => onChange(normalizeDomain(e.target.value))}
          />
        </Field>
      </CardBody>
    </Card>
  );
}

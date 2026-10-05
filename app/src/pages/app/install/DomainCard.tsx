import { TriangleAlert } from 'lucide-react';
import { Card, CardBody, CardHeader, Field, Input } from '@/components/ui';
import { domainError, normalizeDomain } from './helpers';

interface DomainCardProps {
  value: string;
  /** the domain that is saved and in force now */
  saved: string;
  onChange: (domain: string) => void;
}

/** The one website the widget is allowed to run on. */
export function DomainCard({ value, saved, onChange }: DomainCardProps) {
  const error = domainError(value);
  const leaving = saved && value !== saved && !error;

  return (
    <Card>
      <CardHeader
        title="Dovoljena domena"
        description="Naslov spletne strani, na kateri bo pripomoček deloval."
      />
      <CardBody className="flex flex-col gap-4">
        <Field
          label="Domena"
          error={error}
          hint="Pripomoček deluje samo na tej domeni, zato vaših minut ne more uporabljati nihče drug."
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
        {leaving ? (
          <p role="status" className="flex items-start gap-1.5 text-sm text-warning">
            <TriangleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
            <span>
              Ko shranite, pripomoček na »{saved}« ne bo več deloval. Koda na spletni strani ostane enaka.
            </span>
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

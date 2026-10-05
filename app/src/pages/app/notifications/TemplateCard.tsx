import { useRef, useState } from 'react';
import { CircleAlert, RotateCcw } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  Field,
  Input,
  StatusPill,
  Switch,
  Textarea,
  Tooltip,
} from '@/components/ui';
import { renderTemplate, unknownVariables, VARIABLES } from './templates';

interface TemplateCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  defaultValue: string;
  /** names of the variables offered as chips */
  variables: string[];
  /** header lines of the preview */
  subject: string;
  from: string;
  to: string | null;
  /** shown instead of the address when there is none */
  toMissing: string;
  replyTo: string | null;
  values: Record<string, string>;
  /** the preview is made from a real conversation (false: variables show their names) */
  realSample: boolean;
}

/** One e-mail: on/off, editable text with variable chips, and a rendered preview next to it. */
export function TemplateCard({
  title,
  description,
  enabled,
  onEnabledChange,
  value,
  onChange,
  defaultValue,
  variables,
  subject,
  from,
  to,
  toMissing,
  replyTo,
  values,
  realSample,
}: TemplateCardProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const unknown = unknownVariables(value);

  function insert(name: string) {
    const token = `{{${name}}}`;
    const el = areaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    onChange(value.slice(0, start) + token + value.slice(end));
    const caret = start + token.length;
    window.requestAnimationFrame(() => {
      const area = areaRef.current;
      if (!area) return;
      area.focus();
      area.setSelectionRange(caret, caret);
    });
  }

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        divider
        action={
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="text-sm text-fg-muted">
              {enabled ? 'Pošilja se' : 'Ne pošilja se'}
            </span>
            <Switch aria-label={`${title}: pošiljanje`} checked={enabled} onCheckedChange={onEnabledChange} />
          </div>
        }
      />
      <CardBody className="grid min-w-0 gap-6 pt-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Field label="Zadeva" hint="Zadeva je pri vseh sporočilih enaka in je ne morete spremeniti.">
            <Input readOnly value={subject} />
          </Field>

          <Field label="Besedilo sporočila">
            <Textarea ref={areaRef} rows={13} value={value} onChange={(e) => onChange(e.target.value)} />
          </Field>

          {unknown.length > 0 ? (
            <p role="status" className="flex items-start gap-1.5 text-sm text-warning">
              <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
              <span>
                Neznana spremenljivka {unknown.map((u) => `{{${u}}}`).join(', ')}: v sporočilu bo ostala nespremenjena.
              </span>
            </p>
          ) : null}

          <div>
            <p className="text-sm font-medium text-fg">Spremenljivke</p>
            <p className="text-sm text-fg-subtle">
              Kliknite spremenljivko, da se vstavi na mesto kurzorja. Ob pošiljanju jo zamenja podatek iz pogovora.
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {variables.map((name) => {
                const info = VARIABLES.find((v) => v.name === name);
                const token = `{{${name}}}`;
                return (
                  <li key={name}>
                    <Tooltip content={info?.hint ?? name}>
                      <button
                        type="button"
                        onClick={() => insert(name)}
                        aria-label={`Vstavi ${token}: ${info?.hint ?? name}`}
                        className="rounded-sm border border-border-strong bg-surface px-2 py-1 font-mono text-xs text-fg transition-colors hover:bg-surface-2"
                      >
                        {token}
                      </button>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <Button
              size="sm"
              variant="ghost"
              icon={RotateCcw}
              disabled={value === defaultValue}
              onClick={() => setConfirmReset(true)}
            >
              Ponastavi na privzeto besedilo
            </Button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">Predogled</p>
            {enabled ? null : <StatusPill tone="neutral">To sporočilo je izklopljeno</StatusPill>}
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface-2">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-b border-border px-4 py-3 text-sm">
              <dt className="text-fg-subtle">Od</dt>
              <dd className="min-w-0 truncate text-fg">{from}</dd>
              <dt className="text-fg-subtle">Za</dt>
              <dd className="min-w-0 truncate text-fg">{to ?? <span className="text-fg-muted">{toMissing}</span>}</dd>
              {replyTo ? (
                <>
                  <dt className="text-fg-subtle">Odgovor na</dt>
                  <dd className="min-w-0 truncate text-fg">{replyTo}</dd>
                </>
              ) : null}
              <dt className="text-fg-subtle">Zadeva</dt>
              <dd className="min-w-0 break-words font-medium text-fg">{subject}</dd>
            </dl>
            <div className="whitespace-pre-wrap break-words px-4 py-4 text-base text-fg">
              {renderTemplate(value, values)}
            </div>
          </div>
          <p className="text-sm text-fg-subtle">
            {realSample
              ? 'Obarvano besedilo je vstavljeno iz izbranega pogovora.'
              : 'Ko bo agent imel prvi pogovor, bo predogled zapolnjen z njegovimi podatki.'}
          </p>
        </div>
      </CardBody>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={`Ponastavim besedilo »${title}«?`}
        description="Vaše besedilo se zamenja s privzetim. Ponastavitev začne veljati šele, ko pritisnete »Shrani spremembe«."
        confirmLabel="Ponastavi besedilo"
        onConfirm={() => onChange(defaultValue)}
      />
    </Card>
  );
}

import { Check } from 'lucide-react';
import { Card, CardBody, CardHeader, ProgressBar } from '@/components/ui';
import { TRIAL } from '@/data/labels';

const INCLUDED = [
  'Branje besedila vaše spletne strani ter vaših datotek in besedil',
  'Termini: povpraševanje ali samodejna rezervacija z Google Koledarjem',
  'Povzetek vsakega pogovora po e-pošti in potrditev obiskovalcu',
  'Pregled pogovorov, kontaktov in rezervacij v aplikaciji',
];

/** What is the same in every plan (the Plan record only differs in minutes and pages). */
export function IncludedInEvery() {
  return (
    <Card tone="quiet">
      <CardBody>
        <h2 className="text-md font-semibold text-fg">V vsakem paketu</h2>
        <ul className="mt-3 grid gap-x-8 gap-y-2.5 md:grid-cols-2">
          {INCLUDED.map((text) => (
            <li key={text} className="flex min-w-0 items-start gap-2.5 text-base text-fg">
              <Check size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <span className="min-w-0">{text}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

/**
 * What counts as a minute, and what happens when the trial ends (two small cards, one column).
 * The numbers of the trial are not repeated here: the page prints them once, above the plans.
 */
export function MinutesAndTrial() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card>
        <CardHeader title="Kaj je minuta pogovora" />
        <CardBody className="text-base text-fg-muted">
          <p>
            V minute se šteje trajanje pogovorov obiskovalcev s pomočnikom. Trajanje vsakega pogovora vidite v razdelku
            Pogovori, porabo v tekočem obdobju pa na strani Pregled in v razdelku Naročnina.
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={TRIAL.name} />
        <CardBody className="text-base text-fg-muted">
          <p>
            Ko se brezplačni preizkus izteče ali ko porabite njegove minute, se pomočnik začasno ustavi, dokler ne
            izberete paketa.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

const LIMIT_STEPS: { value: number; label: string; text: string }[] = [
  { value: 80, label: '80 % minut', text: 'Na vaš e-naslov pride opozorilo.' },
  {
    value: 100,
    label: '100 % minut',
    text: 'Pomočnik se začasno ustavi. Pripomoček obiskovalcu z enim stavkom pove, da pomočnik trenutno ni na voljo.',
  },
];

/** What happens at the limit (SPEC §7 enforceLimits). */
export function LimitExplainer() {
  return (
    <Card>
      <CardHeader title="Ko zmanjka minut" description="Vključene minute veljajo za tekoče obdobje naročnine." />
      <CardBody>
        <ol className="flex flex-col gap-4">
          {LIMIT_STEPS.map((s) => (
            <li key={s.value} className="min-w-0">
              <p className="text-base font-medium text-fg">{s.label}</p>
              <ProgressBar className="mt-1.5" label={s.label} value={s.value} max={100} />
              <p className="mt-1.5 text-base text-fg-muted">{s.text}</p>
            </li>
          ))}
          <li className="min-w-0 border-t border-border pt-4">
            <p className="text-base font-medium text-fg">Novo obdobje ali višji paket</p>
            <p className="mt-1 text-base text-fg-muted">Pomočnik samodejno spet začne delovati.</p>
          </li>
        </ol>
      </CardBody>
    </Card>
  );
}

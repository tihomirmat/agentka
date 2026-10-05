import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { BRAND } from '@/brand';
import * as api from '@/data/api';
import { WIZARD_STEPS } from '@/data/labels';
import { Button, Card, CardBody, CardFooter, Checkbox, Field, Input } from '@/components/ui';
import { FormError } from './auth/FormError';
import { PasswordInput } from './auth/PasswordInput';
import { checkWebsite, emailError, PASSWORD_MIN } from './auth/validation';
import { TEXT_LINK } from './shared/planText';

type FieldName = 'businessName' | 'website' | 'email' | 'password' | 'terms';
const ORDER: FieldName[] = ['businessName', 'website', 'email', 'password', 'terms'];

/** What each of the five wizard steps does (SPEC §3.3). The names come from labels.ts. */
const NEXT_STEPS: Record<number, string> = {
  1: `Vpišete naslov, ${BRAND} uvozi strani. Tiste, ki jih agent ne sme uporabiti, izklopite.`,
  2: 'Določite ime agenta, pozdrav, glas in jezik.',
  3: 'Izberete povpraševanje ali samodejno rezervacijo z Google Koledarjem.',
  4: 'Vpišete e-naslov za povzetke pogovorov in izberete, ali obiskovalec prejme potrditev.',
  5: 'Agenta preizkusite v testnem pripomočku in kopirate kodo za vgradnjo.',
};

type Errors = Partial<Record<FieldName, string>>;

function validate(v: { businessName: string; website: string; email: string; password: string; terms: boolean }): Errors {
  const errors: Errors = {};
  if (!v.businessName.trim()) errors.businessName = 'Vpišite ime podjetja.';
  const site = checkWebsite(v.website);
  if (!site.ok) errors.website = site.message;
  const mail = emailError(v.email);
  if (mail) errors.email = mail;
  if (!v.password) errors.password = `Vpišite geslo. Vsaj ${PASSWORD_MIN} znakov.`;
  else if (v.password.length < PASSWORD_MIN) errors.password = `Geslo naj ima vsaj ${PASSWORD_MIN} znakov.`;
  if (!v.terms) errors.terms = 'Za ustvarjanje računa se morate strinjati s pogoji uporabe in politiko zasebnosti.';
  return errors;
}

/**
 * Sign-up. api.register creates an empty trial account in the browser (stage 1), saves the
 * website address on it and signs the person in; then the person continues in the setup
 * wizard at step 1.
 */
export default function Register() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [busy, setBusy] = useState(false);

  const refs: Record<FieldName, RefObject<HTMLInputElement>> = {
    businessName: useRef<HTMLInputElement>(null),
    website: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    terms: useRef<HTMLInputElement>(null),
  };

  const signUp = api.useAction(api.register);

  const values = { businessName, website, email, password, terms };
  const errors = validate(values);
  // An error shows after the first attempt to submit, or once a field with text has been left.
  const shown = (name: FieldName): string | undefined => (attempted || touched[name] ? errors[name] : undefined);
  const leave = (name: FieldName, filled: boolean) => {
    if (filled) setTouched((t) => ({ ...t, [name]: true }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const first = ORDER.find((name) => errors[name]);
    if (first) {
      setAttempted(true);
      refs[first].current?.focus();
      return;
    }
    const site = checkWebsite(website);
    if (!site.ok) return;
    setBusy(true);
    try {
      const session = await signUp.run({
        // TODO(R27, page owner): the form still has no "Vaše ime in priimek" field, so the
        // business name stands in for the owner's name. api.register now takes ownerName.
        ownerName: businessName.trim(),
        businessName: businessName.trim(),
        website: site.url,
        email: email.trim(),
        password,
      });
      if (!session) return;
      navigate('/zacetek/1', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">Ustvarite račun</h1>
        <p className="mt-1 max-w-prose text-base text-fg-muted">
          Vpišite osnovne podatke, nato vas čarovnik v petih korakih pelje do pomočnika na vaši spletni strani.
          Brezplačen preizkus ima omejeno število dni in minut.
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <Card>
              <CardBody>
                <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                  <Field label="Ime podjetja" error={shown('businessName')}>
                    <Input
                      ref={refs.businessName}
                      autoComplete="organization"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      onBlur={() => leave('businessName', businessName.trim() !== '')}
                    />
                  </Field>
                  <Field
                    label="Naslov spletne strani"
                    hint="Z https:// ali brez. Primer: vasepodjetje.si"
                    error={shown('website')}
                  >
                    <Input
                      ref={refs.website}
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="vasepodjetje.si"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      onBlur={() => leave('website', website.trim() !== '')}
                    />
                  </Field>
                  <Field label="E-naslov" hint="S tem naslovom se boste prijavljali." error={shown('email')}>
                    <Input
                      ref={refs.email}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => leave('email', email.trim() !== '')}
                    />
                  </Field>
                  <Field label="Geslo" hint={`Vsaj ${PASSWORD_MIN} znakov.`} error={shown('password')}>
                    <PasswordInput
                      ref={refs.password}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => leave('password', password !== '')}
                    />
                  </Field>

                  <div className="flex flex-col gap-1.5">
                    <Checkbox
                      ref={refs.terms}
                      label="Strinjam se s pogoji uporabe in politiko zasebnosti"
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      aria-invalid={shown('terms') ? true : undefined}
                      aria-describedby={shown('terms') ? 'terms-error' : undefined}
                    />
                    {shown('terms') ? (
                      <p id="terms-error" className="flex items-start gap-1.5 text-sm text-danger">
                        <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                        <span>{shown('terms')}</span>
                      </p>
                    ) : null}
                  </div>

                  {signUp.error ? <FormError>{signUp.error}</FormError> : null}
                  <Button type="submit" variant="primary" loading={busy} block>
                    Ustvari račun in začni nastavitev
                  </Button>
                </form>
              </CardBody>
              <CardFooter className="justify-start rounded-b-lg bg-surface-2 text-sm text-fg-muted">
                <p>Predogled: registracija je simulirana. Račun nastane samo v tem brskalniku.</p>
              </CardFooter>
            </Card>
            <p className="mt-4 text-sm text-fg-muted">
              Že imate račun?{' '}
              <Link to="/prijava" className={TEXT_LINK}>
                Prijava
              </Link>
            </p>
          </div>

          <aside aria-labelledby="po-registraciji" className="min-w-0">
            <h2 id="po-registraciji" className="text-md font-semibold text-fg">
              Kaj sledi po registraciji
            </h2>
            <ol className="mt-4 flex flex-col gap-4">
              {WIZARD_STEPS.map(({ step, label }) => (
                <li key={step} className="flex min-w-0 gap-3">
                  <span
                    aria-hidden="true"
                    className="nums inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-medium text-accent-soft-fg"
                  >
                    {step}
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-medium text-fg">
                      <span className="sr-only">Korak {step}: </span>
                      {label}
                    </p>
                    <p className="text-sm text-fg-muted">{NEXT_STEPS[step]}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-fg-muted">Vsak korak lahko preskočite in ga dokončate pozneje.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

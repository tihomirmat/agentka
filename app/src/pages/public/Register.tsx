import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BRAND } from '@/brand';
import * as api from '@/data/api';
import { TRIAL, WIZARD_STEPS } from '@/data/labels';
import { Button, Card, CardBody, CardFooter, CardHeader, Field, Input, Notice, StepList } from '@/components/ui';
import { PasswordInput } from './auth/PasswordInput';
import { checkWebsite, emailError, PASSWORD_MIN } from './auth/validation';
import { TEXT_LINK } from './shared/links';
import { useTrialTermsText } from './shared/trial';

type FieldName = 'ownerName' | 'businessName' | 'website' | 'email' | 'password';
const ORDER: FieldName[] = ['ownerName', 'businessName', 'website', 'email', 'password'];

/** What each of the five wizard steps does (SPEC §3.3). The names come from labels.ts. */
const NEXT_STEPS: Record<number, string> = {
  1: `Vpišete naslov, ${BRAND} uvozi strani. Tiste, ki jih pomočnik ne sme uporabiti, izklopite.`,
  2: 'Določite ime pomočnika, pozdrav, glas in jezik.',
  3: 'Izberete povpraševanje ali samodejno rezervacijo z Google Koledarjem.',
  4: 'Vpišete e-naslov za povzetke pogovorov in izberete, ali obiskovalec prejme potrditev.',
  5: 'Pomočnika preizkusite v testnem pripomočku in kopirate kodo za vgradnjo.',
};

type Errors = Partial<Record<FieldName, string>>;

function validate(v: Record<FieldName, string>): Errors {
  const errors: Errors = {};
  if (!v.ownerName.trim()) errors.ownerName = 'Vpišite svoje ime in priimek.';
  if (!v.businessName.trim()) errors.businessName = 'Vpišite ime podjetja.';
  // The website may be left empty: the first step of the setup asks for it again.
  if (v.website.trim()) {
    const site = checkWebsite(v.website);
    if (!site.ok) errors.website = site.message;
  }
  const mail = emailError(v.email);
  if (mail) errors.email = mail;
  if (!v.password) errors.password = `Vpišite geslo. Vsaj ${PASSWORD_MIN} znakov.`;
  else if (v.password.length < PASSWORD_MIN) errors.password = `Geslo naj ima vsaj ${PASSWORD_MIN} znakov.`;
  return errors;
}

/**
 * Sign-up. api.register creates an empty trial account in the browser (stage 1) from the five
 * answers of this form in ONE call — the person's own name (becomes the owner), the business
 * name, the website (optional), the e-mail and the password — and signs the person in; then
 * the person continues in the setup wizard at step 1.
 */
export default function Register() {
  const navigate = useNavigate();
  const trial = useTrialTermsText();
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});

  const refs: Record<FieldName, RefObject<HTMLInputElement>> = {
    ownerName: useRef<HTMLInputElement>(null),
    businessName: useRef<HTMLInputElement>(null),
    website: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  const signUp = api.useAction(api.register);

  const errors = validate({ ownerName, businessName, website, email, password });
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
    const session = await signUp.run({
      ownerName: ownerName.trim(),
      businessName: businessName.trim(),
      website: site.ok ? site.url : '',
      email: email.trim(),
      password,
    });
    if (session) navigate('/zacetek/1', { replace: true });
  }

  return (
    <div className="page py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">Ustvarite račun</h1>
        <p className="mt-1 max-w-prose text-base text-fg-muted">
          Vpišite osnovne podatke, nato vas čarovnik v petih korakih pelje do pomočnika na vaši spletni strani.
          {trial ? ` ${TRIAL.name}: ${trial}.` : ''}
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <Card>
              <CardBody>
                <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                  <Field label="Vaše ime in priimek" error={shown('ownerName')}>
                    <Input
                      ref={refs.ownerName}
                      autoComplete="name"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      onBlur={() => leave('ownerName', ownerName.trim() !== '')}
                    />
                  </Field>
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
                    optional
                    hint="Z https:// ali brez. Primer: vasepodjetje.si. Lahko ga vpišete tudi v prvem koraku nastavitve."
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

                  {signUp.error ? (
                    <Notice size="sm" tone="danger">
                      {signUp.error}
                    </Notice>
                  ) : null}
                  <Button type="submit" variant="primary" loading={signUp.pending} block>
                    Ustvarite račun in začnite nastavitev
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
                Prijavite se
              </Link>
            </p>
          </div>

          <aside aria-label="Kaj sledi po registraciji" className="min-w-0">
            <Card>
              <CardHeader
                title="Kaj sledi po registraciji"
                description="V aplikaciji pomočnika imenujemo agent. Nastavitev lahko prekinete in nadaljujete pozneje."
                divider
              />
              <StepList
                showState={false}
                steps={WIZARD_STEPS.map(({ step, label }) => ({
                  id: String(step),
                  title: label,
                  detail: NEXT_STEPS[step],
                  state: 'waiting' as const,
                }))}
              />
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

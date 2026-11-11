import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BRAND } from '@/brand';
import * as api from '@/data/api';
import { WIZARD_STEPS } from '@/data/labels';
import { Button, Card, CardBody, CardFooter, CardHeader, Checkbox, Field, Input, Notice, StepList } from '@/components/ui';
import { checkWebsite, emailError } from './auth/validation';
import { LEGAL_VERSION } from './legal/content';
import { TEXT_LINK } from './shared/links';

type FieldName = 'ime' | 'podjetje' | 'spletna_stran' | 'email' | 'soglasje';
const ORDER: FieldName[] = ['ime', 'podjetje', 'spletna_stran', 'email', 'soglasje'];

/** What each of the five setup steps does (SPEC §3.3). The names come from labels.ts. */
const NEXT_STEPS: Record<number, string> = {
  1: `Vpišete naslov, ${BRAND} uvozi strani. Tiste, ki jih pomočnik ne sme uporabiti, izklopite.`,
  2: 'Določite ime pomočnika, pozdrav, glas in jezik.',
  3: 'Izberete povpraševanje ali samodejno rezervacijo z Google Koledarjem.',
  4: 'Vpišete e-naslov za povzetke pogovorov in izberete, ali obiskovalec prejme potrditev.',
  5: 'Pomočnika preizkusite v testnem pripomočku in kopirate kodo za vgradnjo.',
};

type Errors = Partial<Record<FieldName, string>>;

function validate(v: { ime: string; podjetje: string; spletna_stran: string; email: string; soglasje: boolean }): Errors {
  const errors: Errors = {};
  if (!v.ime.trim()) errors.ime = 'Vpišite svoje ime in priimek.';
  if (!v.podjetje.trim()) errors.podjetje = 'Vpišite ime podjetja.';
  if (v.spletna_stran.trim()) {
    const site = checkWebsite(v.spletna_stran);
    if (!site.ok) errors.spletna_stran = site.message;
  }
  const mail = emailError(v.email);
  if (mail) errors.email = mail;
  if (!v.soglasje) errors.soglasje = 'Za prijavo potrdite, da se strinjate s pogoji.';
  return errors;
}

/** A random password for the browser-only preview account (stage 1); nobody needs to know it. */
function previewPassword(): string {
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sign-up ("Začnite brezplačno"). Sends name, business, website (optional) and e-mail with the
 * consent to the Agentka server (api.submitSignup): it is saved in the EU, the owner gets an
 * e-mail and the visitor a confirmation. After that the visitor may open the app preview, which
 * still runs only in this browser (api.register).
 */
export default function Register() {
  const navigate = useNavigate();
  const [ime, setIme] = useState('');
  const [podjetje, setPodjetje] = useState('');
  const [spletnaStran, setSpletnaStran] = useState('');
  const [email, setEmail] = useState('');
  const [soglasje, setSoglasje] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [sentTo, setSentTo] = useState<string | null>(null);

  const refs: Record<FieldName, RefObject<HTMLInputElement>> = {
    ime: useRef<HTMLInputElement>(null),
    podjetje: useRef<HTMLInputElement>(null),
    spletna_stran: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    soglasje: useRef<HTMLInputElement>(null),
  };

  const send = api.useAction(api.submitSignup);
  const preview = api.useAction(api.register);

  const errors = validate({ ime, podjetje, spletna_stran: spletnaStran, email, soglasje });
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
    const site = checkWebsite(spletnaStran);
    const ok = await send.run({
      ime: ime.trim(),
      podjetje: podjetje.trim(),
      email: email.trim(),
      spletna_stran: spletnaStran.trim() && site.ok ? site.url : '',
      soglasje: true,
      soglasje_verzija: LEGAL_VERSION,
      website_hp: honeypot,
    });
    if (ok) setSentTo(email.trim());
  }

  async function openPreview() {
    const site = checkWebsite(spletnaStran);
    const session = await preview.run({
      ownerName: ime.trim(),
      businessName: podjetje.trim(),
      website: spletnaStran.trim() && site.ok ? site.url : '',
      email: email.trim(),
      password: previewPassword(),
    });
    if (session) navigate('/zacetek/1', { replace: true });
  }

  return (
    <div className="page py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">Prijava za Agentko</h1>
        <p className="mt-1 max-w-prose text-base text-fg-muted">
          Vpišite osnovne podatke. Oglasimo se vam in skupaj postavimo pomočnika na vašo spletno stran.
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div className="min-w-0">
            {sentTo ? (
              <Card>
                <CardBody className="flex flex-col gap-4">
                  <h2 className="font-display text-xl font-semibold text-fg" data-testid="signup-done">
                    Hvala, prijava je oddana
                  </h2>
                  <p className="text-base text-fg-muted">
                    Na <strong className="text-fg">{sentTo}</strong> smo poslali potrditev. Oglasimo se vam v
                    najkrajšem času.
                  </p>
                  <p className="text-sm text-fg-muted">
                    Medtem si lahko ogledate predogled aplikacije. Deluje z vzorčnimi podatki in samo v tem brskalniku.
                  </p>
                  {preview.error ? (
                    <Notice size="sm" tone="danger">
                      {preview.error}
                    </Notice>
                  ) : null}
                  <Button variant="secondary" onClick={openPreview} loading={preview.pending}>
                    Oglejte si predogled aplikacije
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody>
                  <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                    <Field label="Vaše ime in priimek" error={shown('ime')}>
                      <Input
                        ref={refs.ime}
                        name="ime"
                        autoComplete="name"
                        value={ime}
                        onChange={(e) => setIme(e.target.value)}
                        onBlur={() => leave('ime', ime.trim() !== '')}
                      />
                    </Field>
                    <Field label="Ime podjetja" error={shown('podjetje')}>
                      <Input
                        ref={refs.podjetje}
                        name="podjetje"
                        autoComplete="organization"
                        value={podjetje}
                        onChange={(e) => setPodjetje(e.target.value)}
                        onBlur={() => leave('podjetje', podjetje.trim() !== '')}
                      />
                    </Field>
                    <Field
                      label="Naslov spletne strani"
                      optional
                      hint="Z https:// ali brez. Primer: vasepodjetje.si"
                      error={shown('spletna_stran')}
                    >
                      <Input
                        ref={refs.spletna_stran}
                        name="spletna_stran"
                        type="text"
                        inputMode="url"
                        autoComplete="url"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder="vasepodjetje.si"
                        value={spletnaStran}
                        onChange={(e) => setSpletnaStran(e.target.value)}
                        onBlur={() => leave('spletna_stran', spletnaStran.trim() !== '')}
                      />
                    </Field>
                    <Field label="E-naslov" hint="Na ta naslov pošljemo potrditev." error={shown('email')}>
                      <Input
                        ref={refs.email}
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => leave('email', email.trim() !== '')}
                      />
                    </Field>

                    {/* Honeypot for bots: hidden from people and from screen readers. */}
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                      <label>
                        Pustite prazno
                        <input
                          tabIndex={-1}
                          autoComplete="off"
                          name="website_hp"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                        />
                      </label>
                    </div>

                    <div>
                      <Checkbox
                        ref={refs.soglasje}
                        name="soglasje"
                        checked={soglasje}
                        onChange={(e) => setSoglasje(e.target.checked)}
                        aria-invalid={shown('soglasje') ? true : undefined}
                        label={
                          <>
                            Strinjam se s{' '}
                            <Link className={TEXT_LINK} to="/pogoji" target="_blank">
                              pogoji uporabe
                            </Link>
                            , vključno s{' '}
                            <Link className={TEXT_LINK} to="/pogoji" target="_blank">
                              pogodbo o obdelavi podatkov
                            </Link>
                            , in s{' '}
                            <Link className={TEXT_LINK} to="/zasebnost" target="_blank">
                              politiko zasebnosti
                            </Link>
                            .
                          </>
                        }
                        description="Podatke hranimo na strežniku v Nemčiji (EU). Seznam obdelovalcev je na strani Podizvajalci."
                      />
                      {shown('soglasje') ? (
                        <p className="mt-1 text-sm text-danger" role="alert">
                          {shown('soglasje')}
                        </p>
                      ) : null}
                    </div>

                    {send.error ? (
                      <Notice size="sm" tone="danger">
                        {send.error}
                      </Notice>
                    ) : null}
                    <Button type="submit" variant="primary" loading={send.pending} block>
                      Pošljite prijavo
                    </Button>
                  </form>
                </CardBody>
                <CardFooter className="justify-start rounded-b-lg bg-surface-2 text-sm text-fg-muted">
                  <p>Prijava je brezplačna in vas ne obvezuje k naročnini.</p>
                </CardFooter>
              </Card>
            )}
          </div>

          <aside aria-label="Kaj sledi po prijavi" className="min-w-0">
            <Card>
              <CardHeader
                title="Kaj sledi po prijavi"
                description="Oglasimo se vam, nato v petih korakih skupaj nastavimo pomočnika."
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

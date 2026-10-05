import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BRAND } from '@/brand';
import * as api from '@/data/api';
import { Button, Card, CardBody, CardFooter, Field, Input, useToast } from '@/components/ui';
import { FormError } from './auth/FormError';
import { PasswordInput } from './auth/PasswordInput';
import { emailError } from './auth/validation';
import { TEXT_LINK } from './shared/planText';

interface Errors {
  email?: string;
  password?: string;
}

/**
 * Sign-in. In stage 1 any valid-looking e-mail with any password signs in (api.login).
 * On success the person goes back to the page the guard sent them away from, else to Pregled.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = (location.state as { from?: string } | null)?.from ?? '/app/pregled';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const signIn = api.useAction(api.login);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {
      email: emailError(email) ?? undefined,
      password: password ? undefined : 'Vpišite geslo.',
    };
    setErrors(next);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();
    const session = await signIn.run(email, password);
    if (session) navigate(from, { replace: true });
  }

  function google() {
    // There is no Google sign-in function in the stage 1 API, so nothing real is called.
    toast.info('Prijava z Google računom v predogledu ni povezana. Prijavite se z e-naslovom in geslom.');
  }

  return (
    <div className="page flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">Prijava</h1>
        <p className="mt-1 text-base text-fg-muted">Prijavite se v svoj račun {BRAND}.</p>

        <Card className="mt-6">
          <CardBody>
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              <Field label="E-naslov" error={errors.email}>
                <Input
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
                  }}
                />
              </Field>
              <Field label="Geslo" error={errors.password}>
                <PasswordInput
                  ref={passwordRef}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
                  }}
                />
              </Field>
              {signIn.error ? <FormError>{signIn.error}</FormError> : null}
              <Button type="submit" variant="primary" loading={signIn.pending} block>
                Prijava
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-sm text-fg-subtle" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              ali
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button block onClick={google}>
              Nadaljuj z Google računom
            </Button>
          </CardBody>
          <CardFooter className="justify-start rounded-b-lg bg-surface-2 text-sm text-fg-muted">
            <p>
              Predogled: prijava je simulirana. Vpišite kateri koli <span className="whitespace-nowrap">e-naslov</span> in
              geslo.
            </p>
          </CardFooter>
        </Card>

        <p className="mt-4 text-sm text-fg-muted">
          Še nimate računa?{' '}
          <Link to="/registracija" className={TEXT_LINK}>
            Ustvarite račun
          </Link>
        </p>
      </div>
    </div>
  );
}

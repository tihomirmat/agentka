import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSession } from '@/data/api';
import { ButtonLink } from '@/components/ui';

/** Shown for every address the app does not know. */
export default function NotFound() {
  const session = useSession();
  const { pathname } = useLocation();
  return (
    <div className="page flex flex-col items-start py-16 sm:py-24">
      <p className="font-mono text-sm text-fg-subtle">Napaka 404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-fg">Te strani ni.</h1>
      <p className="mt-3 max-w-prose text-md text-fg-muted">
        Naslov <span className="break-all font-mono text-sm text-fg">{pathname}</span> ne vodi nikamor. Morda je bil
        napačno prepisan ali pa je stran prestavljena.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/" variant="primary" icon={ArrowLeft}>
          Na začetno stran
        </ButtonLink>
        {session.loggedIn ? (
          <ButtonLink to="/app/pregled">V aplikacijo</ButtonLink>
        ) : (
          <ButtonLink to="/prijava">Prijava</ButtonLink>
        )}
      </div>
    </div>
  );
}

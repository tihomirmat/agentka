import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { BRAND, BRAND_TAGLINE } from '@/brand';
import { useSession } from '@/data/api';
import { cn } from '@/lib/cn';
import {
  ButtonLink,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Logo,
  SampleDataNote,
} from '@/components/ui';

/** id of the landing-page section that "Kako deluje" scrolls to. The Landing page must render it. */
export const HOW_IT_WORKS_ID = 'kako-deluje';

/** Link state that asks the landing page to scroll to "Kako deluje" after it opens. */
const HOW_STATE = { scrollTo: HOW_IT_WORKS_ID };

const LINK =
  'rounded px-1 py-1 text-base font-medium text-fg-muted transition-colors duration-100 hover:text-fg';

const FOOT_LINK = 'rounded py-1 text-sm font-medium text-fg-muted transition-colors duration-100 hover:text-fg';

/**
 * Frame of the public pages: header, page, footer. The page itself is full width —
 * public pages wrap their content in `<div className="page">` (or several such
 * sections) to get the centred column and the side gutter.
 */
export function PublicShell() {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  // The router uses the URL hash, so "#kako-deluje" cannot be a normal anchor.
  // A link to "/" carries the target in its state and we scroll here.
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [location.pathname, location.key, location.state]);

  const appLink = session.loggedIn
    ? { to: '/app/pregled', label: 'V aplikacijo' }
    : { to: '/prijava', label: 'Prijava' };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky-top z-30 border-b border-border bg-bg">
        <div className="page flex h-16 items-center gap-3 sm:gap-6">
          <Logo />
          <nav aria-label="Glavna navigacija" className="hidden flex-1 items-center gap-5 md:flex">
            <Link to="/" state={HOW_STATE} className={LINK}>
              Kako deluje
            </Link>
            <NavLink to="/cenik" className={({ isActive }) => cn(LINK, isActive && 'text-fg')}>
              Cenik
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link to={appLink.to} className={cn(LINK, 'hidden md:inline-flex')}>
              {appLink.label}
            </Link>
            {session.loggedIn ? null : (
              <ButtonLink to="/registracija" variant="primary" size="sm" className="sm:h-10 sm:px-4 sm:text-base">
                Začnite brezplačno
              </ButtonLink>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Odpri meni"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-fg-muted hover:bg-surface-2 hover:text-fg md:hidden"
              >
                <Menu size={20} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate('/', { state: HOW_STATE })}>Kako deluje</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/cenik')}>Cenik</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate(appLink.to)}>{appLink.label}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="page py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <Logo size="sm" />
              <p className="mt-2 max-w-xs text-sm text-fg-muted">{BRAND_TAGLINE}.</p>
            </div>
            <nav aria-label="Povezave v nogi" className="flex flex-wrap gap-x-6 gap-y-2">
              <Link to="/" state={HOW_STATE} className={FOOT_LINK}>
                Kako deluje
              </Link>
              <Link to="/cenik" className={FOOT_LINK}>
                Cenik
              </Link>
              <Link to="/prijava" className={FOOT_LINK}>
                Prijava
              </Link>
              <Link to="/registracija" className={FOOT_LINK}>
                Registracija
              </Link>
            </nav>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-fg-subtle">
              © {new Date().getFullYear()} {BRAND}
            </p>
            <SampleDataNote />
          </div>
        </div>
      </footer>
    </div>
  );
}

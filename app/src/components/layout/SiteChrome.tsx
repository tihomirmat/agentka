import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BRAND } from '@/brand';
import { useSession } from '@/data/api';
import logo from '@/assets/agentka-logo.png';
import '@/pages/public/landing/landing.css';

/**
 * The one header and footer of every public page (landing, cenik, prijava, registracija, 404).
 * Styles live in landing.css (scoped under .lp). On "/" the section links scroll; elsewhere they
 * go to "/" and ask it to scroll (Landing reads location.state.scrollTo).
 */
export function SiteHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const onHome = pathname === '/';
  const go = (id: string) => {
    if (onHome) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else navigate('/', { state: { scrollTo: id } });
  };
  const account = session.loggedIn
    ? { to: '/app/pregled', label: 'V aplikacijo' }
    : { to: '/prijava', label: 'Prijava' };

  return (
    <div className="lp lp-chrome">
      <header className="header">
        <div className="container nav">
          <Link className="brand" to="/" aria-label={`${BRAND} – na začetno stran`}>
            <img className="brandlogo" src={logo} alt={BRAND} />
          </Link>
          <nav className="navlinks" aria-label="Glavna navigacija">
            <button type="button" className="navlink" onClick={() => go('prednosti')}>
              Prednosti
            </button>
            <button type="button" className="navlink" onClick={() => go('kako-deluje')}>
              Kako deluje
            </button>
            <button type="button" className="navlink" onClick={() => go('vprasanja')}>
              Vprašanja
            </button>
            <Link className="navlink" to="/cenik" aria-current={pathname === '/cenik' ? 'page' : undefined}>
              Cenik
            </Link>
            <Link className="navlink-login" to={account.to}>
              {account.label}
            </Link>
            {session.loggedIn ? null : (
              <Link className="btn btn-primary btn-sm" to="/registracija">
                Začnite brezplačno
              </Link>
            )}
          </nav>
        </div>
      </header>
    </div>
  );
}

export function SiteFooter() {
  return (
    <div className="lp lp-chrome-foot">
      <footer className="footer">
        <div className="container footer-inner">
          <div>© {new Date().getFullYear()} {BRAND}</div>
          <div className="footer-links">
            <Link to="/cenik">Cenik</Link>
            <Link to="/prijava">Prijava</Link>
            <Link to="/registracija">Registracija</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

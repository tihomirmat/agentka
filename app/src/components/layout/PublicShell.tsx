import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteFooter, SiteHeader } from './SiteChrome';

/** id of the landing-page section that "Kako deluje" scrolls to. The Landing page must render it. */
export const HOW_IT_WORKS_ID = 'kako-deluje';

/**
 * Frame of the public pages: header, page, footer. The page itself is full width —
 * public pages wrap their content in `<div className="page">` (or several such
 * sections) to get the centred column and the side gutter.
 */
export function PublicShell() {
  const location = useLocation();

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

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}

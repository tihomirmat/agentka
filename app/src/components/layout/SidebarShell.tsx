import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Menu, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NAV_BREAKPOINT, useMediaQuery } from '@/lib/useMediaQuery';
import { Logo, SampleDataNote } from '@/components/ui';
import { TopBarSlotContext } from './slots';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** match the path exactly (for index-like routes) */
  end?: boolean;
  /** other path prefixes that also light this item up (detail pages) */
  alsoActive?: string[];
}

export interface SidebarShellProps {
  /** name of the navigation for screen readers */
  navLabel: string;
  nav: NavItem[];
  /** links shown apart, under the main list */
  navSecondary?: NavItem[];
  /** next to the logo, e.g. a "Skrbnik" badge */
  logoAside?: ReactNode;
  logoTo: string;
  /** bottom of the sidebar */
  sidebarFooter: ReactNode;
  /** left part of the top bar */
  topBar: ReactNode;
  /** full-width line between the top bar and the page (notices) */
  notice?: ReactNode;
}

function NavList({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation();
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map(({ to, label, icon: Icon, end, alsoActive }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex h-9 items-center gap-2.5 rounded px-2.5 text-base font-medium transition-colors duration-100',
                isActive || alsoActive?.some((p) => pathname.startsWith(p))
                  ? 'bg-accent-soft text-accent-soft-fg'
                  : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
              )
            }
          >
            <Icon size={17} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * Internal: the frame shared by AppShell and AdminShell.
 * Sidebar on the left (a slide-in drawer under 900px), top bar, scrolling page area.
 * Sized with height:100% from the root — no viewport units.
 *
 * The frame never scrolls as a whole: the root is `relative overflow-hidden` and <main> is
 * the one scrolling box AND the positioning context of everything in the page (see "THE
 * FRAME RULE" in styles/index.css). scripts/sweep.mjs checks it on every route.
 */
export function SidebarShell({
  navLabel,
  nav,
  navSecondary,
  logoAside,
  logoTo,
  sidebarFooter,
  topBar,
  notice,
}: SidebarShellProps) {
  const wide = useMediaQuery(NAV_BREAKPOINT);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // A new page starts at its top; the drawer closes after a choice.
  useEffect(() => {
    setDrawerOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // ... and also when a link in the drawer is clicked and the page does NOT change: the same
  // page, or a navigation the unsaved-changes guard holds back ("Ostani"). Without this the
  // drawer would stay open behind the question and after it.
  const closeOnLink = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('a[href]')) setDrawerOpen(false);
  };

  useEffect(() => {
    if (wide) setDrawerOpen(false);
  }, [wide]);

  const sidebar = (inDrawer: boolean) => (
    <div className="flex h-full min-h-0 w-full flex-col bg-bg">
      <div className="flex h-topbar shrink-0 items-center justify-between gap-2 px-4">
        <span className="flex min-w-0 items-center gap-2">
          <Logo to={logoTo} size="sm" />
          {logoAside}
        </span>
        {inDrawer ? (
          <RadixDialog.Close
            aria-label="Zapri meni"
            className="-mr-1.5 inline-flex h-9 w-9 items-center justify-center rounded text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            <X size={18} aria-hidden="true" />
          </RadixDialog.Close>
        ) : null}
      </div>
      <nav aria-label={navLabel} className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <NavList items={nav} />
        {navSecondary && navSecondary.length > 0 ? (
          <div className="mt-3 border-t border-border pt-3">
            <NavList items={navSecondary} />
          </div>
        ) : null}
      </nav>
      <div className="shrink-0 border-t border-border p-2">
        {/* On a phone the top bar has no room for the note, so the drawer carries it. */}
        {inDrawer ? <SampleDataNote className="mb-2 ml-2" /> : null}
        {sidebarFooter}
      </div>
    </div>
  );

  return (
    <TopBarSlotContext.Provider value={slot}>
      <div className="relative flex h-full min-h-0 w-full overflow-hidden">
        {wide ? (
          <aside className="h-full w-sidebar shrink-0 border-r border-border">{sidebar(false)}</aside>
        ) : (
          <RadixDialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <RadixDialog.Portal>
              <RadixDialog.Overlay className="fixed inset-0 z-40 bg-overlay motion-safe:animate-fade-in" />
              <RadixDialog.Content
                aria-describedby={undefined}
                onClick={closeOnLink}
                className="fixed inset-y-0 left-0 z-40 w-[17rem] max-w-[85%] border-r border-border shadow-lg motion-safe:animate-slide-in-left"
              >
                <RadixDialog.Title className="sr-only">{navLabel}</RadixDialog.Title>
                {sidebar(true)}
              </RadixDialog.Content>
            </RadixDialog.Portal>
          </RadixDialog.Root>
        )}

        <div className="flex h-full min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-border bg-bg">
            {/* Same column as the page below, so the top bar lines up with the content. */}
            <div className="page flex h-topbar items-center gap-2 sm:gap-3">
              {wide ? null : (
                <button
                  type="button"
                  aria-label="Odpri meni"
                  onClick={() => setDrawerOpen(true)}
                  className="-ml-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-fg-muted hover:bg-surface-2 hover:text-fg"
                >
                  <Menu size={20} aria-hidden="true" />
                </button>
              )}
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">{topBar}</div>
              {/* Below the drawer breakpoint the note lives in the drawer, so the name is not cut. */}
              {wide ? <SampleDataNote /> : null}
              <div ref={setSlot} className="flex shrink-0 items-center gap-2 empty:hidden" />
            </div>
          </header>
          {notice}
          <main ref={mainRef} data-scroll-root className="relative min-h-0 flex-1 overflow-y-auto" tabIndex={-1}>
            <div className="page py-6 sm:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TopBarSlotContext.Provider>
  );
}

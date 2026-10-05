import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** The DOM node in the top bar where a page may put its own action. */
export const TopBarSlotContext = createContext<HTMLElement | null>(null);

/**
 * Puts its children into the top bar of AppShell / AdminShell, on the right.
 * Use it for the ONE action that belongs to the whole page and should stay in view
 * while the page scrolls (like "Namesti" on Pregled). Everything else goes into
 * <PageHeader actions={…}>.
 *
 *   <TopBarActions><ButtonLink to="/app/namestitev" variant="primary" size="sm">Namesti</ButtonLink></TopBarActions>
 */
export function TopBarActions({ children }: { children: ReactNode }) {
  const el = useContext(TopBarSlotContext);
  return el ? createPortal(children, el) : null;
}

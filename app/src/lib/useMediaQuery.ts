import { useSyncExternalStore } from 'react';

/** True while the media query matches. Safe when matchMedia is missing. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      try {
        const mql = window.matchMedia(query);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
      } catch {
        return () => {};
      }
    },
    () => {
      try {
        return window.matchMedia(query).matches;
      } catch {
        return false;
      }
    },
    () => false,
  );
}

/** The width at which the app sidebar stops being a drawer. Keep in sync with tailwind `nav`. */
export const NAV_BREAKPOINT = '(min-width: 900px)';

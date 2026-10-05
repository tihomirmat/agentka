import { useEffect, useRef, type ReactNode } from 'react';
import { useBlocker } from 'react-router-dom';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Asks before an in-app navigation (sidebar, link, back button) throws unsaved changes away.
 * Render what it returns anywhere in the page:
 *
 *   const guard = useUnsavedGuard(draft.dirty);
 *   return <>…{guard}</>;
 *
 * <SaveBar> already contains it — call the hook yourself only on a page that has unsaved
 * state without a SaveBar (a dialog-less inline form, the wizard).
 */
export function useUnsavedGuard(dirty: boolean): ReactNode {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  const leaving = useRef(false);

  // The changes were saved or discarded while the question was open: nothing left to ask.
  useEffect(() => {
    if (blocker.state === 'blocked' && !dirty) blocker.proceed();
  }, [blocker, dirty]);

  useEffect(() => {
    if (blocker.state !== 'blocked') leaving.current = false;
  }, [blocker.state]);

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked' && !leaving.current) blocker.reset();
      }}
      title="Zavržem neshranjene spremembe?"
      description="Na tej strani imate spremembe, ki še niso shranjene. Če stran zapustite, bodo izgubljene."
      cancelLabel="Ostani"
      confirmLabel="Zavrzi spremembe"
      tone="danger"
      onConfirm={() => {
        if (blocker.state !== 'blocked') return;
        leaving.current = true;
        blocker.proceed();
      }}
    />
  );
}

export interface SaveBarProps {
  /** true while there are unsaved changes — the bar exists only then */
  dirty: boolean;
  saving?: boolean;
  /** false while a field is invalid */
  canSave?: boolean;
  /** why saving is blocked, in one sentence */
  blockedReason?: string;
  /** sentence from the api when the last save failed */
  error?: string | null;
  onSave: () => void;
  onDiscard: () => void;
  /** ask before leaving the page with unsaved changes (default true) */
  guard?: boolean;
}

/**
 * THE way to save a settings page: ONE sticky bar per page. It appears when something
 * changed, floats above the content at the bottom of the scrolling area, and carries the
 * only primary button of the view. No "Shrani" inside single cards, no disabled grey save
 * buttons waiting for a change.
 *
 * Put it as the LAST element of the page content. It reserves room at the bottom of the
 * scroll area, so a focused field never hides under it, and it asks before the person leaves
 * with unsaved changes (useUnsavedGuard). After a successful save say it with a toast
 * ("Nastavitve so shranjene.") — the bar itself disappears.
 */
export function SaveBar({
  dirty,
  saving = false,
  canSave = true,
  blockedReason,
  error,
  onSave,
  onDiscard,
  guard = true,
}: SaveBarProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const guardDialog = useUnsavedGuard(guard && dirty);

  // While the bar floats over the content, keep a field that gets focus (or is scrolled to)
  // from landing underneath it: the scrolling area reserves room at its bottom edge.
  useEffect(() => {
    if (!dirty) return;
    let scroller = wrapper.current?.parentElement ?? null;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }
    if (!scroller) return;
    const area = scroller;
    const before = area.style.scrollPaddingBottom;
    area.style.scrollPaddingBottom = '9rem';
    return () => {
      area.style.scrollPaddingBottom = before;
    };
  }, [dirty]);

  // Tell the toasts where the bar is: `--toast-lift` is the distance from the bottom edge of the
  // window to the top of the bar plus a gap, so a toast stacks ABOVE the bar instead of on it
  // (Toast.tsx → Toaster). The bar is sticky, so it moves while the page scrolls and when the
  // page is short; the value follows it.
  useEffect(() => {
    if (!dirty) return;
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    let scroller = bar.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }
    const update = () => {
      const top = bar.getBoundingClientRect().top;
      root.style.setProperty('--toast-lift', `${Math.max(0, Math.ceil(window.innerHeight - top)) + 12}px`);
    };
    update();
    const settle = window.setTimeout(update, 250); // after the bar has risen into place
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    scroller?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.clearTimeout(settle);
      observer.disconnect();
      scroller?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      root.style.removeProperty('--toast-lift');
    };
  }, [dirty]);

  return (
    // The wrapper itself is the sticky element: a sticky child cannot leave its parent, and a
    // wrapper that is only as tall as the bar would pin nothing. The margin sits on the child so
    // an empty wrapper (nothing to save) takes no room.
    <div ref={wrapper} aria-live="polite" className="sticky bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-20">
      {dirty ? (
        <div className="mt-6 motion-safe:animate-rise-in">
          <div
            ref={barRef}
            role="group"
            aria-label="Neshranjene spremembe"
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-lg border border-border-strong bg-raised px-4 py-3 shadow-md"
          >
            <div className="min-w-0 flex-1 basis-56">
              <p className="flex items-center gap-2 text-base font-medium text-fg">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-warning" />
                Neshranjene spremembe
              </p>
              {error ? (
                <p role="alert" className="mt-0.5 text-sm text-danger">
                  {error}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-fg-muted">
                  {(!canSave && blockedReason) || 'Spremembe začnejo veljati, ko jih shranite.'}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" onClick={onDiscard} disabled={saving}>
                Zavrzi
              </Button>
              <Button variant="primary" loading={saving} disabled={!canSave} onClick={onSave}>
                Shrani spremembe
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {guardDialog}
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui';

export interface SaveBarProps {
  /** true while there are unsaved changes */
  visible: boolean;
  saving: boolean;
  /** false while a field is invalid */
  canSave: boolean;
  /** why saving is blocked, in one sentence */
  blockedReason?: string;
  /** sentence from the api when the last save failed */
  error?: string | null;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * The one sticky save bar of a settings screen. It exists only while something changed,
 * floats above the content (so it may carry a shadow, like any floating layer) and keeps
 * its place at the bottom of the scrolling page area.
 */
export function SaveBar({ visible, saving, canSave, blockedReason, error, onSave, onDiscard }: SaveBarProps) {
  const wrapper = useRef<HTMLDivElement>(null);

  // While the bar floats over the content, keep a field that gets focus (or is scrolled to) from
  // landing underneath it: the scrolling area reserves room at its bottom edge.
  useEffect(() => {
    if (!visible) return;
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
  }, [visible]);

  return (
    // The wrapper itself is the sticky element: a sticky child cannot leave its parent, and a
    // wrapper that is only as tall as the bar would pin nothing. The margin sits on the child so
    // an empty wrapper (nothing to save) takes no room.
    <div ref={wrapper} aria-live="polite" className="sticky bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-20">
      {visible ? (
        <div className="mt-6 motion-safe:animate-rise-in">
          <div
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
                  {blockedReason ?? 'Spremembe začnejo veljati, ko jih shranite.'}
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
    </div>
  );
}

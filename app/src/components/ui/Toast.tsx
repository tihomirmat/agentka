import { useSyncExternalStore } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  shownAt: number;
}

/* A module-level list, so toasts can be raised from anywhere without a provider. */
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, number>();

function emit() {
  for (const l of [...listeners]) l();
}

function dismiss(id: number) {
  window.clearTimeout(timers.get(id));
  timers.delete(id);
  if (!items.some((t) => t.id === id)) return;
  items = items.filter((t) => t.id !== id);
  emit();
}

function show(tone: ToastTone, message: string): number {
  const id = nextId++;
  // At most ONE toast per tone: a new "saved" replaces the previous "saved" instead of
  // stacking up, so there are never more than three and usually one.
  for (const old of items.filter((t) => t.tone === tone)) {
    window.clearTimeout(timers.get(old.id));
    timers.delete(old.id);
  }
  items = [...items.filter((t) => t.tone !== tone), { id, tone, message, shownAt: Date.now() }];
  const ms = tone === 'error' ? 9000 : Math.min(8000, 3500 + message.length * 35);
  timers.set(
    id,
    window.setTimeout(() => dismiss(id), ms),
  );
  emit();
  return id;
}

/**
 * Called by the router on every change of page (src/routes.tsx): a toast belongs to the page
 * it was raised on. Toasts younger than `graceMs` survive — they were raised by the very
 * action that caused the navigation ("Nastavitev je končana." → Pregled).
 */
export function clearToastsOnNavigation(graceMs = 1200): void {
  const now = Date.now();
  for (const t of [...items]) {
    if (now - t.shownAt > graceMs) dismiss(t.id);
  }
}

const api = {
  /** a result that changes what the person sees on the page — say what, in one sentence */
  success: (message: string) => show('success', message),
  /** something failed — say what went wrong and what to do */
  error: (message: string) => show('error', message),
  /** neutral notice. NOT for the result of a simulated outside action: that goes in a <Notice> */
  info: (message: string) => show('info', message),
  dismiss,
};

/**
 *   const toast = useToast();
 *   toast.success('Nastavitve so shranjene.');
 *   toast.error('Shranjevanje ni uspelo. Preverite povezavo in poskusite znova.');
 *
 * When to use a toast and when a <Notice>: CONVENTIONS.md → "How a result is shown".
 */
export function useToast() {
  return api;
}

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const ICON_TONE = { success: 'text-success', error: 'text-danger', info: 'text-info' };

/**
 * Rendered once, in App.tsx. Where the toasts sit:
 *  - wide screen: BOTTOM-right, so a toast never covers the buttons in a page header (the
 *    actions of a page are at its top). When a <SaveBar> is on screen it publishes the room it
 *    takes as the CSS variable `--toast-lift` (px from the window's bottom edge), and the
 *    toasts stack above it — they never cover the bar or the buttons in it;
 *  - phone: top-centre, under the top bar (the bottom of a phone is the save bar, the footers
 *    of forms and dialogs, the keyboard and the widget's text field).
 */
export function Toaster() {
  const list = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => items,
  );

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top,0px))] z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-[calc(max(1rem,var(--toast-lift,0px))+env(safe-area-inset-bottom,0px))] sm:top-auto sm:items-end sm:px-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {list.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-raised py-3 pl-3.5 pr-2 shadow-md motion-safe:animate-fade-in"
          >
            <Icon size={18} className={cn('mt-0.5 shrink-0', ICON_TONE[t.tone])} aria-hidden="true" />
            <p className="min-w-0 flex-1 text-base text-fg">{t.message}</p>
            <button
              type="button"
              aria-label="Zapri obvestilo"
              onClick={() => dismiss(t.id)}
              className="-my-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-raised-hover hover:text-fg [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-10"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

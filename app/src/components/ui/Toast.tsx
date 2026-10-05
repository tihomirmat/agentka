import { useSyncExternalStore } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
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
  items = items.filter((t) => t.id !== id);
  emit();
}

function show(tone: ToastTone, message: string): number {
  const id = nextId++;
  // Newest last; never more than three on screen.
  items = [...items, { id, tone, message }].slice(-3);
  const ms = tone === 'error' ? 9000 : Math.min(9000, 4000 + message.length * 35);
  timers.set(
    id,
    window.setTimeout(() => dismiss(id), ms),
  );
  emit();
  return id;
}

const api = {
  /** something worked — say what, in one sentence */
  success: (message: string) => show('success', message),
  /** something failed — say what went wrong and what to do */
  error: (message: string) => show('error', message),
  /** neutral notice, e.g. the "Predogled: …" message of a simulated action */
  info: (message: string) => show('info', message),
  dismiss,
};

/**
 *   const toast = useToast();
 *   toast.success('Nastavitve so shranjene.');
 *   toast.error('Shranjevanje ni uspelo. Preverite povezavo in poskusite znova.');
 */
export function useToast() {
  return api;
}

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const ICON_TONE = { success: 'text-success', error: 'text-danger', info: 'text-info' };

/** Rendered once, in App.tsx. */
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:items-end sm:px-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {list.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-raised py-3 pl-3.5 pr-2 shadow-md motion-safe:animate-rise-in"
          >
            <Icon size={18} className={cn('mt-0.5 shrink-0', ICON_TONE[t.tone])} aria-hidden="true" />
            <p className="min-w-0 flex-1 text-base text-fg">{t.message}</p>
            <button
              type="button"
              aria-label="Zapri obvestilo"
              onClick={() => dismiss(t.id)}
              className="-mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-raised-hover hover:text-fg"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

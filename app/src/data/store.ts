/**
 * A tiny observable in-memory store. It is the stand-in for the server in stage 1.
 *
 * Screens do NOT import this file. They use src/data/api.ts.
 *
 * Persistence is best effort: the state is mirrored to localStorage under one versioned
 * key. Every access is wrapped in try/catch — if storage is missing, full or blocked,
 * the app keeps working from memory and simply forgets on reload.
 */
import { useSyncExternalStore } from 'react';
import { BRAND } from '../brand';
import { createSampleDb, DB_VERSION } from './sample';
import type { Db } from './types';

// The key follows the product name in src/brand.ts and the data version.
const STORAGE_KEY = `${BRAND.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:db:v${DB_VERSION}`;
const DAY = 86_400_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

type Listener = () => void;

/** Moves every ISO date in the tree by a number of whole days (keeps "danes", "jutri" true). */
function shiftDates<T>(value: T, days: number): T {
  if (typeof value === 'string') {
    return (ISO_RE.test(value)
      ? new Date(new Date(value).getTime() + days * DAY).toISOString()
      : value) as T;
  }
  if (Array.isArray(value)) return value.map((v) => shiftDates(v, days)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = shiftDates(v, days);
    return out as T;
  }
  return value;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function readStorage(): Db | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Db;
    if (!parsed || parsed.version !== DB_VERSION || !Array.isArray(parsed.accounts)) return null;

    // Sample dates are relative to the day they were made. If the saved copy is from an
    // earlier day, move all dates forward so that upcoming appointments stay upcoming.
    const now = new Date();
    const days = Math.round((startOfDay(now) - startOfDay(new Date(parsed.seeded_at))) / DAY);
    if (days > 0) {
      const shifted = shiftDates(parsed, days);
      return shifted;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(db: Db): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage unavailable — stay in memory */
  }
}

function clearStorage(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

let state: Db = readStorage() ?? createSampleDb();
let revision = 0;
const listeners = new Set<Listener>();

function emit(): void {
  revision += 1;
  for (const l of [...listeners]) l();
}

export function getState(): Db {
  return state;
}

/** Changes whenever the state changes. useQuery listens to it to refetch. */
export function getRevision(): number {
  return revision;
}

/**
 * Replace the state. Pass a function that returns a NEW object (do not mutate `prev`):
 *   setState((prev) => ({ ...prev, leads: prev.leads.map(...) }))
 */
export function setState(updater: (prev: Db) => Db): void {
  const next = updater(state);
  if (next === state) return;
  state = next;
  writeStorage(state);
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Throws away every change and starts again from fresh sample data. Keeps the login. */
export function resetSampleData(): void {
  const session = state.session;
  clearStorage();
  const fresh = createSampleDb();
  const accountStillExists = fresh.accounts.some((a) => a.id === session.accountId);
  state = { ...fresh, session: accountStillExists ? session : fresh.session };
  writeStorage(state);
  emit();
}

/**
 * Read a slice of the store in a component.
 * The selector must return something that already lives in the state (or a primitive) —
 * do not build a new object or array inside it, or React will re-render forever.
 */
export function useStore<T>(selector: (db: Db) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function useRevision(): number {
  return useSyncExternalStore(subscribe, getRevision, getRevision);
}

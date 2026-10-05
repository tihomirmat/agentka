import { useCallback, useEffect, useState } from 'react';

/** Structural equality for the small plain objects the settings screens compare. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

export interface Draft<T extends object> {
  /** what the server holds, with the person's unsaved edits on top; undefined until loaded */
  value: T | undefined;
  /** what the server holds (last answer, or the copy that was just saved) */
  server: T | undefined;
  /** change one or more fields */
  patch: (changes: Partial<T>) => void;
  /** only the fields that really differ from the server: send exactly this to the api */
  changes: Partial<T>;
  dirty: boolean;
  /** throw the edits away */
  discard: () => void;
  /** call after a successful save, with the object the api returned */
  commit: (saved: T) => void;
  /** forget the edits of some fields (the server changed them under the person's hands) */
  drop: (keys: (keyof T)[]) => void;
  /** grows on discard and commit: use as `key` of inputs that keep their own text */
  version: number;
}

/**
 * Form draft for screens with a sticky save bar.
 *
 * It keeps only the person's EDITS and lays them over the latest server copy, so a change
 * that happens elsewhere on the page (for example disconnecting the calendar) is not
 * overwritten by a stale copy of the whole form. After a save, the saved object is adopted
 * at once, so the screen never flickers back to old values while the query refreshes.
 */
export function useDraft<T extends object>(source: T | undefined): Draft<T> {
  const [server, setServer] = useState<T | undefined>(source);
  const [edits, setEdits] = useState<Partial<T>>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (source === undefined) return;
    setServer((prev) => (prev !== undefined && deepEqual(prev, source) ? prev : source));
  }, [source]);

  const patch = useCallback((changes: Partial<T>) => {
    setEdits((prev) => ({ ...prev, ...changes }));
  }, []);

  const discard = useCallback(() => {
    setEdits({});
    setVersion((v) => v + 1);
  }, []);

  const commit = useCallback((saved: T) => {
    setServer(saved);
    setEdits({});
    setVersion((v) => v + 1);
  }, []);

  const drop = useCallback((keys: (keyof T)[]) => {
    setEdits((prev) => {
      const next = { ...prev };
      for (const k of keys) delete next[k];
      return next;
    });
    setVersion((v) => v + 1);
  }, []);

  const value = server ? { ...server, ...edits } : undefined;
  const changes: Partial<T> = {};
  if (server) {
    for (const key of Object.keys(edits) as (keyof T)[]) {
      if (!deepEqual(edits[key], server[key])) changes[key] = edits[key];
    }
  }
  const dirty = Object.keys(changes).length > 0;

  return { value, server, patch, changes, dirty, discard, commit, drop, version };
}

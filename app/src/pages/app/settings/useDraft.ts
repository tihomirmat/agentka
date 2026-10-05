import { useEffect, useState } from 'react';

/**
 * Local form draft for one settings card. The draft follows the saved data whenever the saved
 * values change (after a save, a reset of the sample data), and `dirty` says whether the
 * person has edited anything that is not saved yet. `source` must hold only the editable fields.
 */
export function useDraft<T extends object>(source: T) {
  const key = JSON.stringify(source);
  const [draft, setDraft] = useState<T>(source);

  useEffect(() => {
    setDraft(JSON.parse(key) as T);
  }, [key]);

  return {
    value: draft,
    dirty: JSON.stringify(draft) !== key,
    patch: (changes: Partial<T>) => setDraft((d) => ({ ...d, ...changes })),
    reset: () => setDraft(JSON.parse(key) as T),
  };
}

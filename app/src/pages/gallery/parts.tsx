import type { ReactNode } from 'react';

/** One titled block of the gallery. */
export function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="min-w-0 border-t border-border py-8">
      <h2 className="font-display text-lg font-semibold text-fg">{title}</h2>
      {note ? <p className="mt-1 max-w-prose text-sm text-fg-muted">{note}</p> : null}
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}

/** A labelled row of examples inside a Section. */
export function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="mb-4 min-w-0 last:mb-0">
      {label ? <p className="eyebrow mb-2">{label}</p> : null}
      <div className="flex min-w-0 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

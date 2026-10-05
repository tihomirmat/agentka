import { CalendarX2 } from 'lucide-react';
import { formatDateLong, formatTime } from '@/data/format';
import type { BookingMode } from '@/data/types';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { offerSentence, previewSlots, type SlotSettings } from './slots';

interface PreviewCardProps {
  settings: SlotSettings;
  mode: BookingMode;
  agentName: string;
  /** a form error makes the numbers unusable: say so instead of showing a wrong preview */
  invalid: boolean;
}

/** Live preview of what the agent would offer, computed from the unsaved settings on this page. */
export function PreviewCard({ settings, mode, agentName, invalid }: PreviewCardProps) {
  const preview = invalid ? null : previewSlots(settings);

  return (
    <Card>
      <CardHeader
        title="Tako bo agent ponudil termine"
        description="Predogled iz nastavitev na tej strani, ne iz pravega koledarja."
      />
      <CardBody className="flex flex-col gap-4">
        {invalid ? (
          <p className="flex items-start gap-2 text-base text-fg-muted">
            <CalendarX2 size={18} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden="true" />
            Predogleda ni mogoče izračunati. Popravite polja, označena z napako.
          </p>
        ) : preview ? (
          <>
            {mode === 'request' ? (
              <p className="text-sm text-fg-muted">
                Pri načinu »Povpraševanje« agent termina ne ponudi, ampak zapiše željo obiskovalca. Tako bi jih ponudil
                pri samodejni rezervaciji:
              </p>
            ) : null}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-fg-subtle">{agentName}</p>
              <p className="max-w-full self-start rounded-lg bg-surface-2 px-3 py-2 text-base text-fg">
                {offerSentence(preview)} Kateri vam ustreza?
              </p>
            </div>
            <div>
              <p className="eyebrow">Prvi prosti dan</p>
              <p className="mt-1 text-base font-medium text-fg">{formatDateLong(preview.day)}</p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {preview.slots.map((s) => (
                  <li key={s.start.getTime()} className="nums text-sm text-fg-muted">
                    {formatTime(s.start)}–{formatTime(s.end)}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="flex items-start gap-2 text-base text-fg-muted">
            <CalendarX2 size={18} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden="true" />
            Po teh nastavitvah agent ne bi ponudil nobenega termina. Odprite vsaj en dan, preverite delovni čas in
            pravila.
          </p>
        )}
        <p className="border-t border-border pt-3 text-sm text-fg-subtle">
          Izračunano samo iz delovnega časa in pravil. Zasedeni termini v koledarju niso upoštevani.
        </p>
      </CardBody>
    </Card>
  );
}

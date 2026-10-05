import { useEffect, useState } from 'react';
import { Select, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { LEAD_STATUS, LEAD_STATUS_ORDER } from '@/data/labels';
import { cn } from '@/lib/cn';

export interface LeadStatusSelectProps {
  lead: Pick<api.Lead, 'id' | 'name' | 'status'>;
  size?: 'sm' | 'md';
  /** width etc. of the trigger */
  className?: string;
}

/**
 * Changes the state of a contact (same control on Kontakti and on the conversation).
 * A new contact is drawn like a pill so it stands out; every other state stays plain.
 */
export function LeadStatusSelect({ lead, size = 'sm', className }: LeadStatusSelectProps) {
  const toast = useToast();
  const save = api.useAction(api.updateLeadStatus, { onError: (message) => toast.error(message) });
  // Show the choice at once; the list behind it refreshes a moment later.
  const [chosen, setChosen] = useState<api.LeadStatus | null>(null);
  useEffect(() => {
    if (chosen && lead.status === chosen) setChosen(null);
  }, [chosen, lead.status]);

  const shown = chosen ?? lead.status;
  const isNew = shown === 'new';

  return (
    <Select
      aria-label={`Stanje kontakta ${lead.name}`}
      size={size}
      value={shown}
      disabled={save.pending}
      className={cn(
        isNew &&
          'border-accent bg-accent-soft font-medium text-accent-soft-fg hover:border-accent-hover disabled:bg-accent-soft',
        className,
      )}
      leading={isNew ? <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> : undefined}
      options={LEAD_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS[s].label }))}
      onValueChange={async (next) => {
        if (next === lead.status) return;
        setChosen(next);
        const saved = await save.run(lead.id, next);
        if (saved) toast.success(`${lead.name}: stanje je zdaj »${LEAD_STATUS[next].label}«.`);
        else setChosen(null);
      }}
    />
  );
}

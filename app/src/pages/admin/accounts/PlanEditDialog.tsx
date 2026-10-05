import { useState, type FormEvent } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button, Dialog, Field, Input, useToast } from '@/components/ui';
import * as api from '@/data/api';

interface Draft {
  name: string;
  price: string;
  minutes: string;
  pages: string;
  agents: string;
}

type Errors = Partial<Record<keyof Draft, string>>;

function toDraft(plan: api.Plan): Draft {
  return {
    name: plan.name,
    price: String(plan.price_month_eur).replace('.', ','),
    minutes: String(plan.minutes_included),
    pages: String(plan.max_pages),
    agents: String(plan.max_agents),
  };
}

/** "59", "59,5" and "59.5" are accepted; anything else is NaN. */
function parseNumber(text: string): number {
  const clean = text.trim().replace(',', '.');
  return clean === '' ? Number.NaN : Number(clean);
}

function whole(text: string): number | null {
  const n = parseNumber(text);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

function validate(draft: Draft): Errors {
  const errors: Errors = {};
  if (!draft.name.trim()) errors.name = 'Vpišite ime paketa.';
  const price = parseNumber(draft.price);
  if (!Number.isFinite(price) || price <= 0) errors.price = 'Vpišite ceno v evrih, večjo od 0. Primer: 59';
  if (whole(draft.minutes) === null) errors.minutes = 'Vpišite število minut, celo število od 1 naprej. Primer: 300';
  if (whole(draft.pages) === null) errors.pages = 'Vpišite največje število strani, celo število od 1 naprej. Primer: 150';
  if (whole(draft.agents) === null) errors.agents = 'Vpišite največje število agentov, celo število od 1 naprej. Primer: 1';
  return errors;
}

export interface PlanEditDialogProps {
  plan: api.Plan;
  onClose: () => void;
}

/** Editing one plan. Only the fields that changed go to the API. */
export function PlanEditDialog({ plan, onClose }: PlanEditDialogProps) {
  const toast = useToast();
  const save = api.useAction(api.adminUpdatePlan);
  const [draft, setDraft] = useState<Draft>(() => toDraft(plan));
  const [attempted, setAttempted] = useState(false);

  const initial = toDraft(plan);
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== initial[k]);
  const errors = validate(draft);
  const shown: Errors = attempted ? errors : {};
  const set = (changes: Partial<Draft>) => setDraft((d) => ({ ...d, ...changes }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    const patch: api.PlanPatch = {};
    if (draft.name !== initial.name) patch.name = draft.name.trim();
    if (draft.price !== initial.price) patch.price_month_eur = parseNumber(draft.price);
    if (draft.minutes !== initial.minutes) patch.minutes_included = whole(draft.minutes) ?? plan.minutes_included;
    if (draft.pages !== initial.pages) patch.max_pages = whole(draft.pages) ?? plan.max_pages;
    if (draft.agents !== initial.agents) patch.max_agents = whole(draft.agents) ?? plan.max_agents;
    const saved = await save.run(plan.key, patch);
    if (!saved) return;
    toast.success(`Paket ${saved.name} je shranjen.`);
    onClose();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !save.pending) onClose();
      }}
      title={`Uredi paket ${plan.name}`}
      description="Spremenite ime, ceno in omejitve paketa."
      footer={
        <>
          {save.error ? (
            <p role="alert" className="mr-auto flex min-w-0 items-start gap-1.5 text-sm text-danger">
              <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
              <span>{save.error}</span>
            </p>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={save.pending}>
            Prekliči
          </Button>
          <Button type="submit" form="uredi-paket" variant="primary" disabled={!dirty} loading={save.pending}>
            Shrani paket
          </Button>
        </>
      }
    >
      <form id="uredi-paket" onSubmit={onSubmit} noValidate className="grid min-w-0 gap-x-4 gap-y-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Ime paketa" required error={shown.name}>
          <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Cena na mesec" required error={shown.price}>
          <Input
            inputMode="decimal"
            suffix="€"
            value={draft.price}
            onChange={(e) => set({ price: e.target.value })}
          />
        </Field>
        <Field label="Vključene minute" required error={shown.minutes}>
          <Input inputMode="numeric" suffix="min" value={draft.minutes} onChange={(e) => set({ minutes: e.target.value })} />
        </Field>
        <Field label="Največ strani" required error={shown.pages}>
          <Input inputMode="numeric" value={draft.pages} onChange={(e) => set({ pages: e.target.value })} />
        </Field>
        <Field label="Največ agentov" required error={shown.agents}>
          <Input inputMode="numeric" value={draft.agents} onChange={(e) => set({ agents: e.target.value })} />
        </Field>
        <Field className="sm:col-span-2" label="Stripe price id" hint="Samo za branje.">
          <Input mono readOnly value={plan.stripe_price_id ?? ''} placeholder="Ni povezan" />
        </Field>
      </form>
    </Dialog>
  );
}

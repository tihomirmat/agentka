# Conventions for screen engineers

You own **only your page file(s)** in `src/pages/**` (paths are a contract; default export; replace the whole placeholder). Do not edit `components/ui`, `components/layout`, `data/*`, `styles/*`, `routes.tsx` or config — if a primitive or an api function is missing, add a local component inside your page folder and report it. `npm run build` must stay green (strict TypeScript, unused variables are errors).

```
npm run dev          # local server          npm run build   # tsc --noEmit + vite build
npm run preview      # serves dist on :4173   npm run shots   # screenshots → ../shots/foundation (SHOTS_ROUTES=/app/viri,/app/termini)
```
Look at `/#/_ui` first: every primitive, variant and state is there, in Slovenian.

## Imports
```ts
import { Button, Card, CardHeader, CardBody, Field, Input, Table, useToast /* … */ } from '@/components/ui';
import { TopBarActions, WizardStep, useWizardStep, HOW_IT_WORKS_ID } from '@/components/layout';
import { AgentWidget, TranscriptBubble } from '@/components/widget';   // shared widget preview + transcript bubbles
import * as api from '@/data/api';            // data, types (api.Lead …), useQuery, useAction, useSession
import { formatDateTime, formatDuration, formatEur, plural } from '@/data/format';
import { LEAD_STATUS, AGENT_STATUS, BOOKING_MODE, WEEKDAYS } from '@/data/labels';
import { cn } from '@/lib/cn';                // joins classes, last conflicting Tailwind class wins
import { BRAND } from '@/brand';              // never type the product name
```
Icons: `lucide-react` only, 16–20 px, always `aria-hidden` next to a text label.

## Colour and tokens
- Every colour is a token from `src/styles/tokens.css`. Use the Tailwind names: `bg-bg`, `bg-surface`, `bg-surface-2`, `bg-surface-3`, `bg-raised` / `bg-raised-hover` (floating layers), `border-border`, `border-border-strong`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `accent` / `accent-hover` / `accent-fg` / `accent-soft` / `accent-soft-fg`, `success|warning|danger|info` (+ `-soft`), `danger-fg`, `inverse` / `inverse-fg`, `ring`, `overlay`.
- No hex/rgb/hsl in `.tsx`, no inline colour styles, no default palette classes (`text-gray-500`, `bg-white` produce **no CSS**). No opacity modifiers on colours (`bg-accent/50` does not work). No `dark:` variants — dark mode comes from the tokens.
- One accent. Semantic colours only for state. No gradients, no shadows on cards (shadows `shadow-md|lg` are for menus, dialogs, toasts), no emoji, no decorative illustration. `<Waveform>` only in the logo and the widget.
- Radius: `rounded` (6px controls), `rounded-lg` (10px cards), `rounded-sm` (chips), `rounded-full` (pills).

## Layout, spacing, type
- App and admin pages render **content only**: start with `<PageHeader title description actions />` (it is the `<h1>`), then sections. The shell already gives the centred column (max 72rem) and the gutter. Public pages are full width: wrap each section's content in `<div className="page">`. Landing must render `<section id={HOW_IT_WORKS_ID}>`.
- Wizard page: read the step with `useWizardStep()`, render `<WizardStep title description back skip next>`; save progress with `api.setOnboardingStep(n | 'done')`.
- Vertical rhythm: `gap-6` between sections/cards, `gap-4` inside a card, `gap-1.5` label→control (Field does it). Two-column pages (settings left, widget right): `grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]`.
- Must work at 400px with no horizontal page scroll. Every flex/grid child that holds text gets `min-w-0`; long strings get `truncate` or `break-words`. Tables only through `<Table minWidth>` (it scrolls inside its own box). Any own `overflow-x-auto` box must also be `relative`.
- Never `100vh`, `h-screen`, `min-h-screen`; sticky elements use the `sticky-top` class.
- Type scale only: `text-xs sm base md lg xl 2xl 3xl 4xl`. `font-display` for h1/h2 and stat values, never for body or buttons. Numbers in columns: `<TD numeric>` or class `nums`. Codes, ids, addresses: `font-mono`. Small caps labels: class `eyebrow`.
- At most one `variant="primary"` button per view. Page-level actions go in `PageHeader actions`; `<TopBarActions>` is for the one action that must stay visible while scrolling (e.g. "Namesti" on Pregled).

## Data
- Screens import data **only** from `@/data/api` (plus `format` and `labels`). Never `sample.ts`, `store.ts`, `localStorage`, `fetch`.
- Entity fields are snake_case as in SPEC §6 (`lead.what_they_wanted`); `Session` is camelCase. Dates are ISO strings → always print through `format.ts`. States → always through `labels.ts` + `<StatusPill tone label>`.
- Read: `const q = api.useQuery(() => api.listLeads(), [])` → `{ data, loading, error, reload }`. It refetches silently after **any** mutation, so lists update themselves; do not copy query data into state except for form drafts.
- Write: `const save = api.useAction(api.updateAgent)` → `save.run(patch)`, `save.pending`, `save.error`. `run` resolves to `undefined` on failure.
- Simulated actions return `ActionResult { ok, message, simulated }`. Show `result.message` unchanged (`toast.info` when `simulated`, else `toast.success`). Never claim something was sent/connected/paid when it was simulated.
- Forms: local draft state, "Shrani" disabled until something changed, validation errors on the `Field` (`error=`), server errors from `save.error`.

## Feedback
- Success/neutral result → `useToast()`: `toast.success('Nastavitve so shranjene.')`, `toast.error(...)`, `toast.info(result.message)`.
- Destructive or irreversible → `<ConfirmDialog tone="danger" title="Odstranim vir »…«?" confirmLabel="Odstrani vir" onConfirm={…} />`.
- Loading → `SkeletonRows` / `SkeletonText` shaped like the content. Query error → `EmptyState` with the error sentence and a "Poskusi znova" button calling `reload`.
- Every list has an `<EmptyState>`: one sentence saying what to do next + one action.

## Forbidden (the preview host blocks them)
`alert` `confirm` `prompt` `window.print` `window.open` · `<a download>` · `mailto:` / `tel:` links (use `<CopyValue>`) · direct `navigator.clipboard` (use `<CopyButton>` / `<CodeBlock>`) · file downloads (CSV: show `api.exportLeadsCsv()` text in a Dialog with CopyButton) · external images/scripts.

## Slovenian copy
- Vikanje, plain words, active voice, sentence case, correct č š ž. No exclamation marks, no "Ups", no marketing adjectives.
- Buttons say exactly what happens: "Shrani spremembe", "Poveži Google Koledar", "Odstrani vir" — never "V redu", "Potrdi", "Pošlji" alone.
- Errors: what went wrong + what to do. "E-naslov ni pravilno zapisan. Primer: ime@podjetje.si"
- Fixed words: agent (in the app; "glasovni pomočnik" only in marketing copy), viri znanja, pogovor, obiskovalec, kontakt (lead), rezervacija (booking), termin (slot), paket (plan), naročnina, pripomoček (widget), uporabniški račun (account) vs izdani računi (invoices), skrbnik platforme.
- Quotation marks »…«, dash –, time `14:30`, money `59 €` (via `formatEur`), plural via `plural(n, ['pogovor','pogovora','pogovori','pogovorov'])`.

## Worked example
```tsx
export default function Leads() {
  const leads = api.useQuery(() => api.listLeads(), []);
  const toast = useToast();
  const setStatus = api.useAction(api.updateLeadStatus, { onError: (m) => toast.error(m) });

  return (
    <>
      <PageHeader title="Kontakti" description="Obiskovalci, ki so agentu pustili svoje podatke." />
      <Card>
        {leads.loading ? <SkeletonRows rows={6} /> : leads.error ? (
          <EmptyState icon={CircleAlert} title={leads.error} action={<Button onClick={leads.reload}>Poskusi znova</Button>} />
        ) : (
          <Table minWidth={720} caption="Kontakti"
            empty={leads.data?.length === 0 && <EmptyState icon={Users} title="Ko obiskovalec pusti svoje podatke, se kontakt pojavi tukaj." />}>
            <THead><TR><TH>Ime</TH><TH>E-pošta</TH><TH>Stanje</TH></TR></THead>
            <TBody>
              {leads.data?.map((l) => (
                <TR key={l.id}>
                  <TD className="font-medium">{l.name}</TD>
                  <TD><CopyValue value={l.email} copyLabel="Kopiraj e-naslov" /></TD>
                  <TD>
                    <Select aria-label={`Stanje kontakta ${l.name}`} size="sm" className="w-40" value={l.status}
                      options={LEAD_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS[s].label }))}
                      onValueChange={async (s) => { if (await setStatus.run(l.id, s)) toast.success(`Stanje kontakta ${l.name} je spremenjeno.`); }} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
```

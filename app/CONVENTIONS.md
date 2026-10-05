# Conventions for screen engineers

You own **only your page file(s)** in `src/pages/**` (paths are a contract; default export). Do not edit `components/**`, `data/*`, `styles/*`, `lib/*`, `routes.tsx`, `scripts/*` or config — if a primitive or an api function is missing, report it. `npm run build` must stay green (strict TypeScript, unused variables are errors).

```
npm run dev          # local server           npm run build       # tsc --noEmit + vite build
npm run preview      # serves dist on :4173    npm run shots       # screenshots → ../shots/foundation (SHOTS_ROUTES=/app/viri,/app/termini)
npm run check:data   # data-layer checks       npm run sweep       # every screen, 4 combos; fails on OVERFLOW / FRAME / EXTERNAL / console errors
```
Look at `/#/_ui` first: every primitive, variant and state is there, in Slovenian. **Before writing a local component, check the list under "Shared primitives" — a second copy of something that exists there is a defect.**

## Imports
```ts
import { Button, Card, CardHeader, CardBody, Field, Input, Notice, SaveBar, Table, useDraft, useToast /* … */ } from '@/components/ui';
import { TopBarActions, WizardStep, useWizardStep, HOW_IT_WORKS_ID } from '@/components/layout';
import { AgentWidget, TranscriptBubble } from '@/components/widget';   // shared widget preview + transcript bubbles
import * as api from '@/data/api';            // data, types (api.Lead …), useQuery, useAction, useSession
import { formatRelativeDateTime, formatDuration, formatEur, plural } from '@/data/format';
import { LEAD_STATUS, AGENT_STATUS, AGENT_STATUS_HELP, TRIAL, COUNT_LABELS } from '@/data/labels';
import { cn } from '@/lib/cn';                // joins classes, last conflicting Tailwind class wins
import { BRAND } from '@/brand';              // never type the product name
```
Icons: `lucide-react` only, 16–20 px, always `aria-hidden` next to a text label.

## Colour and tokens
- Every colour is a token from `src/styles/tokens.css`. Use the Tailwind names: `bg-bg`, `bg-surface`, `bg-surface-2`, `bg-surface-3`, `bg-raised` / `bg-raised-hover` (floating layers), `border-border`, `border-border-strong`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `accent` / `accent-hover` / `accent-fg` / `accent-soft` / `accent-soft-fg`, `success|warning|danger|info` (+ `-soft`), `danger-solid` + `danger-fg` (the danger button only), `inverse` / `inverse-fg`, `ring`, `overlay`.
- No hex/rgb/hsl in `.tsx`, no inline colour styles, no default palette classes (`text-gray-500`, `bg-white` produce **no CSS**). No opacity modifiers on colours (`bg-accent/50` does not work). No `dark:` variants — dark mode comes from the tokens.
- One accent. Semantic colours only for state. No gradients, no shadows on cards (shadows `shadow-md|lg` are for menus, dialogs, toasts, the save bar), no emoji, no decorative illustration. `<Waveform>` only in the logo and the widget.
- The widget preview is a picture of the CUSTOMER's website: it uses the `widget-*` tokens (same in light and dark) and the customer's colour. Do not restyle it per theme.
- Radius: `rounded` (6px controls), `rounded-lg` (10px cards), `rounded-sm` (chips), `rounded-full` (pills). Fonts are part of the build (`styles/fonts.css`); never add a font or script from another host.

## Layout, spacing, type
- App and admin pages render **content only**: start with `<PageHeader title description actions />` (it is the `<h1>`), then sections. The shell gives the centred column (max 72rem) and the gutter. Public pages are full width: wrap each section's content in `<div className="page">`. Landing must render `<section id={HOW_IT_WORKS_ID}>`.
- **The frame never scrolls.** In the app, admin and wizard only `<main>` scrolls; the document is exactly as tall as the window (the sweep fails with `FRAME` otherwise). Every scroll box is a positioning context (global rule in `styles/index.css`), so `sr-only` and other absolutely positioned elements are safe — do not add `overflow` to `html`/`body`, do not use `position: fixed` for page content.
- Wizard page: read the step with `useWizardStep()`, render `<WizardStep title description back skip next>`; save progress with `api.setOnboardingStep(n | 'done')`. The shell has "Nadaljuj pozneje"; only reached steps are links.
- Vertical rhythm: `gap-6` between sections/cards, `gap-4` inside a card, `gap-1.5` label→control (Field does it). Two-column pages (settings left, widget right): `grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]`.
- Must work at 400px with no horizontal page scroll. Every flex/grid child that holds text gets `min-w-0`; long strings get `truncate` or `break-words`. A table with more than three columns uses `<Table minWidth={n} stackBelow={n}>` + `<TD label="…">`, so on a phone its rows become cards instead of scrolling sideways. Text links in lists and cards get the class `tap` (40px tall on touch).
- Never `100vh`, `h-screen`, `min-h-screen`; sticky elements use the `sticky-top` class.
- Type scale only: `text-xs sm base md lg xl 2xl 3xl 4xl`. `font-display` for h1/h2 and stat values, never for body or buttons. Numbers in columns: `<TD numeric>` or class `nums`. Codes, ids, addresses: `font-mono`. Small caps labels: class `eyebrow`.
- At most one `variant="primary"` button per view (the public header's button is secondary for that reason). Page-level actions go in `PageHeader actions`; `<TopBarActions>` is for the one action that must stay visible while scrolling.

## Shared primitives (after review 1)
| Need | Use | Notes |
|---|---|---|
| say something in the page (state, explanation, result that must stay) | `<Notice tone size title action live>` | tones neutral/info/success/warning/danger; `size="sm"` next to a control; one action |
| save a settings page | `useDraft(serverData)` + `<SaveBar dirty saving canSave blockedReason error onSave onDiscard>` | ONE bar per page, last element of the content; it includes the leave guard |
| ask before leaving unsaved changes without a SaveBar | `useUnsavedGuard(dirty)` → render what it returns | in-page dialog "Zavržem neshranjene spremembe?" |
| search a list | `<SearchField label placeholder value onChange>` | placeholder names the content, never a verb |
| switch a view (2–4 short options) | `<Segmented label value onChange options>` | becomes a Select under 480px |
| filter a list by state, with counts | `<FilterChips label value onChange options>` | chip word = the word the row shows (labels.ts) |
| time of day | `<TimeSelect value onValueChange step min max>` | always 24-hour; never `<input type="time">` |
| large either/or choice | `<ChoiceCard name value checked onSelect title description icon aside footer>` | inside `<fieldset><legend>` |
| destroy-everything confirmation | `<TypedConfirmDialog expected fieldLabel …>` (= `ConfirmDialog requireText`) | |
| facts of one thing | `<FactList items columns>` | label above value |
| summary numbers | `<Stat>` (`variant="inline"` inside a card) | names from `COUNT_LABELS` |
| checklist / steps | `<StepList steps showState>` | number or tick, state pill, one action |
| a plan | `<PlanCard plan current action extraRows>` | rows from `planFeatureRows`; no "Agenti" row |
| long text in a row | `<ClampedText text lines>` | |
| width of a box | `useContainerWidth()` | |
| a note that does not block saving | `<Field warning="…">` | `error` blocks, `warning` informs |
| a button inside a field | `<Input trailing={…}>` | field outline lights only for the input's own focus |
| a button that cannot be used now | `<Button disabledReason="…">` | never a silent grey button; reason shows on hover, focus and tap |
| copy | `<CopyButton onCopied onFallback>` / `<CodeBlock>` / `<CopyValue>` | `onCopied` fires only on a real clipboard success; for the fallback use `copyFallbackSentence('Kodo')` |
| tabs | `Tabs` | chips that wrap under 480px; inactive panels take no space |

## Data
- Screens import data **only** from `@/data/api` (plus `format` and `labels`). Never `sample.ts`, `store.ts`, `localStorage`, `fetch`.
- Entity fields are snake_case as in SPEC §6 (`lead.what_they_wanted`); `Session` is camelCase. Dates are ISO strings → always print through `format.ts`. States → always through `labels.ts` + `<StatusPill tone label>`.
- Read: `const q = api.useQuery(() => api.listLeads(), [])` → `{ data, loading, error, reload }`. It refetches silently after **any** mutation, so lists update themselves; do not copy query data into state except through `useDraft`.
- Write: `const save = api.useAction(api.updateAgent)` → `save.run(patch)`, `save.pending`, `save.error`. `run` resolves to `undefined` on failure.
- Simulated actions return `ActionResult { ok, message, simulated }`. Show `result.message` unchanged (it reads "Predogled: … V polni različici …"). Never claim something was sent/connected/paid when it was simulated.
- **One source of truth.** Counts come from `api.getOverviewStats()` / `api.summarizeConversations(list)` and are named with `COUNT_LABELS` — two numbers that can differ never share a name. The trial is `TRIAL.name` ("Brezplačni preizkus") with numbers from `api.getTrialTerms()` + `formatTrialTerms()`; say nothing about payment cards. The owner's e-mail is `EMAIL_KIND.owner_notification` ("Obvestilo vam"; public pages: `EMAIL_KIND_PUBLIC`). Plan rows come from `planFeatureRows(plan)`.
- **Agent state.** Finishing the wizard activates the agent only when it has an included source; otherwise it stays "Osnutek". Ask `api.getAgentReadiness()` → `{ canActivate, missing[] }`, switch with `api.activateAgent()` / `pauseAgent()` / `resumeAgent()` (they refuse with a readable sentence). Wherever the state is shown with room for a sentence, print `AGENT_STATUS_HELP[status]`; for a paused agent add `PAUSED_BY[agent.paused_by]` (customer / admin / limit / payment are separate — lifting one never lifts another). Never write your own explanation of "Osnutek".
- **Admin data is numbers only.** `adminListAccounts` / `adminGetAccount` return counts, times and error lines without any visitor name, address, phone, transcript or topic; do not try to show more.

## Dates, time, duration (one rule, all in `format.ts`)
- A moment in a list or card: `formatRelativeDateTime` → "danes ob 14:30", "včeraj ob 09:05", "jutri ob 10:00", otherwise weekday + date "sob., 3. okt. ob 13:22". A day as a heading: `formatWeekdayDate`. A date in a table or document: `formatDate`. Ranges: `formatClockRange`, `formatTimeRange`.
- Time is always 24-hour `14:30`. A length of time is `formatDuration` → "8 min 18 s" (never "08:18"); the position inside a transcript is `formatTimecode` → "01:24". Days left: `formatDaysLeft`. Do not create date helpers in a page.

## Feedback — how a result is shown (one rule)
- A result that **changes what the person sees on the page** (a row, a pill, a saved form) → **toast only**: `toast.success('Nastavitve so shranjene.')`. Toasts sit at the top (right on desktop, centre on a phone), dismiss themselves, at most one per tone, and are cleared when the page changes.
- A result the person **must read and keep** (a simulated outside action: calendar connect, test e-mail, import/sync, billing portal, plan change) → **ONE inline `<Notice size="sm">` next to the control** with `result.message`, kept until the next action. **No toast. Never both.**
- An error of an action → `toast.error(...)`, or on the `Field` (`error=`) when it belongs to a field; a save error shows in the `SaveBar` (`error=`).
- **States the shell already shows** (one strip under the top bar, by priority): payment failed · minutes used up · setup wizard unfinished · setup finished but agent still a draft. Do not repeat them in page content. The strip is hidden on the page that resolves it — Naročnina (payment, minutes) and Pregled (setup, draft) — where the page's own notice or checklist says it once.
- Destructive or irreversible → `<ConfirmDialog tone="danger" title="Odstranim vir »…«?" confirmLabel="Odstrani vir" onConfirm={…} />`.
- Loading → `SkeletonRows` / `SkeletonText` shaped like the content. Query error → `EmptyState` with the error sentence and a "Poskusi znova" button calling `reload`.
- Every list has an `<EmptyState>`: one sentence saying what to do next + one action.

## Forbidden (the preview host blocks them)
`alert` `confirm` `prompt` `window.print` `window.open` · `<a download>` · `mailto:` / `tel:` links (use `<CopyValue>`) · direct `navigator.clipboard` (use `<CopyButton>` / `<CodeBlock>`) · file downloads (CSV: show `api.exportLeadsCsv()` text in a Dialog with CopyButton) · external images/scripts/fonts · `<input type="time">`.

## Slovenian copy
- Vikanje, plain words, active voice, sentence case, correct č š ž. No exclamation marks, no "Ups", no marketing adjectives. No developer words ("strežnik", "faza", "simulirano", "sinhronizacija" where "znova preberi" says it).
- Buttons say exactly what happens: "Shrani spremembe", "Poveži Google Koledar", "Odstrani vir" — never "V redu", "Potrdi", "Pošlji" alone.
- Errors: what went wrong + what to do. "E-naslov ni pravilno zapisan. Primer: ime@podjetje.si"
- Fixed words: agent (in the app; "pomočnik" on public pages, "glasovni pomočnik" only in marketing copy), viri znanja, pogovor, prepis (of a conversation), obiskovalec, kontakt (lead), rezervacija (booking), termin (slot), paket (plan), naročnina, brezplačni preizkus, pripomoček (widget), uporabniški račun (account) vs izdani računi (invoices), e-naslov (the address) vs e-pošta (the message), skrbnik platforme. Voices are named by character ("Ženski glas, topel"), never by a person's name.
- Quotation marks »…«, dash –, time `14:30`, money `59 €` (via `formatEur`), plural via `plural(n, ['pogovor','pogovora','pogovori','pogovorov'])` (days: `DAY_FORMS`).

## Migration notes for page engineers (old local component → shared primitive)
| Old (delete after migrating) | New |
|---|---|
| `wizard/parts.tsx` `Callout`, `overview/parts.tsx` `Notice`, `subscription/Notice.tsx`, `screen-kit/ResultNote.tsx`, `public/auth/FormError.tsx`, grey strips in `Bookings.tsx` / `Notifications.tsx` | `Notice` (`ResultNote` → `size="sm" tone="neutral"`) |
| `screen-kit/SaveBar.tsx` (`visible` → `dirty`), `settings/SaveFooter.tsx`, footer in `overview/InstructionsCard.tsx` | `SaveBar` — one per page |
| `screen-kit/useDraft.ts`, `settings/useDraft.ts`, wizard draft state | `useDraft` from `@/components/ui` |
| `inbox/SearchField.tsx`, raw `<Input type="search">` | `SearchField` |
| `inbox/Segmented.tsx`; status pills in `Leads.tsx`; filter selects | `Segmented` / `FilterChips` |
| native time inputs (`booking/HoursCard.tsx`), time selects in `wizard/steps/BookingStep.tsx` | `TimeSelect` |
| `wizard/parts.tsx` `ChoiceOption`, `booking/ModeCard.tsx` cards, colour/position/voice cards | `ChoiceCard` |
| `settings/TypedConfirmDialog.tsx` | `TypedConfirmDialog` (same props) |
| `subscription/Facts.tsx`, `overview/parts.tsx` `Row`, `DataRow`, admin `Item` | `FactList` |
| summary strip in `Conversations.tsx`, boxes in admin `DetailCards.tsx`, tiles in `overview/KnowledgeCard.tsx` | `Stat` (`variant="inline"`) + `api.summarizeConversations` + `COUNT_LABELS` |
| `install/Checklist.tsx`, `overview/SetupChecklist.tsx` rows, step list on `Register.tsx` | `StepList` |
| `public/pricing/PlanCard.tsx`, `landing/PlansRow.tsx`, cards in `subscription/PlansSection.tsx`, `admin/Plans.tsx` | `PlanCard` |
| `inbox/ClampedText.tsx`, `inbox/useContainerWidth.ts` | `ClampedText`, `useContainerWidth` from `@/components/ui` |
| `inbox/dates.ts` (now only re-exports) | `formatRelativeDateTime`, `formatWeekdayDate`, `nearDayHint`, `formatClockRange`, `minutesBetween` from `@/data/format` |
| tables that scroll sideways on a phone (invoices, admin accounts) or switch to hand-made cards | `<Table stackBelow>` + `<TD label>` |
| inline + toast for the same result (Obvestila, Viri, Termini) | the results rule above: Notice only |
| page copies of "payment failed / setup unfinished" | remove — the shell strip covers them |
| `api.register({ name })`, `adminGetAccount().recent_conversations / users`, `formatDuration` for transcript marks, `EMAIL_KIND` on public pages, `SAMPLE_VOICES[].name` as a person, default e-mail texts typed into `notifications/templates.tsx` | `register({ ownerName, businessName, website, email, password })`, `detail.period.*`, `formatTimecode`, `EMAIL_KIND_PUBLIC`, `defaultFirstMessage(name, business, voiceId)`, `api.DEFAULT_EMAIL_TEMPLATES` |

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
          <Table minWidth={720} stackBelow={720} caption="Kontakti"
            empty={leads.data?.length === 0 && <EmptyState icon={Users} title="Ko obiskovalec pusti svoje podatke, se kontakt pojavi tukaj." />}>
            <THead><TR><TH>Ime</TH><TH>E-naslov</TH><TH>Stanje</TH></TR></THead>
            <TBody>
              {leads.data?.map((l) => (
                <TR key={l.id}>
                  <TD className="font-medium">{l.name}</TD>
                  <TD label="E-naslov"><CopyValue value={l.email} copyLabel="Kopiraj e-naslov" /></TD>
                  <TD label="Stanje">
                    <Select aria-label={`Stanje kontakta ${l.name}`} size="sm" className="w-40" value={l.status}
                      options={LEAD_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS[s].label }))}
                      // the row changes → toast only
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

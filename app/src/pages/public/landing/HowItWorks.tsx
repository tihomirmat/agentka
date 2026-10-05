import { useState, type ReactNode } from 'react';
import { Circle, CircleCheck, Mail } from 'lucide-react';
import { BRAND } from '@/brand';
import { HOW_IT_WORKS_ID } from '@/components/layout';
import { Card, CardBody, CodeBlock, StatusPill, Switch } from '@/components/ui';
import { TranscriptBubble } from '@/components/widget';
import { formatNumber, formatTimecode } from '@/data/format';
import { SOURCE_STATUS } from '@/data/labels';
import { cn } from '@/lib/cn';
import { Section, SectionHead } from './Section';
import {
  EXAMPLE_AGENT,
  EXAMPLE_EMBED_CODE,
  EXAMPLE_PAGES,
  EXAMPLE_SITE,
  EXAMPLE_TURNS,
} from './example';

/** Three real steps, each with the thing the owner actually sees at that step. */
export function HowItWorks() {
  return (
    <Section id={HOW_IT_WORKS_ID} labelledBy="kako-deluje-naslov">
      <SectionHead
        id="kako-deluje-naslov"
        title="Kako deluje"
        lead="V treh korakih je pomočnik na vaši spletni strani. Primeri spodaj prikazujejo izmišljeni frizerski salon."
      />
      <ol className="mt-8 grid gap-x-6 gap-y-10 lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-y-0">
        <Step
          n={1}
          title="Vpišete naslov svoje spletne strani"
          text={`${BRAND} prebere besedilo vaših strani. Tiste, ki jih agent ne sme uporabiti, izklopite.`}
        >
          <PagesExample />
        </Step>
        <Step
          n={2}
          title="Prilepite eno vrstico kode"
          text="Vrstico vstavite v kodo svoje spletne strani. Na njej se pojavi pripomoček, prek katerega obiskovalci govorijo ali pišejo z agentom."
        >
          <InstallExample />
        </Step>
        <Step
          n={3}
          title="Obiskovalci se pogovarjajo, vi dobite povzetek"
          text={`Po vsakem pogovoru vam ${BRAND} pošlje povzetek po e-pošti, pogovor pa ostane zapisan v aplikaciji.`}
        >
          <ConversationExample />
        </Step>
      </ol>
    </Section>
  );
}

/**
 * One step: number and title, one sentence, then the example. On wide screens the three
 * steps share three grid rows (subgrid), so titles, sentences and cards line up.
 */
function Step({ n, title, text, children }: { n: number; title: string; text: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 flex-col gap-3 lg:row-span-3 lg:grid lg:grid-rows-subgrid lg:gap-y-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="nums inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-sm font-medium text-accent-soft-fg"
        >
          {n}
        </span>
        <h3 className="min-w-0 pt-0.5 text-md font-semibold text-fg">
          <span className="sr-only">Korak {n}: </span>
          {title}
        </h3>
      </div>
      <p className="text-base text-fg-muted">{text}</p>
      <div className="flex min-w-0 flex-col">{children}</div>
    </li>
  );
}

/** Step 1: the address and the list of pages found, with a switch per page (they really toggle). */
function PagesExample() {
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(EXAMPLE_PAGES.map((p) => [p.id, p.included])),
  );
  const used = EXAMPLE_PAGES.filter((p) => included[p.id]).length;
  return (
    <Card className="flex-1">
      <CardBody className="flex flex-col gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Naslov spletne strani</p>
          <p className="mt-1.5 truncate rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg">
            https://{EXAMPLE_SITE}
          </p>
        </div>
        <p className="eyebrow">
          Prebrane strani · {used} od {formatNumber(EXAMPLE_PAGES.length)} v uporabi
        </p>
      </CardBody>
      <ul className="mt-1 divide-y divide-border">
        {EXAMPLE_PAGES.map((page) => {
          const on = included[page.id] ?? false;
          const state = SOURCE_STATUS[on ? 'synced' : 'excluded'];
          return (
            <li key={page.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <Switch
                checked={on}
                onCheckedChange={(v) => setIncluded((x) => ({ ...x, [page.id]: v }))}
                aria-label={`Uporabi stran »${page.title}«`}
              />
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-base font-medium', on ? 'text-fg' : 'text-fg-subtle')}>{page.title}</p>
                <p className="truncate font-mono text-xs text-fg-subtle">{page.path}</p>
              </div>
              <StatusPill tone={state.tone}>{state.label}</StatusPill>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Step 2: the one line of code, and the install checklist the app shows afterwards. */
function InstallExample() {
  const checks: { done: boolean; text: string }[] = [
    { done: true, text: 'Koda je kopirana' },
    { done: true, text: `Dovoljena domena: ${EXAMPLE_SITE}` },
    { done: false, text: 'Zadnji pogovor s te domene: še ni pogovora' },
  ];
  return (
    <Card className="flex-1">
      <CardBody className="flex flex-col gap-4">
        <CodeBlock label="Koda za vgradnjo" code={EXAMPLE_EMBED_CODE} />
        <p className="text-sm text-fg-subtle">Primer kode. Pravo kodo dobite v zadnjem koraku nastavitve.</p>
        <div>
          <p className="eyebrow">Preverjanje namestitve</p>
          <ul className="mt-2 flex flex-col gap-2">
            {checks.map((c) => (
              <li key={c.text} className="flex items-start gap-2 text-base text-fg">
                {c.done ? (
                  <CircleCheck size={18} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <Circle size={18} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                )}
                <span className="min-w-0 break-words">
                  <span className="sr-only">{c.done ? 'Opravljeno: ' : 'Še ni: '}</span>
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}

/** Step 3: the start of a conversation as saved transcript bubbles, and the summary mail. */
function ConversationExample() {
  return (
    <Card className="flex-1">
      <CardBody className="flex flex-col gap-3">
        <p className="eyebrow">Izsek pogovora</p>
        {EXAMPLE_TURNS.map((turn) => (
          <TranscriptBubble
            key={turn.timeSec}
            role={turn.role}
            speaker={turn.role === 'agent' ? EXAMPLE_AGENT : 'Obiskovalec'}
            time={formatTimecode(turn.timeSec)}
          >
            {turn.text}
          </TranscriptBubble>
        ))}
      </CardBody>
      <div className="flex items-start gap-2.5 border-t border-border px-4 py-3 sm:px-5">
        <Mail size={18} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden="true" />
        <p className="min-w-0 text-sm text-fg-muted">
          <span className="font-medium text-fg">Po pogovoru vam pride e-pošta s povzetkom</span>
          <br />
          Povzetek, podatki obiskovalca in dogovorjeni termin.
        </p>
      </div>
    </Card>
  );
}

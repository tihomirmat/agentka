import { Card, CardBody, CardFooter, CardHeader, SampleDataNote, StatusPill } from '@/components/ui';
import { formatDuration } from '@/data/format';
import { BOOKING_STATUS, CONVERSATION_OUTCOME, EMAIL_KIND_PUBLIC, EMAIL_STATUS } from '@/data/labels';
import { Section, SectionHead } from './Section';
import { EXAMPLE_CONVERSATION as c } from './example';

const OUTCOME_HELP: { key: keyof typeof CONVERSATION_OUTCOME; text: string }[] = [
  { key: 'question', text: 'Obiskovalec je dobil odgovor in ni pustil podatkov.' },
  { key: 'lead', text: 'Obiskovalec je pustil svoje podatke. Kontakt se zapiše med kontakte.' },
  { key: 'booking', text: 'Obiskovalec je zaprosil za termin ali ga rezerviral. Zapiše se med rezervacije.' },
];

/**
 * A static excerpt of Pogovori → detail. api.listConversations() needs a signed-in
 * account (it throws "Niste prijavljeni"), so this card is a local example, marked as such.
 */
export function WhatYouSee() {
  const outcome = CONVERSATION_OUTCOME[c.outcome];
  const booking = BOOKING_STATUS[c.bookingStatus];
  return (
    <Section labelledBy="kaj-vidite-vi-naslov">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16">
        <div className="min-w-0">
          <SectionHead
            id="kaj-vidite-vi-naslov"
            title="Kaj vidite vi"
            lead="V aplikaciji najdete vsak pogovor s povzetkom, podatki, ki jih je obiskovalec pustil, in izidom. Pogovor lahko preberete tudi kot zapis po vrsti."
          />
          <p className="eyebrow mt-8">Trije izidi pogovora</p>
          <ul className="mt-3 flex flex-col gap-3">
            {OUTCOME_HELP.map(({ key, text }) => (
              <li key={key} className="flex flex-wrap items-start gap-x-3 gap-y-1 sm:flex-nowrap">
                <span className="sm:w-28 sm:shrink-0">
                  <StatusPill tone={CONVERSATION_OUTCOME[key].tone}>{CONVERSATION_OUTCOME[key].label}</StatusPill>
                </span>
                <p className="min-w-0 basis-full text-base text-fg-muted sm:basis-auto">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <Card>
          <CardHeader
            as="h3"
            title={c.title}
            description={`Trajanje ${formatDuration(c.durationSec)}`}
            divider
            action={<StatusPill tone={outcome.tone}>{outcome.label}</StatusPill>}
          />
          <CardBody className="flex flex-col gap-5 pt-4 sm:pt-5">
            <div>
              <h3 className="eyebrow">Povzetek</h3>
              <p className="mt-1.5 text-base text-fg">{c.summary}</p>
            </div>
            <div>
              <h3 className="eyebrow">Zbrani podatki</h3>
              <dl className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5 text-base">
                {c.data.map((row) => (
                  <div key={row.label} className="contents">
                    <dt className="text-fg-muted">{row.label}</dt>
                    <dd className="min-w-0 break-words text-fg">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="eyebrow">Dogovorjeno</h3>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-base text-fg">
                {c.agreed}
                <StatusPill tone={booking.tone}>{booking.label}</StatusPill>
              </p>
            </div>
            <div>
              <h3 className="eyebrow">Poslana sporočila</h3>
              <ul className="mt-1.5 flex flex-col gap-1.5 text-base">
                {(
                  [
                    ['visitor_confirmation', c.visitorEmail],
                    ['owner_notification', c.ownerEmail],
                  ] as const
                ).map(([kind, status]) => (
                  <li key={kind} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="text-fg-muted">{EMAIL_KIND_PUBLIC[kind]}</span>
                    <StatusPill tone={EMAIL_STATUS[status].tone}>{EMAIL_STATUS[status].label}</StatusPill>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
          <CardFooter className="justify-start gap-3 rounded-b-lg bg-surface-2 text-sm text-fg-muted">
            <SampleDataNote />
            Izmišljen pogovor, prikazan tako, kot ga vidite v aplikaciji.
          </CardFooter>
        </Card>
      </div>
    </Section>
  );
}

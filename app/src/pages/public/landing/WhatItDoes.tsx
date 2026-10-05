import type { ReactNode } from 'react';
import { BOOKING_MODE } from '@/data/labels';
import { Section, SectionHead } from './Section';

/** Plain statements of what the assistant does. No promises of results. Public pages say "pomočnik". */
export function WhatItDoes() {
  return (
    <Section labelledBy="kaj-pomocnik-naredi-naslov">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-16">
        <SectionHead
          id="kaj-pomocnik-naredi-naslov"
          title="Kaj pomočnik naredi"
          lead="Pomočnik dela po jasnih pravilih, ko obiskovalec na vaši spletni strani odpre pogovor."
        />
        <dl className="divide-y divide-border border-y border-border">
          <Item term="Odgovarja iz vaše spletne strani">
            Odgovore išče samo v besedilu vaše spletne strani ter v datotekah in besedilih, ki jih dodate sami. Če
            odgovora v njih ni, to pove obiskovalcu in ponudi klic nazaj.
          </Item>
          <Item term="Ponudi termine in jih zapiše">
            <p>Obiskovalcu pomaga do termina na enega od dveh načinov. Izberete ga sami.</p>
            <ul className="mt-2 flex flex-col gap-2">
              <li>
                <span className="font-medium text-fg">{BOOKING_MODE.request.label}.</span> Pomočnik zapiše želeni
                termin, vi ga potrdite po e-pošti. Deluje brez koledarja.
              </li>
              <li>
                <span className="font-medium text-fg">{BOOKING_MODE.auto.label}.</span> Pomočnik ponudi proste
                termine iz vašega Google Koledarja in termin vpiše sam.
              </li>
            </ul>
          </Item>
          <Item term="Pošlje potrditev in povzetek">
            Če je obiskovalec vpisal e-naslov, prejme potrditev. Vi prejmete povzetek pogovora s podatki, ki jih je
            pustil. Obe sporočili lahko vklopite ali izklopite.
          </Item>
          <Item term="Pove, da je umetna inteligenca">
            V prvem stavku se predstavi kot AI pomočnik vašega podjetja in to potrdi, če ga obiskovalec vpraša.
          </Item>
        </dl>
      </div>
    </Section>
  );
}

function Item({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 py-5 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-6">
      <dt className="text-md font-semibold text-fg">{term}</dt>
      <dd className="min-w-0 text-base text-fg-muted">{children}</dd>
    </div>
  );
}

import { ChevronDown } from 'lucide-react';
import { Section, SectionHead } from './Section';

/**
 * Honest answers to what a careful owner asks. Each answer states only what the product
 * does according to the spec — no legal, data-location or result claims.
 */
const QUESTIONS: { q: string; a: string }[] = [
  {
    q: 'Ali agent res govori slovensko?',
    a: 'Slovenščina je privzeti jezik agenta, odgovarja z vikanjem in v kratkih stavkih. V nastavitvah lahko izberete tudi hrvaščino, srbščino ali angleščino. Preden agenta namestite na stran, ga preizkusite sami in presodite, ali vam ustreza.',
  },
  {
    q: 'Kaj če agent ne ve odgovora?',
    a: 'Agent odgovarja samo iz virov, ki ste jih dodali: besedila vaše spletne strani, datotek in besedil. Če odgovora v njih ni, to pove in ponudi klic nazaj. Cen, rokov ali obljub, ki jih v virih ni, ne navaja. Podatke, ki jih obiskovalec pusti, vidite med kontakti.',
  },
  {
    q: 'Ali obiskovalec ve, da govori z umetno inteligenco?',
    a: 'Da. Agent se v prvem stavku predstavi kot AI pomočnik vašega podjetja in to potrdi, če ga obiskovalec vpraša.',
  },
  {
    q: 'Kaj potrebujem za začetek?',
    a: 'Spletno stran z besedilom, e-naslov za obvestila in možnost, da na stran vstavite eno vrstico kode. Google Koledar potrebujete samo za samodejno rezervacijo, povpraševanje deluje brez njega. Nastavitev vodi čarovnik v petih korakih, vsakega lahko preskočite in dokončate pozneje.',
  },
  {
    q: 'Kaj se zgodi, ko porabim minute?',
    a: 'Ko porabite 80 % vključenih minut, vam pošljemo e-pošto. Pri 100 % se agent začasno ustavi: pripomoček obiskovalcu z enim stavkom pove, da pomočnik trenutno ni na voljo. Ko se obdobje obnovi ali preidete na višji paket, agent samodejno spet začne delovati.',
  },
  {
    q: 'Ali lahko kadarkoli prekinem?',
    a: 'Naročnino in plačilo upravljate sami v razdelku Naročnina, račun z vsemi podatki pa lahko izbrišete v Nastavitvah. Za preizkus vam ni treba izbrati paketa.',
  },
];

export function Faq() {
  return (
    <Section labelledBy="vprasanja-naslov">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-16">
        <SectionHead
          id="vprasanja-naslov"
          title="Pogosta vprašanja"
          lead="Kar nas najpogosteje vprašajo lastniki podjetij, preden začnejo."
        />
        <div className="border-t border-border">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group border-b border-border">
              <summary className="flex min-w-0 list-none items-start justify-between gap-4 rounded py-4 text-md font-medium text-fg [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">{q}</span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
                />
              </summary>
              <p className="max-w-prose pb-5 text-base text-fg-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

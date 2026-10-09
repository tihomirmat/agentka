/**
 * Answers to what a careful owner is likely to ask. Each answer states only what the product
 * does according to the spec — no legal, data-location or result claims, and no language
 * other than Slovenian until it has been tested. Public pages say "pomočnik", not "agent".
 */
export const QUESTIONS: { q: string; a: string }[] = [
  {
    q: 'Ali pomočnik res govori slovensko?',
    a: 'Odgovarja po slovensko, z vikanjem in v kratkih stavkih. Preden pomočnika namestite na stran, ga preizkusite sami in presodite, ali vam ustreza.',
  },
  {
    q: 'Kaj če pomočnik ne ve odgovora?',
    a: 'Pomočnik odgovarja samo iz virov, ki ste jih dodali: besedila vaše spletne strani, datotek in besedil. Če odgovora v njih ni, to pove in ponudi klic nazaj. Cen, rokov ali obljub, ki jih v virih ni, ne navaja. Podatke, ki jih obiskovalec pusti, vidite med kontakti.',
  },
  {
    q: 'Ali obiskovalec ve, da govori z umetno inteligenco?',
    a: 'Da. Pomočnik se v prvem stavku predstavi kot AI pomočnik vašega podjetja in to potrdi, če ga obiskovalec vpraša.',
  },
  {
    q: 'Kaj potrebujem za začetek?',
    a: 'Spletno stran z besedilom (ali datoteke in besedila, ki jih dodate sami), e-naslov za obvestila in možnost, da na stran vstavite eno vrstico kode. Google Koledar potrebujete samo za samodejno rezervacijo, povpraševanje deluje brez njega. Nastavitev vodi čarovnik v petih korakih. Prekinete jo lahko kadar koli in nadaljujete pozneje.',
  },
  {
    q: 'Kaj se zgodi, ko porabim minute?',
    a: 'Ko porabite 80 % vključenih minut, vam pošljemo e-pošto. Pri 100 % se pomočnik začasno ustavi: pripomoček obiskovalcu z enim stavkom pove, da pomočnik trenutno ni na voljo. Ko se obdobje obnovi ali preidete na višji paket, pomočnik samodejno spet začne delovati.',
  },
  {
    q: 'Kaj če si premislim?',
    a: 'Uporabniški račun z vsemi podatki lahko kadar koli izbrišete v Nastavitvah. Za brezplačni preizkus vam ni treba izbrati paketa.',
  },
];

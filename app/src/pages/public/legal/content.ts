/**
 * Legal texts of agentka.si: terms of use with the data processing agreement (DPA) as an annex,
 * the privacy policy and the list of sub-processors. One source for the pages and the footer.
 *
 * Plain data on purpose: the texts change by editing this file only. When they change in
 * substance, raise LEGAL_VERSION — the sign-up form sends it to the server with the consent.
 */
import { BRAND } from '@/brand';

export const LEGAL_VERSION = '2026-11-11';

/** The provider (controller for agentka.si, processor for the customers' callers). */
export const COMPANY = {
  name: 'Spletni marketing, Tihomir Matijević s.p.',
  address: 'Trg borcev NOB 18, 1431 Dol pri Hrastniku',
  taxId: 'SI21302413',
  regNo: '8346666000',
  vat: 'zavezanec za DDV',
  email: '__COMPANY_EMAIL__',
};

export interface Subprocessor {
  name: string;
  purpose: string;
  location: string;
  transfer: string;
  url: string;
}

export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: 'Hetzner Online GmbH',
    purpose: 'Gostovanje spletne strani, aplikacije in baze podatkov (prijave, računi, prepisi pogovorov)',
    location: 'Nemčija (EU)',
    transfer: 'Ni prenosa iz EU',
    url: 'https://www.hetzner.com/legal/privacy-policy',
  },
  {
    name: 'ElevenLabs (Eleven Labs Inc. in povezane družbe)',
    purpose:
      'Glasovni pogovor: prepoznavanje govora, tvorjenje odgovora z jezikovnim modelom, sinteza glasu, začasna hramba prepisov',
    location: 'ZDA',
    transfer: 'EU–ZDA okvir za varstvo podatkov (Data Privacy Framework)',
    url: 'https://elevenlabs.io/privacy-policy',
  },
  {
    name: 'Resend',
    purpose: 'Pošiljanje e-pošte (potrditve, povzetki pogovorov, obvestila)',
    location: 'ZDA (pošiljanje iz regije EU, Irska)',
    transfer: 'EU–ZDA okvir za varstvo podatkov (Data Privacy Framework)',
    url: 'https://resend.com/legal/privacy-policy',
  },
  {
    name: 'Stripe Payments Europe, Ltd.',
    purpose: 'Obračun naročnine in plačila s kartico',
    location: 'Irska (EU)',
    transfer: 'Ni prenosa iz EU za obdelavo v imenu ponudnika',
    url: 'https://stripe.com/privacy',
  },
  {
    name: 'Google (Google Ireland Limited, Google LLC)',
    purpose: 'Rezervacija terminov v Google Koledarju, samo če naročnik koledar poveže',
    location: 'EU in ZDA',
    transfer: 'EU–ZDA okvir za varstvo podatkov (Data Privacy Framework)',
    url: 'https://policies.google.com/privacy',
  },
];

/** One block of a legal page: a heading and paragraphs and/or a bullet list. */
export interface LegalSection {
  h: string;
  p?: string[];
  list?: string[];
}

const c = COMPANY;
const companyLine = `${c.name}, ${c.address}, davčna številka ${c.taxId}, matična številka ${c.regNo}, ${c.vat}`;

/* ------------------------------------------------------------------ privacy */

export const PRIVACY: LegalSection[] = [
  {
    h: '1. Upravljavec',
    p: [
      `Upravljavec osebnih podatkov, ki jih zbiramo na spletni strani agentka.si, je ${companyLine}. Kontakt za vprašanja o varstvu podatkov: ${c.email}.`,
    ],
  },
  {
    h: '2. Katere podatke obdelujemo in zakaj',
    list: [
      'Prijava (obrazec »Začnite brezplačno«): ime in priimek, ime podjetja, e-naslov in po želji naslov spletne strani. Namen: da se vam oglasimo in dogovorimo za začetek uporabe storitve. Pravna podlaga: ukrepi pred sklenitvijo pogodbe na vašo zahtevo (člen 6(1)(b) GDPR).',
      'Uporabniški račun in naročnina: podatki o podjetju, kontaktni podatki, nastavitve pomočnika, podatki o plačilih. Namen: izvajanje pogodbe in izdaja računov. Pravna podlaga: pogodba (člen 6(1)(b)) in zakonske obveznosti (člen 6(1)(c)).',
      'Glasovni preizkus na prvi strani: vaš glas se med pogovorom pretaka v obdelavo, shrani se prepis pogovora. Namen: predstavitev storitve. Pravna podlaga: vaše dejanje, ko pogovor sami začnete (člen 6(1)(a) GDPR). Posnetka glasu ne hranimo.',
      'Tehnični podatki: strežnik začasno obdela naslov IP za zaščito pred zlorabami (omejitev števila poskusov). Naslova IP ne shranjujemo.',
    ],
  },
  {
    h: '3. Koliko časa hranimo podatke',
    list: [
      'Prijave: dokler ne zahtevate izbrisa, najdlje 2 leti, nato se samodejno izbrišejo.',
      'Prepisi glasovnega preizkusa: 30 dni.',
      'Podatki uporabniškega računa: ves čas trajanja naročnine in največ 90 dni po njenem koncu; računovodske listine toliko časa, kot zahteva zakon.',
    ],
  },
  {
    h: '4. Komu posredujemo podatke',
    p: [
      'Podatke obdelujejo samo naši pogodbeni obdelovalci (podizvajalci), ki so navedeni na strani Podizvajalci. Del obdelave poteka v ZDA pri podjetjih, ki so vključena v EU–ZDA okvir za varstvo podatkov (Data Privacy Framework), za katerega je Evropska komisija sprejela sklep o ustreznosti. Podatkov ne prodajamo in jih ne uporabljamo za oglaševanje.',
    ],
  },
  {
    h: '5. Piškotki',
    p: [
      'Stran ne uporablja analitičnih ali oglasnih piškotkov. V brskalniku hranimo samo tehnične podatke, ki so nujni za delovanje predogleda aplikacije (lokalna shramba brskalnika). Zanje privolitev ni potrebna.',
    ],
  },
  {
    h: '6. Vaše pravice',
    p: [
      `Imate pravico do dostopa do podatkov, popravka, izbrisa, omejitve obdelave, prenosljivosti in ugovora. Privolitev lahko kadarkoli prekličete. Zahtevo pošljite na ${c.email} ali odgovorite na katero koli našo e-pošto; odgovorimo v 30 dneh.`,
      'Če menite, da podatke obdelujemo v nasprotju s predpisi, lahko vložite pritožbo pri Informacijskem pooblaščencu Republike Slovenije (www.ip-rs.si).',
    ],
  },
  {
    h: '7. Umetna inteligenca',
    p: [
      `Glasovni pomočniki ${BRAND} so sistemi umetne inteligence. Pomočnik se v pogovoru vedno predstavi kot AI pomočnik, da oseba ve, da se ne pogovarja s človekom.`,
    ],
  },
  {
    h: '8. Spremembe',
    p: [`Politiko lahko posodobimo. Veljavna različica je vedno objavljena na tej strani. Velja od ${LEGAL_VERSION.split('-').reverse().join('. ')}.`],
  },
];

/* -------------------------------------------------------------------- terms */

export const TERMS: LegalSection[] = [
  {
    h: '1. Ponudnik in storitev',
    p: [
      `Storitev ${BRAND} (agentka.si) zagotavlja ${companyLine} (v nadaljevanju: ponudnik).`,
      `${BRAND} je glasovni AI pomočnik, ki ga naročnik vgradi na svojo spletno stran. Pomočnik odgovarja obiskovalcem na podlagi vsebin, ki jih določi naročnik, zbira povpraševanja in po izbiri naročnika rezervira termine.`,
    ],
  },
  {
    h: '2. Komu je storitev namenjena',
    p: [
      'Storitev je namenjena izključno pravnim osebam in samostojnim podjetnikom za opravljanje njihove dejavnosti, ne potrošnikom. Kdor sprejme te pogoje v imenu podjetja, jamči, da ga sme zastopati.',
    ],
  },
  {
    h: '3. Sklenitev pogodbe',
    p: [
      'Pogodba je sklenjena, ko naročnik ob registraciji označi, da se strinja s temi pogoji. Sestavni del pogojev je Priloga 1: Pogodba o obdelavi osebnih podatkov.',
    ],
  },
  {
    h: '4. Brezplačni preizkus, paketi in plačilo',
    list: [
      'Brezplačni preizkus traja in vključuje toliko minut, kot je objavljeno v ceniku ob registraciji. Po izteku se pomočnik ustavi, dokler naročnik ne izbere paketa.',
      'Naročnina se plačuje mesečno vnaprej s kartico prek ponudnika Stripe. Cene so objavljene v ceniku.',
      'Neporabljene minute se ne prenašajo v naslednje obdobje. Ko so minute porabljene, se pomočnik do novega obdobja ali do nadgradnje paketa ustavi.',
      'Spremembo cen ponudnik sporoči najmanj 30 dni vnaprej; naročnik lahko do uveljavitve naročnino odpove.',
    ],
  },
  {
    h: '5. Odpoved',
    p: [
      'Naročnik lahko naročnino kadarkoli odpove v aplikaciji ali po e-pošti. Odpoved začne veljati ob koncu že plačanega obdobja; plačila za tekoče obdobje se ne vračajo.',
    ],
  },
  {
    h: '6. Obveznosti naročnika',
    list: [
      'Naročnik je odgovoren za vsebine, ki jih da pomočniku na voljo, in za pravilnost cen, terminov in drugih podatkov.',
      'Naročnik na svoji spletni strani obvesti obiskovalce o obdelavi osebnih podatkov (v svoji politiki zasebnosti navede storitev ' +
        BRAND +
        ' kot obdelovalca) in ne izklopi predstavitve pomočnika kot AI pomočnika.',
      'Storitve ni dovoljeno uporabljati za nezakonite namene, zavajanje, neželeno trženje ali zbiranje posebnih vrst osebnih podatkov (npr. zdravstvenih), razen če je to izrecno dogovorjeno.',
    ],
  },
  {
    h: '7. Razpoložljivost in odgovornost',
    list: [
      'Ponudnik si prizadeva za neprekinjeno delovanje, ne jamči pa, da bo storitev vedno na voljo ali brez napak. Odgovori pomočnika nastanejo z umetno inteligenco in so lahko netočni.',
      'Ponudnik ne odgovarja za posredno škodo ali izgubljeni dobiček. Skupna odgovornost ponudnika je omejena na znesek, ki ga je naročnik plačal v zadnjih 12 mesecih. Omejitev ne velja za škodo, povzročeno naklepno ali iz hude malomarnosti.',
    ],
  },
  {
    h: '8. Spremembe pogojev',
    p: [
      'Ponudnik bistvene spremembe pogojev sporoči po e-pošti najmanj 30 dni pred uveljavitvijo. Če naročnik do takrat naročnine ne odpove, velja, da se s spremembami strinja.',
    ],
  },
  {
    h: '9. Pravo in spori',
    p: ['Za pogodbo velja pravo Republike Slovenije. Za spore je pristojno stvarno pristojno sodišče po sedežu ponudnika.'],
  },
];

/* ---------------------------------------------------------------------- DPA */

export const DPA: LegalSection[] = [
  {
    h: 'Priloga 1: Pogodba o obdelavi osebnih podatkov',
    p: [
      `Ta pogodba v skladu s členom 28 Splošne uredbe o varstvu podatkov (GDPR) ureja obdelavo osebnih podatkov, ki jo ponudnik (obdelovalec) izvaja v imenu naročnika (upravljavca) pri zagotavljanju storitve ${BRAND}. Naročnik jo sprejme skupaj s pogoji uporabe.`,
    ],
  },
  {
    h: '1. Predmet, narava in namen obdelave',
    p: [
      'Obdelovalec za upravljavca vodi glasovne pogovore z obiskovalci upravljavčeve spletne strani, pripravlja prepise in povzetke, zbira povpraševanja in po izbiri upravljavca rezervira termine.',
    ],
  },
  {
    h: '2. Vrste podatkov in posamezniki',
    list: [
      'Posamezniki: obiskovalci in stranke upravljavca, ki se pogovarjajo s pomočnikom.',
      'Podatki: glas med pogovorom (posnetek se ne hrani), prepis pogovora, ime, e-naslov, telefonska številka, želen termin in drugi podatki, ki jih obiskovalec sam pove.',
    ],
  },
  {
    h: '3. Trajanje',
    p: [
      'Obdelava traja ves čas naročnine. Prepise hrani obdelovalec toliko časa, kot ga nastavi upravljavec v aplikaciji, privzeto 12 mesecev. Ob koncu naročnine obdelovalec podatke v 90 dneh izbriše, razen če upravljavec pred tem zahteva izvoz.',
    ],
  },
  {
    h: '4. Obveznosti obdelovalca',
    list: [
      'Podatke obdeluje samo po dokumentiranih navodilih upravljavca; navodila so ta pogodba in nastavitve v aplikaciji.',
      'Zagotovi, da so osebe, ki imajo dostop do podatkov, zavezane k zaupnosti.',
      'Izvaja ustrezne tehnične in organizacijske ukrepe (člen 32 GDPR): šifrirane povezave (HTTPS), gostovanje v EU, omejen dostop, najmanjši obseg podatkov, samodejni izbris po izteku hrambe.',
      'Upravljavcu pomaga pri odgovarjanju na zahteve posameznikov (dostop, izbris ipd.) in pri oceni učinka, če je potrebna.',
      'O kršitvi varstva podatkov obvesti upravljavca brez nepotrebnega odlašanja, najpozneje v 48 urah od ugotovitve.',
      'Upravljavcu da na voljo informacije, potrebne za dokazovanje skladnosti s to pogodbo.',
    ],
  },
  {
    h: '5. Podizvajalci',
    p: [
      'Upravljavec daje splošno dovoljenje za podizvajalce, navedene na javni strani Podizvajalci (agentka.si). Obdelovalec o vsaki dodani ali zamenjani podizvajalcu obvesti upravljavca po e-pošti najmanj 14 dni vnaprej; upravljavec lahko utemeljeno ugovarja in v tem primeru naročnino odpove brez stroškov. Obdelovalec s podizvajalci sklene pogodbe z enakimi obveznostmi varstva podatkov.',
    ],
  },
  {
    h: '6. Prenos podatkov iz EU',
    p: [
      'Prenos podatkov v ZDA poteka samo k podizvajalcem, vključenim v EU–ZDA okvir za varstvo podatkov (Data Privacy Framework), ali na podlagi standardnih pogodbenih klavzul Evropske komisije.',
    ],
  },
  {
    h: '7. Obveznosti upravljavca',
    p: [
      'Upravljavec zagotovi pravno podlago za obdelavo in obvesti obiskovalce o obdelavi v svoji politiki zasebnosti.',
    ],
  },
];

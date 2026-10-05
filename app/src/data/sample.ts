/**
 * Sample data for stage 1. Everything here is invented:
 *  - people are fictional (ordinary Slovenian names, example.si / example.com, 040 555 0xx),
 *  - prices and plans are samples,
 *  - the only real thing is the list of page addresses of spletnost.si.
 *
 * Dates are built relative to "now" when createSampleDb() runs — never fixed calendar dates.
 */
import type {
  Account,
  Agent,
  Booking,
  BookingSettings,
  CalendarConnection,
  Conversation,
  ConversationOutcome,
  Db,
  EmailLog,
  Id,
  Invoice,
  KnowledgeSource,
  Lead,
  LeadStatus,
  NotificationSettings,
  Plan,
  PlanKey,
  Session,
  TranscriptTurn,
  User,
  WorkingHours,
} from './types';

export const DB_VERSION = 1;

/* ------------------------------------------------------------ date helpers */

const DAY = 86_400_000;

function atTime(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function daysAgo(n: number, hour = 9, minute = 0, now: Date = new Date()): string {
  return atTime(new Date(now.getTime() - n * DAY), hour, minute).toISOString();
}

export function daysAhead(n: number, hour = 9, minute = 0, now: Date = new Date()): string {
  return atTime(new Date(now.getTime() + n * DAY), hour, minute).toISOString();
}

export function minutesAfter(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

/** The first working day (Mon–Fri) that is at least `minDays` days after `from`. */
function workdayAfter(from: string, minDays: number, hour: number, minute = 0): string {
  const d = new Date(new Date(from).getTime() + minDays * DAY);
  while (d.getDay() === 0 || d.getDay() === 6) d.setTime(d.getTime() + DAY);
  return atTime(d, hour, minute).toISOString();
}

function calendarDaysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  const x = new Date(da.getFullYear(), da.getMonth(), da.getDate()).getTime();
  const y = new Date(db.getFullYear(), db.getMonth(), db.getDate()).getTime();
  return Math.round((y - x) / DAY);
}

const NUMBER_WORDS: Record<number, string> = {
  3: 'tri',
  4: 'štiri',
  5: 'pet',
  6: 'šest',
  7: 'sedem',
  8: 'osem',
  9: 'devet',
  10: 'deset',
  11: 'enajst',
  12: 'dvanajst',
  13: 'trinajst',
  14: 'štirinajst',
};

/** How the agent says a day, seen from the day of the conversation: "jutri", "čez tri dni" … */
function spokenDay(conversationAt: string, target: string): string {
  const diff = calendarDaysBetween(conversationAt, target);
  if (diff <= 0) return 'danes';
  if (diff === 1) return 'jutri';
  if (diff === 2) return 'pojutrišnjem';
  return `čez ${NUMBER_WORDS[diff] ?? String(diff)} dni`;
}

/* ------------------------------------------------------------------- plans */

/** Sample prices — not a price list. */
export const SAMPLE_PLANS: Plan[] = [
  {
    key: 'start',
    name: 'Start',
    price_month_eur: 29,
    stripe_price_id: null,
    minutes_included: 100,
    max_pages: 50,
    max_agents: 1,
  },
  {
    key: 'rast',
    name: 'Rast',
    price_month_eur: 59,
    stripe_price_id: null,
    minutes_included: 300,
    max_pages: 150,
    max_agents: 1,
  },
  {
    key: 'pro',
    name: 'Pro',
    price_month_eur: 119,
    stripe_price_id: null,
    minutes_included: 800,
    max_pages: 500,
    max_agents: 3,
  },
];

export const TRIAL_MINUTES = 30;
export const TRIAL_DAYS = 14;

/** Sample cost per conversation minute for the admin "ocenjen strošek" column. */
export const SAMPLE_COST_PER_MINUTE_EUR = 0.09;

/** Voices the customer can choose from (sample list; real ones come from ElevenLabs in stage 3). */
export const SAMPLE_VOICES: { id: string; name: string; description: string }[] = [
  { id: 'voice_sl_jan', name: 'Jan', description: 'moški glas, umirjen' },
  { id: 'voice_sl_tina', name: 'Tina', description: 'ženski glas, topel' },
  { id: 'voice_sl_ana', name: 'Ana', description: 'ženski glas, živahen' },
  { id: 'voice_sl_peter', name: 'Peter', description: 'moški glas, globok' },
];

/**
 * Widget colours the customer can pick. This is customer data (it is painted on THEIR
 * website), not a colour of our interface — the only hex values outside tokens.css.
 */
export const WIDGET_COLORS: { key: string; name: string; hex: string }[] = [
  { key: 'petrol', name: 'Petrolej modra', hex: '#0A6C8F' },
  { key: 'ink', name: 'Temno siva', hex: '#1F2A30' },
  { key: 'forest', name: 'Gozdno zelena', hex: '#1F6B4A' },
  { key: 'brick', name: 'Opečno rdeča', hex: '#A8432F' },
  { key: 'ochre', name: 'Oker', hex: '#9A6A12' },
  { key: 'navy', name: 'Mornarsko modra', hex: '#243B7A' },
];

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  mon: { open: true, from: '08:00', to: '16:00' },
  tue: { open: true, from: '08:00', to: '16:00' },
  wed: { open: true, from: '08:00', to: '16:00' },
  thu: { open: true, from: '08:00', to: '16:00' },
  fri: { open: true, from: '08:00', to: '14:00' },
  sat: { open: false, from: '09:00', to: '12:00' },
  sun: { open: false, from: '09:00', to: '12:00' },
};

export const DEFAULT_VISITOR_TEMPLATE = `Pozdravljeni, {{ime}},

hvala za pogovor z našim pomočnikom. Tukaj je povzetek:

{{povzetek}}

Dogovorjeno: {{dogovorjeno}}

Če želite kaj dodati ali spremeniti, odgovorite na to sporočilo.

Lep pozdrav,
{{podjetje}}`;

export const DEFAULT_OWNER_TEMPLATE = `Nov pogovor na vaši spletni strani.

Obiskovalec: {{ime}}
E-pošta: {{eposta}}
Telefon: {{telefon}}

Povzetek: {{povzetek}}

Dogovorjeno: {{dogovorjeno}}

Celoten zapis pogovora: {{povezava}}`;

export function defaultInstructions(businessName: string): string {
  return `Ste glasovni pomočnik podjetja ${businessName}.

- Obiskovalce vikajte. Odgovarjajte v enem ali dveh kratkih stavkih in postavite eno vprašanje naenkrat.
- Odgovarjajte samo iz virov znanja. Če podatka ni, to povejte in ponudite povratni klic.
- Cen, rokov in obljub, ki jih ni v virih znanja, ne navajajte.
- Ko obiskovalec želi termin, ponudite največ tri proste termine.
- Za e-naslov in telefon prosite, naj ju obiskovalec vpiše v polje, in ju enkrat preberite nazaj.`;
}

/* ------------------------------------------------------------- transcripts */

/** Lines alternate agent / visitor, starting with the agent. Times are spread by text length. */
function transcript(durationSec: number, lines: string[]): TranscriptTurn[] {
  const total = lines.reduce((sum, l) => sum + l.length + 20, 0);
  let acc = 0;
  return lines.map((text, i) => {
    const timeSec = Math.round((acc / total) * (durationSec - 6));
    acc += text.length + 20;
    return { role: i % 2 === 0 ? 'agent' : 'visitor', text, timeSec };
  });
}

const HELLO = 'Pozdravljeni, sem Jan, AI pomočnik agencije Spletnost. Kako vam lahko pomagam?';

/* ------------------------------------------------------- Spletnost account */

export const SPLETNOST_ID: Id = 'acc_spletnost';
const SPLETNOST_AGENT: Id = 'agt_spletnost_jan';

interface ConvSeed {
  key: string;
  startedAt: string;
  durationSec: number;
  outcome: ConversationOutcome;
  topic: string;
  summary: string;
  agreed: string | null;
  lines: string[];
  visitor?: { name: string; email: string; phone: string };
  lead?: { wanted: string; status: LeadStatus };
  booking?: {
    start: string;
    lengthMin: number;
    mode: 'auto' | 'request';
    status: 'requested' | 'confirmed' | 'cancelled';
  };
  visitorEmailFails?: string;
}

function spletnostConversations(now: Date): ConvSeed[] {
  const seeds: ConvSeed[] = [];

  /* 1 — today, booking (upcoming, confirmed) */
  {
    // Never in the future: 10:12 today, or a little while ago when it is still early.
    const at = new Date(
      Math.min(new Date(daysAgo(0, 10, 12, now)).getTime(), now.getTime() - 35 * 60_000),
    ).toISOString();
    const slot = workdayAfter(at, 1, 10);
    const day = spokenDay(at, slot);
    seeds.push({
      key: 'c01',
      startedAt: at,
      durationSec: 498,
      outcome: 'booking',
      topic: 'Nova spletna stran za računovodski servis',
      summary:
        'Gospa Kovač vodi računovodski servis in želi novo spletno stran. Zanimala jo je cena in kaj je vključeno. Rezervirala je brezplačen posvet.',
      agreed: 'Brezplačen posvet po telefonu ob 10.00, 30 minut. Termin je vpisan v koledar.',
      visitor: { name: 'Maja Kovač', email: 'maja.kovac@example.si', phone: '040 555 012' },
      lead: { wanted: 'Nova predstavitvena spletna stran za računovodski servis', status: 'new' },
      booking: { start: slot, lengthMin: 30, mode: 'auto', status: 'confirmed' },
      lines: [
        HELLO,
        'Dober dan. Imam računovodski servis in potrebujem novo spletno stran. Koliko to stane?',
        'Izdelava predstavitvene spletne strani se začne pri osemsto devetdesetih evrih. Končna cena je odvisna od števila podstrani in vsebin.',
        'Kaj pa je vključeno v to ceno?',
        `Vključeni so oblikovanje po meri, prilagoditev za telefone in osnovna optimizacija za Google. Za podrobnosti vam lahko uredim brezplačen posvet: prosta termina sta ${day} ob desetih in ${day} ob štirinajstih. Vam kateri ustreza?`,
        'Ob desetih, prosim.',
        'Dobro. Kako vam je ime?',
        'Maja Kovač.',
        'Hvala, gospa Kovač. Prosim, vpišite svoj e-naslov in telefonsko številko v polje spodaj.',
        'maja.kovac@example.si, 040 555 012',
        'Zapisal sem maja pika kovac afna example pika si in nič štiri nič, pet pet pet, nič ena dva. Je tako prav?',
        'Da, tako je.',
        `Termin je rezerviran: ${day} ob desetih. Potrditev sem vam poslal na e-naslov. Lep dan želim!`,
      ],
    });
  }

  /* 2 — yesterday, question */
  seeds.push({
    key: 'c02',
    startedAt: daysAgo(1, 15, 40, now),
    durationSec: 204,
    outcome: 'question',
    topic: 'Cena vodenja Google oglasov',
    summary:
      'Obiskovalec je vprašal za ceno vodenja Google oglasov, priporočen proračun in vezavo. Ceno je dobil, za proračun in vezavo v virih ni podatka. Kontakta ni pustil.',
    agreed: null,
    lines: [
      HELLO,
      'Zanima me, koliko stane vodenje Google oglasov.',
      'Vodenje Google oglaševanja stane od sto devetdeset evrov na mesec. Proračun za oglase plačate posebej, neposredno Googlu.',
      'Kolikšen proračun pa priporočate?',
      'Tega podatka nimam zapisanega, ker je odvisen od panoge in ciljev. Naš svetovalec vam ga lahko oceni na brezplačnem posvetu.',
      'Ali je pogodba vezana na določen čas?',
      'O vezavi nimam podatka. Želite, da vas pokliče svetovalec in vam to pojasni?',
      'Ne, hvala, za zdaj mi to zadošča.',
      'Prav. Če boste imeli še kakšno vprašanje, sem tukaj. Lep dan želim!',
    ],
  });

  /* 3 — yesterday, lead */
  seeds.push({
    key: 'c03',
    startedAt: daysAgo(1, 9, 5, now),
    durationSec: 372,
    outcome: 'lead',
    topic: 'Spletna trgovina za športno opremo',
    summary:
      'Gospod Zupančič prodaja športno opremo in razmišlja o spletni trgovini s približno 300 izdelki. Želi pisno ponudbo.',
    agreed: 'Agencija pošlje ponudbo za spletno trgovino na e-naslov.',
    visitor: { name: 'Tomaž Zupančič', email: 'tomaz.zupancic@example.com', phone: '040 555 023' },
    lead: { wanted: 'Ponudba za spletno trgovino, okoli 300 izdelkov', status: 'new' },
    lines: [
      HELLO,
      'Dober dan. Prodajam športno opremo in razmišljam o spletni trgovini. Ali to delate?',
      'Da, izdelujemo tudi spletne trgovine. Cena se začne pri tisoč osemsto devetdesetih evrih.',
      'Koliko izdelkov lahko ima taka trgovina?',
      'Tega podatka nimam zapisanega. Lahko pa vam pripravimo ponudbo glede na število izdelkov. Želite, da vam jo pošljemo?',
      'Da, prosim. Imam okoli tristo izdelkov.',
      'Zapisal sem si: spletna trgovina za športno opremo, približno tristo izdelkov. Kako vam je ime?',
      'Tomaž Zupančič.',
      'Hvala, gospod Zupančič. Prosim, vpišite svoj e-naslov in telefonsko številko v polje spodaj.',
      'tomaz.zupancic@example.com, 040 555 023',
      'Zapisal sem tomaz pika zupancic afna example pika com in nič štiri nič, pet pet pet, nič dva tri. Je tako prav?',
      'Tako je.',
      'Odlično. Ponudbo boste prejeli na e-naslov, povzetek pogovora pa sem vam že poslal. Lep dan želim!',
    ],
  });

  /* 4 — two days ago, booking (upcoming, confirmed) */
  {
    const at = daysAgo(2, 13, 22, now);
    const slot = workdayAfter(daysAgo(0, 12, 0, now), 2, 14);
    const day = spokenDay(at, slot);
    seeds.push({
      key: 'c04',
      startedAt: at,
      durationSec: 451,
      outcome: 'booking',
      topic: 'Facebook in Instagram oglaševanje za kozmetični salon',
      summary:
        'Gospa Horvat ima kozmetični salon in želi več strank prek Facebooka in Instagrama. Izvedela je ceno vodenja in rezervirala posvet.',
      agreed: 'Brezplačen posvet po telefonu ob 14.00, 30 minut. Termin je vpisan v koledar.',
      visitor: { name: 'Nina Horvat', email: 'nina@example.si', phone: '040 555 034' },
      lead: { wanted: 'Oglaševanje na Facebooku in Instagramu za kozmetični salon', status: 'new' },
      booking: { start: slot, lengthMin: 30, mode: 'auto', status: 'confirmed' },
      lines: [
        HELLO,
        'Pozdravljeni. Imam kozmetični salon in bi rada več strank prek Facebooka in Instagrama.',
        'Pri tem vam lahko pomagamo. Vodimo oglaševanje na Facebooku in Instagramu, cena vodenja je od sto devetdeset evrov na mesec.',
        'Bi se lahko o tem s kom pogovorila?',
        `Seveda, posvet je brezplačen in traja trideset minut. Prosta termina sta ${day} ob enajstih in ${day} ob štirinajstih. Kateri vam bolj ustreza?`,
        'Ob štirinajstih.',
        'Dobro. Kako vam je ime?',
        'Nina Horvat.',
        'Hvala, gospa Horvat. Prosim, vpišite svoj e-naslov in telefonsko številko v polje spodaj.',
        'nina@example.si, 040 555 034',
        'Zapisal sem nina afna example pika si in nič štiri nič, pet pet pet, nič tri štiri. Je tako prav?',
        'Da, drži.',
        `Termin je rezerviran: ${day} ob štirinajstih. Potrditev sem vam poslal na e-naslov. Nasvidenje!`,
      ],
    });
  }

  /* 5 — three days ago, question */
  seeds.push({
    key: 'c05',
    startedAt: daysAgo(3, 11, 48, now),
    durationSec: 163,
    outcome: 'question',
    topic: 'YouTube oglaševanje in snemanje videa',
    summary:
      'Obiskovalec je vprašal, ali agencija vodi YouTube oglase in ali posname tudi video. Za snemanje v virih ni podatka. Kontakta ni pustil.',
    agreed: null,
    lines: [
      HELLO,
      'Ali delate tudi oglase za YouTube?',
      'Da, vodimo tudi YouTube oglaševanje. Cena vodenja je od dvesto štirideset evrov na mesec.',
      'Ali posnamete tudi video?',
      'O snemanju videov nimam podatka, zato vam tega ne morem potrditi. Želite, da vas o tem pokliče naš svetovalec?',
      'Ne, bom kar sam pisal na e-pošto.',
      'Prav. Naš e-naslov najdete na strani Kontakt. Lep dan želim!',
    ],
  });

  /* 6 — four days ago, lead (already contacted) */
  seeds.push({
    key: 'c06',
    startedAt: daysAgo(4, 17, 3, now),
    durationSec: 338,
    outcome: 'lead',
    topic: 'Prenova zastarele spletne strani',
    summary:
      'Gospod Novak ima osem let staro spletno stran in sprašuje o prenovi. Zanima ga, ali ostanejo stare vsebine in povezave. Želi klic dopoldne.',
    agreed: 'Svetovalec pokliče dopoldne.',
    visitor: { name: 'Andrej Novak', email: 'andrej.novak@example.si', phone: '040 555 045' },
    lead: { wanted: 'Prenova obstoječe spletne strani, klic dopoldne', status: 'contacted' },
    lines: [
      HELLO,
      'Dober dan. Našo spletno stran smo naredili pred osmimi leti in je zastarela. Ali delate tudi prenove?',
      'Da, prenavljamo obstoječe spletne strani. Cena predstavitvene strani se začne pri osemsto devetdesetih evrih.',
      'Ali ostanejo stare vsebine in povezave?',
      'Tega podatka nimam zapisanega. Naš svetovalec vam lahko to razloži po telefonu. Želite, da vas pokliče?',
      'Da, najbolje dopoldne.',
      'Zapisal sem, da želite klic dopoldne. Kako vam je ime?',
      'Andrej Novak.',
      'Hvala, gospod Novak. Prosim, vpišite svoj e-naslov in telefonsko številko v polje spodaj.',
      'andrej.novak@example.si, 040 555 045',
      'Zapisal sem andrej pika novak afna example pika si in nič štiri nič, pet pet pet, nič štiri pet. Je tako prav?',
      'Da.',
      'Hvala. Svetovalec vas bo poklical dopoldne. Lep dan želim!',
    ],
  });

  /* 7 — five days ago, booking wish outside the free slots (requested, upcoming) */
  {
    const at = daysAgo(5, 10, 30, now);
    const offered = workdayAfter(at, 1, 9);
    const wish = workdayAfter(daysAgo(0, 12, 0, now), 3, 17, 30);
    const offeredDay = spokenDay(at, offered);
    const wishDay = spokenDay(at, wish);
    seeds.push({
      key: 'c07',
      startedAt: at,
      durationSec: 476,
      outcome: 'booking',
      topic: 'Marketing plan za novo cvetličarno',
      summary:
        'Gospa Mlakar odpira cvetličarno in potrebuje marketing plan. Ponujeni termini ji niso ustrezali, zato je pustila željo za termin po 17. uri. Termin še čaka na potrditev.',
      agreed: 'Želen termin ob 17.30. Agencija ga mora še potrditi.',
      visitor: { name: 'Petra Mlakar', email: 'petra.mlakar@example.com', phone: '040 555 056' },
      lead: { wanted: 'Marketing plan za novo cvetličarno, pogovor v živo', status: 'new' },
      booking: { start: wish, lengthMin: 30, mode: 'request', status: 'requested' },
      lines: [
        HELLO,
        'Dober dan. Odpiramo cvetličarno in potrebujemo marketing plan. Kaj to obsega?',
        'Marketing plan je načrt, kako boste prišli do strank: ciljne skupine, kanali in proračun. Cena je tristo devetdeset evrov, enkratno.',
        'Bi se lahko o tem pogovorila s kom v živo?',
        `Seveda. Prosta termina sta ${offeredDay} ob devetih in ${offeredDay} ob trinajstih. Kateri vam bolj ustreza?`,
        'Čez dan delam. Bi šlo kdaj po peti uri popoldne?',
        `Po peti uri prostega termina nimam. Lahko pa zapišem vašo željo, ${wishDay} ob pol šestih, in agencija vam jo bo potrdila po e-pošti. Kako vam je ime?`,
        'V redu, tako naredimo. Petra Mlakar.',
        'Hvala, gospa Mlakar. Prosim, vpišite svoj e-naslov in telefonsko številko v polje spodaj.',
        'petra.mlakar@example.com, 040 555 056',
        'Zapisal sem petra pika mlakar afna example pika com in nič štiri nič, pet pet pet, nič pet šest. Je tako prav?',
        'Da.',
        'Hvala. Vašo željo za termin sem posredoval. Termin še ni potrjen, potrditev boste prejeli po e-pošti. Nasvidenje!',
      ],
    });
  }

  /* 8 — six days ago, question */
  seeds.push({
    key: 'c08',
    startedAt: daysAgo(6, 14, 15, now),
    durationSec: 127,
    outcome: 'question',
    topic: 'Izobraževanja o spletnem oglaševanju',
    summary:
      'Obiskovalec je vprašal za tečaje o Google oglasih in datum naslednjega termina. Datuma v virih ni. Kontakta ni pustil.',
    agreed: null,
    lines: [
      HELLO,
      'Ali imate kakšne tečaje za Google oglase?',
      'Da, izvajamo izobraževanja o spletnem oglaševanju. Več o vsebini je na strani Izobraževanja.',
      'Kdaj je naslednji termin?',
      'Datuma naslednjega izobraževanja nimam zapisanega. Želite pustiti kontakt, da vam ga sporočimo?',
      'Ne, bom pogledal na stran.',
      'Prav. Lep dan želim!',
    ],
  });

  /* 9 — eight days ago, lead; the confirmation e-mail to the visitor bounced */
  seeds.push({
    key: 'c09',
    startedAt: daysAgo(8, 9, 40, now),
    durationSec: 355,
    outcome: 'lead',
    topic: 'Google oglaševanje za ključavničarstvo',
    summary:
      'Gospod Kranjc ima ključavničarstvo v Kranju in želi, da ga stranke najdejo na Googlu. Želi predlog oglaševanja po e-pošti.',
    agreed: 'Agencija pošlje predlog Google oglaševanja na e-naslov.',
    visitor: { name: 'Luka Kranjc', email: 'luka.kranjc@example.si', phone: '040 555 067' },
    lead: { wanted: 'Predlog Google oglaševanja za ključavničarstvo', status: 'contacted' },
    visitorEmailFails:
      'Prejemnikov poštni strežnik je sporočilo zavrnil: poštni predal ne obstaja (550). Preverite e-naslov in obiskovalca pokličite.',
    lines: [
      HELLO,
      'Dober dan. Imam ključavničarstvo v Kranju in bi rad, da me ljudje najdejo na Googlu.',
      'Pri tem pomaga Google oglaševanje, ki ga vodimo za stranke. Cena vodenja je od sto devetdeset evrov na mesec, proračun za oglase pa plačate Googlu.',
      'Ali delate samo za večja podjetja?',
      'Ne, delamo tudi z malimi podjetji in samostojnimi podjetniki. Želite, da vam pripravimo predlog?',
      'Lahko, pošljite mi ga.',
      'Kako vam je ime?',
      'Luka Kranjc.',
      'Hvala, gospod Kranjc. Prosim, vpišite svoj e-naslov in telefonsko številko v polje spodaj.',
      'luka.kranjc@example.si, 040 555 067',
      'Zapisal sem luka pika kranjc afna example pika si in nič štiri nič, pet pet pet, nič šest sedem. Je tako prav?',
      'Ja.',
      'Hvala. Predlog boste prejeli na e-naslov. Lep dan želim!',
    ],
  });

  /* 10 — nine days ago, booking (already took place) */
  {
    const at = daysAgo(9, 16, 20, now);
    const slot = workdayAfter(at, 1, 11);
    const day = spokenDay(at, slot);
    seeds.push({
      key: 'c10',
      startedAt: at,
      durationSec: 512,
      outcome: 'booking',
      topic: 'Spletna stran za turistično kmetijo',
      summary:
        'Gospa Potočnik želi spletno stran za turistično kmetijo z obrazcem za povpraševanje po nočitvah. Zanimalo jo je, ali lahko stran ureja sama. Rezervirala je posvet.',
      agreed: 'Brezplačen posvet po telefonu ob 11.00, 30 minut. Termin je vpisan v koledar.',
      visitor: { name: 'Simona Potočnik', email: 'simona@example.si', phone: '040 555 078' },
      lead: { wanted: 'Spletna stran za turistično kmetijo s povpraševanjem', status: 'won' },
      booking: { start: slot, lengthMin: 30, mode: 'auto', status: 'confirmed' },
      lines: [
        HELLO,
        'Pozdravljeni. Imamo turistično kmetijo in potrebujemo spletno stran z možnostjo povpraševanja za nočitve.',
        'To lahko naredimo. Predstavitvena spletna stran se začne pri osemsto devetdesetih evrih, obrazec za povpraševanje je vključen.',
        'Ali potem stran lahko urejamo sami?',
        `Da, stran lahko urejate sami. Za brezplačen posvet imam prosta termina ${day} ob enajstih in ${day} ob petnajstih. Vam kateri ustreza?`,
        'Ob enajstih.',
        'Dobro. Kako vam je ime?',
        'Simona Potočnik.',
        'Hvala, gospa Potočnik. Prosim, vpišite svoj e-naslov in telefonsko številko v polje spodaj.',
        'simona@example.si, 040 555 078',
        'Zapisal sem simona afna example pika si in nič štiri nič, pet pet pet, nič sedem osem. Je tako prav?',
        'Da.',
        `Termin je rezerviran: ${day} ob enajstih. Potrditev sem vam poslal na e-naslov. Nasvidenje!`,
      ],
    });
  }

  /* 11 — eleven days ago, booking that was later cancelled */
  {
    const at = daysAgo(11, 12, 5, now);
    const slot = workdayAfter(at, 1, 12);
    const day = spokenDay(at, slot);
    seeds.push({
      key: 'c11',
      startedAt: at,
      durationSec: 389,
      outcome: 'booking',
      topic: 'Google oglaševanje za avtoservis',
      summary:
        'Gospod Oblak ima avtoservis in ga zanima oglaševanje na Googlu. Rezerviral je posvet, ki ga je pozneje odpovedal.',
      agreed: 'Brezplačen posvet po telefonu ob 12.00. Termin je bil pozneje odpovedan.',
      visitor: { name: 'Gregor Oblak', email: 'gregor.oblak@example.com', phone: '040 555 089' },
      lead: { wanted: 'Google oglaševanje za avtoservis', status: 'lost' },
      booking: { start: slot, lengthMin: 30, mode: 'auto', status: 'cancelled' },
      lines: [
        HELLO,
        'Dober dan. Imam avtoservis in me zanima oglaševanje na Googlu. Lahko dobim termin za pogovor?',
        `Seveda. Posvet je brezplačen in traja trideset minut. Prosta termina sta ${day} ob devetih in ${day} ob dvanajstih. Kateri vam bolj ustreza?`,
        'Ob dvanajstih.',
        'Kako vam je ime?',
        'Gregor Oblak.',
        'Hvala, gospod Oblak. Prosim, vpišite svoj e-naslov in telefonsko številko v polje spodaj.',
        'gregor.oblak@example.com, 040 555 089',
        'Zapisal sem gregor pika oblak afna example pika com in nič štiri nič, pet pet pet, nič osem devet. Je tako prav?',
        'Da.',
        `Termin je rezerviran: ${day} ob dvanajstih. Potrditev sem vam poslal na e-naslov. Lep dan želim!`,
      ],
    });
  }

  /* 12 — thirteen days ago, question */
  seeds.push({
    key: 'c12',
    startedAt: daysAgo(13, 10, 50, now),
    durationSec: 187,
    outcome: 'question',
    topic: 'Posebna ponudba',
    summary:
      'Obiskovalka je vprašala, kaj vključuje posebna ponudba in do kdaj traja. Datuma konca v virih ni. Kontakta ni pustila.',
    agreed: null,
    lines: [
      HELLO,
      'Na strani sem videla posebno ponudbo. Kaj točno je vključeno?',
      'Posebna ponudba združuje izdelavo spletne strani in začetno nastavitev oglaševanja. Natančne pogoje najdete na strani Posebna ponudba.',
      'Do kdaj traja?',
      'Datuma konca ponudbe nimam zapisanega. Želite, da vam ga sporoči naš svetovalec?',
      'Ali velja tudi za spletne trgovine?',
      'Tega podatka nimam. Predlagam, da pustite kontakt in vam odgovori svetovalec.',
      'Ne, hvala, bom prebrala na strani.',
      'Prav. Lep dan želim!',
    ],
  });

  /* Older, short questions from earlier in the billing period */
  const older: [number, number, number, number, string, string, string[]][] = [
    [
      15, 11, 20, 152,
      'Gostovanje spletne strani',
      'Obiskovalec je vprašal, ali agencija ponuja gostovanje. V virih ni podatka; ponujen je bil povratni klic, ki ga ni želel.',
      [
        HELLO,
        'Ali pri vas dobim tudi gostovanje za spletno stran?',
        'O gostovanju nimam zapisanega podatka. Želite, da vas o tem pokliče naš svetovalec?',
        'Kaj pa vzdrževanje?',
        'Vzdrževanje spletne strani ponujamo od devetindvajset evrov na mesec.',
        'V redu, hvala.',
        'Prosim. Lep dan želim!',
      ],
    ],
    [
      16, 8, 45, 118,
      'Kdaj je agencija dosegljiva',
      'Obiskovalka je vprašala, kdaj lahko pokliče. Napotena je bila na stran Kontakt.',
      [
        HELLO,
        'Kdaj vas lahko pokličem po telefonu?',
        'Podatke za stik najdete na strani Kontakt. Lahko vam uredim tudi povratni klic. Želite to?',
        'Ne, bom poklicala sama.',
        'Prav. Lep dan želim!',
        'Hvala, enako.',
      ],
    ],
    [
      18, 13, 10, 141,
      'Reference agencije',
      'Obiskovalec je vprašal za reference. Agent je omenil projekt, predstavljen na strani Reference.',
      [
        HELLO,
        'Ali imate kakšne reference?',
        'Da. Na strani Reference je predstavljen projekt za podjetje BuWizz.',
        'Ste delali tudi za gostince?',
        'Tega podatka nimam zapisanega. Želite, da vam reference pošlje naš svetovalec?',
        'Ni treba, hvala.',
        'Prav. Lep dan želim!',
      ],
    ],
    [
      19, 16, 30, 96,
      'Optimizacija za Google',
      'Obiskovalec je vprašal, ali je optimizacija za Google vključena v izdelavo strani. Dobil je odgovor iz cenika.',
      [
        HELLO,
        'Ali je optimizacija za Google vključena v ceno spletne strani?',
        'Da, osnovna optimizacija za Google je vključena v izdelavo spletne strani.',
        'Odlično, hvala.',
        'Prosim. Vam lahko pomagam še s čim?',
        'Ne, to je vse.',
      ],
    ],
    [
      21, 10, 5, 163,
      'Plačilo na obroke',
      'Obiskovalka je vprašala, ali je mogoče plačilo na obroke. V virih ni podatka; povratnega klica ni želela.',
      [
        HELLO,
        'Ali je spletno stran mogoče plačati na obroke?',
        'O plačilnih pogojih nimam zapisanega podatka. Želite, da vam to pojasni naš svetovalec?',
        'Koliko pa stane najcenejša stran?',
        'Izdelava predstavitvene spletne strani se začne pri osemsto devetdesetih evrih.',
        'Hvala, bom razmislila.',
        'Prav. Lep dan želim!',
      ],
    ],
    [
      22, 14, 50, 124,
      'Ugodnosti za nove stranke',
      'Obiskovalec je vprašal za ugodnosti. Napoten je bil na stran Ugodnosti.',
      [
        HELLO,
        'Imate kakšne ugodnosti za nove stranke?',
        'Aktualne ugodnosti so opisane na strani Ugodnosti. Želite, da vam povem, kako oddate naročilo?',
        'Ne, samo to me je zanimalo.',
        'Prav. Lep dan želim!',
        'Hvala.',
      ],
    ],
    [
      24, 9, 15, 139,
      'Kako oddati naročilo',
      'Obiskovalka je vprašala, kako odda naročilo. Napotena je bila na obrazec na strani Naročilo.',
      [
        HELLO,
        'Kako pri vas oddam naročilo za spletno stran?',
        'Naročilo oddate z obrazcem na strani Naročilo. Lahko pa vam uredim tudi brezplačen posvet. Želite termin?',
        'Ne, bom kar izpolnila obrazec.',
        'Prav. Po oddaji obrazca vas bo agencija poklicala.',
        'Hvala.',
        'Prosim. Lep dan želim!',
      ],
    ],
    [
      25, 12, 40, 155,
      'Obvestilo o piškotkih',
      'Obiskovalec je vprašal, ali agencija uredi obvestilo o piškotkih. V virih ni podatka.',
      [
        HELLO,
        'Ali pri izdelavi strani uredite tudi obvestilo o piškotkih?',
        'O tem nimam zapisanega podatka, zato vam tega ne morem potrditi. Želite, da vas pokliče naš svetovalec?',
        'Raje bi odgovor po e-pošti.',
        'Naš e-naslov najdete na strani Kontakt. Lahko pa vpišete svoj e-naslov in vam odgovorimo mi.',
        'Bom pisal sam, hvala.',
        'Prav. Lep dan želim!',
      ],
    ],
  ];

  older.forEach(([ago, h, m, dur, topic, summary, lines], i) => {
    seeds.push({
      key: `c${String(13 + i).padStart(2, '0')}`,
      startedAt: daysAgo(ago, h, m, now),
      durationSec: dur,
      outcome: 'question',
      topic,
      summary,
      agreed: null,
      lines,
    });
  });

  return seeds;
}

const SPLETNOST_PAGES: [path: string, title: string, chars: number, included: boolean][] = [
  ['/', 'Domov', 6840, true],
  ['/izdelava-spletnih-strani/', 'Izdelava spletnih strani', 9120, true],
  ['/google-oglasevanje/', 'Google oglaševanje', 7450, true],
  ['/facebook-oglasevanje-3/', 'Facebook oglaševanje', 6980, true],
  ['/youtube-oglasevanje/', 'YouTube oglaševanje', 5310, true],
  ['/posebna-ponudba/', 'Posebna ponudba', 3270, true],
  ['/marketing-plan/', 'Marketing plan', 4890, true],
  ['/izobrazevanja/', 'Izobraževanja', 4120, true],
  ['/ugodnosti/', 'Ugodnosti', 2760, true],
  ['/narocilo/', 'Naročilo', 1480, true],
  ['/kontakt/', 'Kontakt', 960, true],
  ['/blog/', 'Blog', 3640, true],
  ['/reference-buwizz/', 'Reference – BuWizz', 5570, true],
  ['/politika-zasebnosti/', 'Politika zasebnosti', 11230, true],
  ['/piskotki/', 'Piškotki', 4410, true],
  ['/sample-page/', 'Sample Page', 1150, false],
  ['/test/', 'Test', 240, false],
  ['/2970-2/', '2970', 310, false],
];

/** Builds the page rows a website import produces (used by the seed and by the simulated import). */
export function buildWebsitePages(
  accountId: Id,
  agentId: Id,
  baseUrl: string,
  syncedAt: string | null,
  idPrefix: string,
): KnowledgeSource[] {
  const base = baseUrl.replace(/\/+$/, '');
  return SPLETNOST_PAGES.map(([path, title, chars, included], i) => ({
    id: `${idPrefix}_page_${String(i + 1).padStart(2, '0')}`,
    account_id: accountId,
    agent_id: agentId,
    type: 'website_page' as const,
    title,
    url: `${base}${path}`,
    content: null,
    file_url: null,
    included,
    status: included ? ('synced' as const) : ('excluded' as const),
    elevenlabs_doc_id: included ? `doc_${idPrefix}_${i + 1}` : null,
    chars,
    last_synced_at: included ? syncedAt : null,
    error: null,
  }));
}

const PRICE_LIST_TEXT = `Vzorčni cenik za predogled (cene niso prave).

Predstavitvena spletna stran: od 890 €
Spletna trgovina: od 1.890 €
Vzdrževanje spletne strani: od 29 € na mesec
Google oglaševanje, vodenje: od 190 € na mesec (proračun za oglase plačate Googlu)
Facebook in Instagram oglaševanje, vodenje: od 190 € na mesec
YouTube oglaševanje, vodenje: od 240 € na mesec
Marketing plan: 390 €, enkratno
Prvi posvet: brezplačen, 30 minut

V ceno spletne strani so vključeni oblikovanje po meri, prilagoditev za telefone in osnovna optimizacija za Google.`;

function buildSpletnost(now: Date) {
  const lastSync = daysAgo(1, 6, 30, now);

  const account: Account = {
    id: SPLETNOST_ID,
    name: 'Spletnost',
    website_url: 'https://spletnost.si',
    status: 'active',
    plan_key: 'rast',
    trial_ends_at: null,
    period_start: daysAgo(26, 0, 0, now),
    period_end: daysAhead(4, 0, 0, now),
    minutes_included: 300,
    minutes_used: 86,
    stripe_customer_id: 'cus_sample_spletnost',
    stripe_subscription_id: 'sub_sample_spletnost',
    language: 'sl',
    timezone: 'Europe/Ljubljana',
    created_at: daysAgo(87, 10, 15, now),
  };

  const users: User[] = [
    {
      id: 'usr_spletnost_1',
      account_id: SPLETNOST_ID,
      name: 'Marko Jereb',
      email: 'marko.jereb@example.si',
      account_role: 'owner',
      status: 'active',
      created_at: daysAgo(87, 10, 15, now),
    },
    {
      id: 'usr_spletnost_2',
      account_id: SPLETNOST_ID,
      name: 'Eva Kos',
      email: 'eva.kos@example.si',
      account_role: 'member',
      status: 'active',
      created_at: daysAgo(60, 9, 0, now),
    },
    {
      id: 'usr_spletnost_3',
      account_id: SPLETNOST_ID,
      name: 'Rok Pintar',
      email: 'rok.pintar@example.si',
      account_role: 'member',
      status: 'invited',
      created_at: daysAgo(3, 14, 20, now),
    },
  ];

  const agent: Agent = {
    id: SPLETNOST_AGENT,
    account_id: SPLETNOST_ID,
    name: 'Jan',
    business_name: 'Spletnost',
    elevenlabs_agent_id: 'agent_sample_7f3k2',
    voice_id: 'voice_sl_jan',
    language: 'sl',
    first_message: HELLO,
    instructions: defaultInstructions('Spletnost'),
    status: 'active',
    allowed_domain: 'spletnost.si',
    widget_accent_color: '#0A6C8F',
    widget_text_input: true,
    widget_position: 'bottom-right',
    kb_folder_id: 'kb_sample_spletnost',
    crawl_job_id: 'crawl_sample_0412',
    auto_sync_days: 7,
    last_sync_at: lastSync,
    webhook_token: 'mt_sample_9c1e77b0a4',
  };

  const bookingSettings: BookingSettings = {
    account_id: SPLETNOST_ID,
    agent_id: SPLETNOST_AGENT,
    mode: 'auto',
    calendar_id: 'primary',
    working_hours: structuredClone(DEFAULT_WORKING_HOURS),
    appointment_length_min: 30,
    buffer_min: 15,
    min_notice_hours: 4,
    max_days_ahead: 21,
  };

  const calendar: CalendarConnection = {
    account_id: SPLETNOST_ID,
    provider: 'google',
    connected_email: 'koledar.spletnost@example.com',
    status: 'connected',
    connected_at: daysAgo(80, 11, 0, now),
    calendars: [
      { id: 'primary', name: 'Spletnost – posveti' },
      { id: 'cal_team', name: 'Ekipa' },
      { id: 'cal_private', name: 'Zasebno' },
    ],
  };

  const notifications: NotificationSettings = {
    account_id: SPLETNOST_ID,
    notify_email: 'info@example.si',
    sender_name: 'Spletnost',
    reply_to: 'info@example.si',
    visitor_email_enabled: true,
    owner_email_enabled: true,
    visitor_template: DEFAULT_VISITOR_TEMPLATE,
    owner_template: DEFAULT_OWNER_TEMPLATE,
  };

  const sources: KnowledgeSource[] = [
    ...buildWebsitePages(SPLETNOST_ID, SPLETNOST_AGENT, account.website_url, lastSync, 'spl'),
    {
      id: 'spl_text_01',
      account_id: SPLETNOST_ID,
      agent_id: SPLETNOST_AGENT,
      type: 'text',
      title: 'Cenik storitev',
      url: null,
      content: PRICE_LIST_TEXT,
      file_url: null,
      included: true,
      status: 'synced',
      elevenlabs_doc_id: 'doc_spl_text_1',
      chars: PRICE_LIST_TEXT.length,
      last_synced_at: daysAgo(9, 15, 10, now),
      error: null,
    },
    {
      id: 'spl_file_01',
      account_id: SPLETNOST_ID,
      agent_id: SPLETNOST_AGENT,
      type: 'file',
      title: 'Predstavitev-agencije.pdf',
      url: null,
      content: null,
      file_url: 'sample://files/Predstavitev-agencije.pdf',
      included: true,
      status: 'synced',
      elevenlabs_doc_id: 'doc_spl_file_1',
      chars: 14860,
      last_synced_at: daysAgo(21, 10, 40, now),
      error: null,
    },
  ];

  const conversations: Conversation[] = [];
  const leads: Lead[] = [];
  const bookings: Booking[] = [];
  const emailLog: EmailLog[] = [];

  for (const s of spletnostConversations(now)) {
    const convId = `conv_spl_${s.key}`;
    const endedAt = minutesAfter(s.startedAt, Math.ceil(s.durationSec / 60));
    const v = s.visitor;

    conversations.push({
      id: convId,
      account_id: SPLETNOST_ID,
      agent_id: SPLETNOST_AGENT,
      elevenlabs_conversation_id: `el_conv_sample_${s.key}`,
      started_at: s.startedAt,
      duration_sec: s.durationSec,
      transcript: transcript(s.durationSec, s.lines),
      summary: s.summary,
      outcome: s.outcome,
      visitor_name: v?.name ?? null,
      visitor_email: v?.email ?? null,
      visitor_phone: v?.phone ?? null,
      topic: s.topic,
      agreed: s.agreed,
      visitor_email_status: v ? (s.visitorEmailFails ? 'failed' : 'sent') : 'skipped',
      owner_email_status: 'sent',
    });

    emailLog.push({
      id: `mail_${s.key}_owner`,
      account_id: SPLETNOST_ID,
      conversation_id: convId,
      kind: 'owner_notification',
      to: notifications.notify_email,
      subject: `Nov pogovor: ${s.topic}`,
      status: 'sent',
      error: null,
      sent_at: minutesAfter(endedAt, 1),
    });

    if (v) {
      emailLog.push({
        id: `mail_${s.key}_visitor`,
        account_id: SPLETNOST_ID,
        conversation_id: convId,
        kind: 'visitor_confirmation',
        to: v.email,
        subject: 'Povzetek pogovora – Spletnost',
        status: s.visitorEmailFails ? 'failed' : 'sent',
        error: s.visitorEmailFails ?? null,
        sent_at: minutesAfter(endedAt, 1),
      });
    }

    if (v && s.lead) {
      const leadId = `lead_spl_${s.key}`;
      leads.push({
        id: leadId,
        account_id: SPLETNOST_ID,
        agent_id: SPLETNOST_AGENT,
        name: v.name,
        email: v.email,
        phone: v.phone,
        what_they_wanted: s.lead.wanted,
        conversation_id: convId,
        status: s.lead.status,
        created_at: endedAt,
      });

      if (s.booking) {
        bookings.push({
          id: `book_spl_${s.key}`,
          account_id: SPLETNOST_ID,
          agent_id: SPLETNOST_AGENT,
          lead_id: leadId,
          conversation_id: convId,
          customer_name: v.name,
          customer_email: v.email,
          customer_phone: v.phone,
          start: s.booking.start,
          end: minutesAfter(s.booking.start, s.booking.lengthMin),
          topic: s.topic,
          mode: s.booking.mode,
          status: s.booking.status,
          calendar_event_id: s.booking.mode === 'auto' ? `evt_sample_${s.key}` : null,
        });
      }
    }
  }

  const invoices: (Invoice & { account_id: Id })[] = [1, 2, 3].map((n) => {
    const issued = daysAgo(26 + (n - 1) * 30, 8, 0, now);
    return {
      id: `inv_spl_${n}`,
      account_id: SPLETNOST_ID,
      number: `VZOREC-${String(4 - n).padStart(4, '0')}`,
      issued_at: issued,
      amount_eur: 59,
      status: 'paid' as const,
      description: 'Paket Rast – mesečna naročnina',
    };
  });

  return {
    account,
    users,
    agent,
    bookingSettings,
    calendar,
    notifications,
    sources,
    conversations,
    leads,
    bookings,
    emailLog,
    invoices,
  };
}

/* -------------------------------------------- two more accounts for admin */

function miniConversation(
  accountId: Id,
  agentId: Id,
  key: string,
  startedAt: string,
  durationSec: number,
  topic: string,
  summary: string,
  lines: string[],
): Conversation {
  return {
    id: `conv_${key}`,
    account_id: accountId,
    agent_id: agentId,
    elevenlabs_conversation_id: `el_conv_sample_${key}`,
    started_at: startedAt,
    duration_sec: durationSec,
    transcript: transcript(durationSec, lines),
    summary,
    outcome: 'question',
    visitor_name: null,
    visitor_email: null,
    visitor_phone: null,
    topic,
    agreed: null,
    visitor_email_status: 'skipped',
    owner_email_status: 'sent',
  };
}

function simplePages(
  accountId: Id,
  agentId: Id,
  baseUrl: string,
  prefix: string,
  pages: [string, string, number][],
  syncedAt: string,
): KnowledgeSource[] {
  return pages.map(([path, title, chars], i) => ({
    id: `${prefix}_page_${i + 1}`,
    account_id: accountId,
    agent_id: agentId,
    type: 'website_page' as const,
    title,
    url: `${baseUrl}${path}`,
    content: null,
    file_url: null,
    included: true,
    status: 'synced' as const,
    elevenlabs_doc_id: `doc_${prefix}_${i + 1}`,
    chars,
    last_synced_at: syncedAt,
    error: null,
  }));
}

function buildOtherAccounts(now: Date) {
  /* Frizerski salon Lana — on trial */
  const lanaId: Id = 'acc_salon_lana';
  const lanaAgent: Id = 'agt_salon_lana';
  const lana = {
    account: {
      id: lanaId,
      name: 'Frizerski salon Lana',
      website_url: 'https://salon-lana.example.si',
      status: 'trial',
      plan_key: null,
      trial_ends_at: daysAhead(9, 23, 59, now),
      period_start: daysAgo(5, 0, 0, now),
      period_end: daysAhead(9, 23, 59, now),
      minutes_included: TRIAL_MINUTES,
      minutes_used: 12,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      language: 'sl',
      timezone: 'Europe/Ljubljana',
      created_at: daysAgo(5, 18, 40, now),
    } satisfies Account,
    user: {
      id: 'usr_lana_1',
      account_id: lanaId,
      name: 'Lana Bizjak',
      email: 'lana.bizjak@example.si',
      account_role: 'owner',
      status: 'active',
      created_at: daysAgo(5, 18, 40, now),
    } satisfies User,
    agent: {
      id: lanaAgent,
      account_id: lanaId,
      name: 'Tina',
      business_name: 'Frizerski salon Lana',
      elevenlabs_agent_id: 'agent_sample_2m9q1',
      voice_id: 'voice_sl_tina',
      language: 'sl',
      first_message:
        'Pozdravljeni, sem Tina, AI pomočnica Frizerskega salona Lana. Kako vam lahko pomagam?',
      instructions: defaultInstructions('Frizerski salon Lana'),
      status: 'active',
      allowed_domain: 'salon-lana.example.si',
      widget_accent_color: '#A8432F',
      widget_text_input: true,
      widget_position: 'bottom-right',
      kb_folder_id: 'kb_sample_lana',
      crawl_job_id: 'crawl_sample_0977',
      auto_sync_days: 7,
      last_sync_at: daysAgo(2, 7, 0, now),
      webhook_token: 'mt_sample_51d0aa3c72',
    } satisfies Agent,
    booking: {
      account_id: lanaId,
      agent_id: lanaAgent,
      mode: 'request',
      calendar_id: null,
      working_hours: {
        ...structuredClone(DEFAULT_WORKING_HOURS),
        sat: { open: true, from: '08:00', to: '13:00' },
      },
      appointment_length_min: 45,
      buffer_min: 0,
      min_notice_hours: 2,
      max_days_ahead: 30,
    } satisfies BookingSettings,
    notifications: {
      account_id: lanaId,
      notify_email: 'lana.bizjak@example.si',
      sender_name: 'Frizerski salon Lana',
      reply_to: 'lana.bizjak@example.si',
      visitor_email_enabled: true,
      owner_email_enabled: true,
      visitor_template: DEFAULT_VISITOR_TEMPLATE,
      owner_template: DEFAULT_OWNER_TEMPLATE,
    } satisfies NotificationSettings,
    sources: simplePages(
      lanaId,
      lanaAgent,
      'https://salon-lana.example.si',
      'lana',
      [
        ['/', 'Domov', 2140],
        ['/storitve/', 'Storitve in cenik', 3380],
        ['/o-nas/', 'O salonu', 1720],
        ['/kontakt/', 'Kontakt in delovni čas', 640],
      ],
      daysAgo(2, 7, 0, now),
    ),
    conversations: [
      miniConversation(
        lanaId,
        lanaAgent,
        'lana_01',
        daysAgo(1, 17, 25, now),
        264,
        'Cena barvanja las',
        'Obiskovalka je vprašala za ceno barvanja dolgih las in delovni čas ob sobotah.',
        [
          'Pozdravljeni, sem Tina, AI pomočnica Frizerskega salona Lana. Kako vam lahko pomagam?',
          'Koliko stane barvanje dolgih las?',
          'Barvanje dolgih las stane od petinpetdeset evrov. Končna cena je odvisna od dolžine in količine barve.',
          'Ali delate tudi ob sobotah?',
          'Da, ob sobotah smo odprti od osmih do trinajstih. Želite, da zapišem vašo željo za termin?',
          'Ne, hvala, bom poklicala.',
        ],
      ),
      miniConversation(
        lanaId,
        lanaAgent,
        'lana_02',
        daysAgo(3, 10, 5, now),
        198,
        'Striženje otrok',
        'Obiskovalec je vprašal, ali v salonu strižejo tudi otroke in koliko to stane.',
        [
          'Pozdravljeni, sem Tina, AI pomočnica Frizerskega salona Lana. Kako vam lahko pomagam?',
          'Ali strižete tudi otroke?',
          'Da, otroško striženje stane dvanajst evrov.',
          'Je treba prej naročiti termin?',
          'Priporočamo naročilo. Želite, da zapišem vašo željo za termin in vam jo salon potrdi?',
          'Zaenkrat ne, hvala.',
        ],
      ),
    ],
  };

  /* Zobna ordinacija Vidmar — payment failed, agent paused */
  const vidId: Id = 'acc_zobna_vidmar';
  const vidAgent: Id = 'agt_zobna_vidmar';
  const vidmar = {
    account: {
      id: vidId,
      name: 'Zobna ordinacija Vidmar',
      website_url: 'https://zobna-vidmar.example.si',
      status: 'past_due',
      plan_key: 'start',
      trial_ends_at: null,
      period_start: daysAgo(33, 0, 0, now),
      period_end: daysAgo(3, 0, 0, now),
      minutes_included: 100,
      minutes_used: 64,
      stripe_customer_id: 'cus_sample_vidmar',
      stripe_subscription_id: 'sub_sample_vidmar',
      language: 'sl',
      timezone: 'Europe/Ljubljana',
      created_at: daysAgo(124, 12, 0, now),
    } satisfies Account,
    user: {
      id: 'usr_vidmar_1',
      account_id: vidId,
      name: 'Matej Vidmar',
      email: 'ordinacija@example.com',
      account_role: 'owner',
      status: 'active',
      created_at: daysAgo(124, 12, 0, now),
    } satisfies User,
    agent: {
      id: vidAgent,
      account_id: vidId,
      name: 'Ana',
      business_name: 'Zobna ordinacija Vidmar',
      elevenlabs_agent_id: 'agent_sample_8x4d7',
      voice_id: 'voice_sl_ana',
      language: 'sl',
      first_message:
        'Pozdravljeni, sem Ana, AI pomočnica Zobne ordinacije Vidmar. Kako vam lahko pomagam?',
      instructions: defaultInstructions('Zobna ordinacija Vidmar'),
      status: 'paused',
      allowed_domain: 'zobna-vidmar.example.si',
      widget_accent_color: '#243B7A',
      widget_text_input: true,
      widget_position: 'bottom-right',
      kb_folder_id: 'kb_sample_vidmar',
      crawl_job_id: 'crawl_sample_0388',
      auto_sync_days: 14,
      last_sync_at: daysAgo(6, 5, 30, now),
      webhook_token: 'mt_sample_c07be1194f',
    } satisfies Agent,
    booking: {
      account_id: vidId,
      agent_id: vidAgent,
      mode: 'request',
      calendar_id: null,
      working_hours: structuredClone(DEFAULT_WORKING_HOURS),
      appointment_length_min: 30,
      buffer_min: 10,
      min_notice_hours: 24,
      max_days_ahead: 60,
    } satisfies BookingSettings,
    notifications: {
      account_id: vidId,
      notify_email: 'ordinacija@example.com',
      sender_name: 'Zobna ordinacija Vidmar',
      reply_to: 'ordinacija@example.com',
      visitor_email_enabled: true,
      owner_email_enabled: true,
      visitor_template: DEFAULT_VISITOR_TEMPLATE,
      owner_template: DEFAULT_OWNER_TEMPLATE,
    } satisfies NotificationSettings,
    sources: [
      ...simplePages(
        vidId,
        vidAgent,
        'https://zobna-vidmar.example.si',
        'vid',
        [
          ['/', 'Domov', 3020],
          ['/storitve/', 'Storitve', 6410],
          ['/cenik/', 'Cenik', 2880],
          ['/ekipa/', 'Ekipa', 1930],
          ['/kontakt/', 'Kontakt', 720],
        ],
        daysAgo(6, 5, 30, now),
      ),
      {
        id: 'vid_file_1',
        account_id: vidId,
        agent_id: vidAgent,
        type: 'file' as const,
        title: 'Navodila-po-posegu.docx',
        url: null,
        content: null,
        file_url: 'sample://files/Navodila-po-posegu.docx',
        included: true,
        status: 'error' as const,
        elevenlabs_doc_id: null,
        chars: 0,
        last_synced_at: null,
        error: 'Datoteke ni bilo mogoče prebrati: dokument je zaščiten z geslom.',
      },
    ] satisfies KnowledgeSource[],
    conversations: [
      miniConversation(
        vidId,
        vidAgent,
        'vid_01',
        daysAgo(4, 8, 50, now),
        231,
        'Prvi pregled',
        'Obiskovalka je vprašala, koliko stane prvi pregled in ali sprejemajo nove paciente.',
        [
          'Pozdravljeni, sem Ana, AI pomočnica Zobne ordinacije Vidmar. Kako vam lahko pomagam?',
          'Ali sprejemate nove paciente?',
          'Da, nove paciente sprejemamo. Prvi pregled stane petinštirideset evrov.',
          'Kako dolgo se čaka na termin?',
          'O čakalni dobi nimam zapisanega podatka. Želite, da zapišem vašo željo za termin in vam jo ordinacija potrdi?',
          'Ne, bom poklicala v ordinacijo.',
        ],
      ),
      miniConversation(
        vidId,
        vidAgent,
        'vid_02',
        daysAgo(7, 15, 10, now),
        176,
        'Beljenje zob',
        'Obiskovalec je vprašal za ceno beljenja zob. Odgovor je dobil iz cenika.',
        [
          'Pozdravljeni, sem Ana, AI pomočnica Zobne ordinacije Vidmar. Kako vam lahko pomagam?',
          'Koliko stane beljenje zob?',
          'Beljenje zob v ordinaciji stane dvesto dvajset evrov.',
          'Koliko časa traja?',
          'Postopek traja približno eno uro.',
          'Hvala.',
        ],
      ),
    ],
    emailLog: [
      {
        id: 'mail_vid_fail_1',
        account_id: vidId,
        conversation_id: 'conv_vid_01',
        kind: 'owner_notification',
        to: 'ordinacija@example.com',
        subject: 'Nov pogovor: Prvi pregled',
        status: 'sent',
        error: null,
        sent_at: daysAgo(4, 8, 56, now),
      },
    ] satisfies EmailLog[],
    invoices: [
      {
        id: 'inv_vid_1',
        account_id: vidId,
        number: 'VZOREC-0012',
        issued_at: daysAgo(3, 8, 0, now),
        amount_eur: 29,
        status: 'failed',
        description: 'Paket Start – mesečna naročnina',
      },
    ] satisfies (Invoice & { account_id: Id })[],
  };

  return { lana, vidmar };
}

/* ----------------------------------------------------------------- session */

export const LOGGED_OUT_SESSION: Session = {
  loggedIn: false,
  role: 'customer',
  userName: '',
  email: '',
  accountId: SPLETNOST_ID,
  onboardingStep: 'done',
};

/** The person every simulated login becomes. */
export const SAMPLE_LOGIN_USER = { name: 'Marko Jereb', email: 'marko.jereb@example.si' };

/* --------------------------------------------------------------------- db */

export function createSampleDb(now: Date = new Date()): Db {
  const s = buildSpletnost(now);
  const { lana, vidmar } = buildOtherAccounts(now);

  return {
    version: DB_VERSION,
    seeded_at: now.toISOString(),
    session: { ...LOGGED_OUT_SESSION },
    accounts: [s.account, lana.account, vidmar.account],
    users: [...s.users, lana.user, vidmar.user],
    agents: [s.agent, lana.agent, vidmar.agent],
    bookingSettings: [s.bookingSettings, lana.booking, vidmar.booking],
    calendarConnections: [s.calendar],
    notificationSettings: [s.notifications, lana.notifications, vidmar.notifications],
    sources: [...s.sources, ...lana.sources, ...vidmar.sources],
    conversations: [...s.conversations, ...lana.conversations, ...vidmar.conversations],
    leads: s.leads,
    bookings: s.bookings,
    emailLog: [...s.emailLog, ...vidmar.emailLog],
    invoices: [...s.invoices, ...vidmar.invoices],
    plans: structuredClone(SAMPLE_PLANS),
    installCodeCopied: { [SPLETNOST_ID]: true },
  };
}

/** A new, empty trial account — what `register()` creates. */
export function createEmptyAccountBundle(
  input: { businessName: string; userName: string; email: string },
  now: Date = new Date(),
) {
  const stamp = now.getTime().toString(36);
  const accountId: Id = `acc_${stamp}`;
  const agentId: Id = `agt_${stamp}`;
  const createdAt = now.toISOString();

  const account: Account = {
    id: accountId,
    name: input.businessName,
    website_url: '',
    status: 'trial',
    plan_key: null,
    trial_ends_at: daysAhead(TRIAL_DAYS, 23, 59, now),
    period_start: createdAt,
    period_end: daysAhead(TRIAL_DAYS, 23, 59, now),
    minutes_included: TRIAL_MINUTES,
    minutes_used: 0,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    language: 'sl',
    timezone: 'Europe/Ljubljana',
    created_at: createdAt,
  };

  const user: User = {
    id: `usr_${stamp}`,
    account_id: accountId,
    name: input.userName,
    email: input.email,
    account_role: 'owner',
    status: 'active',
    created_at: createdAt,
  };

  const agent: Agent = {
    id: agentId,
    account_id: accountId,
    name: 'Jan',
    business_name: input.businessName,
    elevenlabs_agent_id: null,
    voice_id: 'voice_sl_jan',
    language: 'sl',
    first_message: `Pozdravljeni, sem Jan, AI pomočnik podjetja ${input.businessName}. Kako vam lahko pomagam?`,
    instructions: defaultInstructions(input.businessName),
    status: 'draft',
    allowed_domain: '',
    widget_accent_color: '#0A6C8F',
    widget_text_input: true,
    widget_position: 'bottom-right',
    kb_folder_id: null,
    crawl_job_id: null,
    auto_sync_days: 7,
    last_sync_at: null,
    webhook_token: `mt_sample_${stamp}`,
  };

  const bookingSettings: BookingSettings = {
    account_id: accountId,
    agent_id: agentId,
    mode: 'request',
    calendar_id: null,
    working_hours: structuredClone(DEFAULT_WORKING_HOURS),
    appointment_length_min: 30,
    buffer_min: 15,
    min_notice_hours: 4,
    max_days_ahead: 21,
  };

  const notifications: NotificationSettings = {
    account_id: accountId,
    notify_email: input.email,
    sender_name: input.businessName,
    reply_to: input.email,
    visitor_email_enabled: true,
    owner_email_enabled: true,
    visitor_template: DEFAULT_VISITOR_TEMPLATE,
    owner_template: DEFAULT_OWNER_TEMPLATE,
  };

  return { account, user, agent, bookingSettings, notifications };
}

export function planByKey(plans: Plan[], key: PlanKey | null): Plan | null {
  return plans.find((p) => p.key === key) ?? null;
}

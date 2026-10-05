/**
 * The fictional business used by every example on the landing page. The people, the
 * address and the numbers are invented; nothing here comes from a real customer.
 */
import { BRAND } from '@/brand';
import type { BookingStatus, ConversationOutcome, EmailStatus } from '@/data/api';

export const EXAMPLE_BUSINESS = 'Frizerski salon Lana';
export const EXAMPLE_AGENT = 'Jan';
export const EXAMPLE_SITE = 'salon-lana.example.si';
export const EXAMPLE_GREETING = `Pozdravljeni, sem ${EXAMPLE_AGENT}, AI pomočnik salona Lana. Kako vam lahko pomagam?`;

/** Pages Mansa AI "found" on the example site (step 1 of Kako deluje). */
export const EXAMPLE_PAGES: { id: string; title: string; path: string; included: boolean }[] = [
  { id: 'domov', title: 'Domov', path: '/', included: true },
  { id: 'storitve', title: 'Storitve in cenik', path: '/storitve', included: true },
  { id: 'o-salonu', title: 'O salonu', path: '/o-salonu', included: true },
  { id: 'kontakt', title: 'Kontakt', path: '/kontakt', included: true },
  { id: 'blog', title: 'Blog: nega las pozimi', path: '/blog/nega-las-pozimi', included: false },
];

/** Same shape as the real embed line, with the product name in the host like api.getEmbedCode(). */
export const EXAMPLE_EMBED_CODE = `<script src="https://widget.${BRAND.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.example/v1.js" data-agent="agt_vzorec" async></script>`;

/** Opening of an example conversation (step 3 of Kako deluje). */
export const EXAMPLE_TURNS: { role: 'agent' | 'visitor'; timeSec: number; text: string }[] = [
  { role: 'agent', timeSec: 0, text: EXAMPLE_GREETING },
  { role: 'visitor', timeSec: 9, text: 'Rada bi se naročila na striženje v soboto.' },
  { role: 'agent', timeSec: 15, text: 'Prosta sta termina ob devetih in ob enajstih. Kateri vam ustreza?' },
];

/** The conversation card of "Kaj vidite vi" — same fields as Pogovori → detail. */
export const EXAMPLE_CONVERSATION: {
  /** card title, with the name in the instrumental case */
  title: string;
  durationSec: number;
  outcome: ConversationOutcome;
  summary: string;
  data: { label: string; value: string }[];
  agreed: string;
  bookingStatus: BookingStatus;
  visitorEmail: EmailStatus;
  ownerEmail: EmailStatus;
} = {
  title: 'Pogovor z Nino Perko',
  durationSec: 204,
  outcome: 'booking',
  summary:
    'Obiskovalka je spraševala po striženju in barvanju las. Agent ji je ponudil dva prosta termina, izbrala je soboto ob 11:00.',
  data: [
    { label: 'Ime', value: 'Nina Perko' },
    { label: 'E-naslov', value: 'nina.perko@example.si' },
    { label: 'Telefon', value: '041 555 034' },
    { label: 'Kaj je želela', value: 'Striženje in barvanje las' },
  ],
  agreed: 'Sobota ob 11:00, striženje in barvanje.',
  bookingStatus: 'confirmed',
  visitorEmail: 'sent',
  ownerEmail: 'sent',
};

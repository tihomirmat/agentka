import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { BRAND } from '@/brand';
import { useTrialTermsText } from './shared/trial';
import agentIcon from '@/assets/agentka-icon.png';
import { QUESTIONS } from './landing/faqData';
import './landing/landing.css';

/**
 * Route "/" — the sales page. Visual style follows the reference the owner supplied
 * (Spletnost_Voice_Agent_Redesign.html); content states only what Agentka does per the spec.
 * Own header and footer (outside PublicShell). In-page links scroll with scrollIntoView,
 * because the app uses hash routing and "#section" would be read as a route.
 */
export default function Landing() {
  const trial = useTrialTermsText();
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Other pages link here with { scrollTo: id } (the router uses the hash, so no #anchors).
  const location = useLocation();
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (target) document.getElementById(target)?.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0 });
  }, [location.key, location.state]);

  return (
    <>
      <SiteHeader />
      <div className="lp">

      <main>
        {/* hero */}
        <section className="hero" aria-labelledby="hero-naslov">
          <div className="container hero-grid">
            <div>
              <div className="eyebrow">Glasovni pomočnik za spletne strani</div>
              <h1 id="hero-naslov">
                Vaša spletna stran lahko <em>odgovori.</em>
              </h1>
              <p className="lead">
                {BRAND} prebere besedilo vaše spletne strani in obiskovalcem po slovensko odgovarja na vprašanja,
                dogovori termin in vam po vsakem pogovoru pošlje povzetek.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" to="/registracija">
                  Začnite brezplačno <ArrowRight />
                </Link>
                <button type="button" className="btn btn-secondary" onClick={() => go('kako-deluje')}>
                  Kako deluje
                </button>
              </div>
              <div className="trustline">
                <span className="trustitem">
                  <span className="check">✓</span> Odgovarja po slovensko
                </span>
                <span className="trustitem">
                  <span className="check">✓</span> Brez menjave spletne strani
                </span>
                {trial ? (
                  <span className="trustitem">
                    <span className="check">✓</span> Brezplačni preizkus: {trial}
                  </span>
                ) : null}
              </div>
            </div>
            <Demo />
          </div>
        </section>

        {/* benefits */}
        <section className="section section-white" id="prednosti" aria-labelledby="prednosti-naslov">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">Manj čakanja. Več odgovorov.</div>
              <h2 id="prednosti-naslov">Pomočnik opravi prvi pogovor, vi prevzamete prave stranke.</h2>
              <p>Obiskovalec dobi odgovor takoj, tudi zvečer in ob vikendih. Vi dobite kontakt in povzetek pogovora.</p>
            </div>
            <div className="benefits">
              <Benefit tone="" icon={<ChatIcon />} title="Odgovarja iz vaših vsebin">
                Odgovore išče samo v besedilu vaše spletne strani ter v datotekah in besedilih, ki jih dodate. Česar v
                njih ni, si ne izmisli.
              </Benefit>
              <Benefit tone="blue" icon={<CalendarIcon />} title="Dogovori termin">
                Zapiše povpraševanje za termin ali, če povežete Google Koledar, sam rezervira prost termin.
              </Benefit>
              <Benefit tone="green" icon={<MailIcon />} title="Povzetek po vsakem pogovoru">
                Po pogovoru vam pošlje e-pošto s povzetkom in podatki obiskovalca, obiskovalcu pa potrditev dogovora.
              </Benefit>
            </div>
          </div>
        </section>

        {/* integration */}
        <section className="section" id="kako-deluje" aria-labelledby="integracija-naslov">
          <div className="container integration">
            <div>
              <div className="eyebrow">Namestitev brez drame</div>
              <h2 id="integracija-naslov">Ne menjate spletne strani. Dodate eno vrstico kode.</h2>
              <p className="sub">
                Pomočnik se pojavi kot gumb na vaši obstoječi strani. Povežete samo tisto, kar zares potrebujete.
              </p>
              <ul>
                <li>
                  <span className="check">✓</span>
                  <span>
                    <b>Spletna stran ostane vaša.</b> Deluje na vsaki strani, kamor lahko prilepite vrstico kode.
                  </span>
                </li>
                <li>
                  <span className="check">✓</span>
                  <span>
                    <b>CRM ni pogoj.</b> Kontakte in povzetke dobite po e-pošti in jih vidite v aplikaciji.
                  </span>
                </li>
                <li>
                  <span className="check">✓</span>
                  <span>
                    <b>Koledar po potrebi.</b> Google Koledar potrebujete samo za samodejno rezervacijo.
                  </span>
                </li>
              </ul>
            </div>
            <div className="flow" aria-label="Kako se pomočnik poveže z vašimi orodji">
              <FlowRow
                left={{ mini: 'WWW', title: 'Vaša spletna stran', sub: 'obstoječa stran' }}
                arrow="→"
                right={{ mini: '●', title: 'Glasovni pomočnik', sub: 'pogovor z obiskovalcem', tone: 'orange' }}
              />
              <FlowRow
                left={{ mini: 'TXT', title: 'Vaše vsebine', sub: 'stran, cenik, datoteke' }}
                arrow="→"
                right={{ mini: '↻', title: 'Baza znanja', sub: 'odgovori iz vaših virov', tone: 'orange' }}
              />
              <FlowRow
                left={{ mini: '@', title: 'E-pošta', sub: 'povzetek in kontakt', tone: 'green' }}
                arrow="←"
                right={{ mini: '✓', title: 'Kontakt', sub: 'ime, e-naslov, želja', tone: 'orange' }}
              />
              <FlowRow
                left={{ mini: '31', title: 'Google Koledar', sub: 'samodejna rezervacija', tone: 'green' }}
                arrow="←"
                right={{ mini: '↗', title: 'Termin', sub: 'dogovorjen v pogovoru', tone: 'orange' }}
              />
            </div>
          </div>
        </section>

        {/* steps */}
        <section className="section section-white" aria-labelledby="koraki-naslov">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">Od registracije do prvega pogovora</div>
              <h2 id="koraki-naslov">Trije koraki.</h2>
              <p>Nastavitev vodi čarovnik. Prekinete jo lahko kadar koli in nadaljujete pozneje.</p>
            </div>
            <div className="steps">
              <article className="step">
                <h3>Vpišete naslov svoje strani</h3>
                <p>{BRAND} prebere besedilo vaših strani. Strani, ki jih pomočnik ne sme uporabiti, izklopite.</p>
              </article>
              <article className="step">
                <h3>Nastavite pomočnika</h3>
                <p>Izberete ime in glas, način dogovarjanja terminov in e-naslov, kamor pridejo obvestila.</p>
              </article>
              <article className="step">
                <h3>Prilepite kodo in spremljate</h3>
                <p>Pomočnik je na strani. V aplikaciji vidite pogovore, kontakte in dogovorjene termine.</p>
              </article>
            </div>
          </div>
        </section>

        {/* who */}
        <section className="section" aria-labelledby="komu-naslov">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">Komu najbolj koristi</div>
              <h2 id="komu-naslov">Povsod, kjer se ista vprašanja ponavljajo.</h2>
            </div>
            <div className="industries">
              {[
                'Frizerski in kozmetični saloni',
                'Zobne in zdravstvene ordinacije',
                'Avtoservisi',
                'Turizem in nastanitve',
                'Storitvena podjetja',
                'Nepremičnine',
                'Izobraževanja',
                'Spletne trgovine',
              ].map((p) => (
                <span className="pill" key={p}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* faq */}
        <section className="section section-white" id="vprasanja" aria-labelledby="vprasanja-naslov">
          <div className="container faq-wrap">
            <div className="faq-intro">
              <div className="eyebrow">Pogosta vprašanja</div>
              <h2 id="vprasanja-naslov">Kar lastnike najpogosteje zanima.</h2>
              <p className="sub">
                Ne najdete odgovora? Preizkusite pomočnika brezplačno in presodite sami.
              </p>
            </div>
            <Faq />
          </div>
        </section>

        {/* cta */}
        <section className="cta" aria-labelledby="cta-naslov">
          <div className="container">
            <div className="cta-box">
              <div>
                <h2 id="cta-naslov">Preizkusite, kako bi govoril za vaše podjetje.</h2>
                <p>
                  Vpišete naslov strani in v nekaj minutah se lahko s pomočnikom pogovorite sami.
                  {trial ? ` Brezplačni preizkus: ${trial}.` : ''}
                </p>
              </div>
              <Link className="btn btn-primary" to="/registracija">
                Začnite brezplačno
              </Link>
            </div>
          </div>
        </section>
      </main>

      </div>
      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ demo */

/**
 * Public ElevenLabs agent "Agentka demo - salon Lana (agentka.si)": female Slovenian voice,
 * max 60 s per conversation, 50 conversations a day, only agentka.si / www.agentka.si may connect.
 * The agent id is public by design (it is what any website widget embeds).
 */
const DEMO_AGENT_ID = 'agent_5401m4kjqkakfnvrt2rbjq2gdgey';
const DEMO_SECONDS = 60;
const BARS: [number, number][] = [
  [18, 0.05], [35, 0.14], [52, 0.21], [28, 0.09], [60, 0.25], [41, 0.13], [24, 0.3],
  [49, 0.06], [34, 0.18], [56, 0.11], [30, 0.28], [45, 0.16], [20, 0.03],
];

type Phase = 'idle' | 'connecting' | 'live' | 'ended' | 'error';

/** Real voice conversation with the demo agent of the FICTIONAL salon Lana. */
function Demo() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [speaking, setSpeaking] = useState(false);
  const [agentLine, setAgentLine] = useState('');
  const [visitorLine, setVisitorLine] = useState('');
  const [left, setLeft] = useState(DEMO_SECONDS);
  const [error, setError] = useState('');
  const conv = useRef<{ endSession: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (phase !== 'live') return;
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);
  useEffect(() => () => void conv.current?.endSession(), []);

  const start = async () => {
    setError('');
    setAgentLine('');
    setVisitorLine('');
    setLeft(DEMO_SECONDS);
    setPhase('connecting');
    try {
      const { Conversation } = await import('@elevenlabs/client');
      conv.current = await Conversation.startSession({
        agentId: DEMO_AGENT_ID,
        connectionType: 'websocket',
        textOnly: false,
        onConnect: () => setPhase('live'),
        onDisconnect: () => {
          conv.current = null;
          setSpeaking(false);
          setPhase((p) => (p === 'error' ? p : 'ended'));
        },
        onModeChange: ({ mode }) => setSpeaking(mode === 'speaking'),
        onMessage: ({ message, role }) => (role === 'user' ? setVisitorLine(message) : setAgentLine(message)),
        onError: (message) => {
          setError(message || 'Povezava z glasovno agentko ni uspela.');
          setPhase('error');
        },
      });
    } catch (e) {
      const name = e instanceof Error ? e.name : '';
      setError(
        name === 'NotAllowedError' || name === 'NotFoundError'
          ? 'Za pogovor dovolite brskalniku uporabo mikrofona in poskusite znova.'
          : 'Glasovne agentke trenutno ni mogoče poklicati. Poskusite znova čez trenutek.',
      );
      setPhase('error');
      conv.current = null;
    }
  };
  const stop = async () => {
    await conv.current?.endSession();
    conv.current = null;
  };

  const live = phase === 'live';
  const status =
    phase === 'connecting'
      ? 'Povezujem …'
      : live
        ? speaking
          ? 'Ana govori'
          : 'Ana posluša – govorite'
        : 'Glasovna predstavitev';

  return (
    <div className="demo-shell" aria-label="Glasovna predstavitev agentke">
      <div className="demo-head">
        <div className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="status" aria-live="polite">
          {status}
        </div>
      </div>
      <div className="demo-body">
        <div className="agent-top">
          <div className="avatar avatar-photo" aria-hidden="true">
            <img src={agentIcon} alt="" />
          </div>
          <div>
            <div className="agent-name">Ana, AI pomočnica</div>
            <div className="agent-sub">Frizerski salon Lana (izmišljen primer)</div>
          </div>
        </div>
        <div className="wave-card">
          <div className={`wave${live && speaking ? ' active' : ''}${live ? ' on' : ''}`} aria-hidden="true">
            {BARS.map(([h, d], i) => (
              <i key={i} style={{ ['--h' as string]: `${h}px`, ['--d' as string]: `${d}s` }} />
            ))}
          </div>

          <div className="turns" aria-live="polite">
            {visitorLine ? (
              <div className="turn visitor">
                <b>Vi</b>
                {visitorLine}
              </div>
            ) : null}
            <div className="turn">
              <b>Ana</b>
              {agentLine ||
                (phase === 'ended'
                  ? 'Hvala za pogovor. Tako bi govorila z obiskovalci vaše spletne strani.'
                  : 'Kliknite spodnji gumb in me vprašajte o cenah, delovnem času ali prostem terminu.')}
            </div>
          </div>

          {error ? (
            <p className="demo-error" role="alert">
              {error}
            </p>
          ) : null}

          {live || phase === 'connecting' ? (
            <div className="call-row">
              <span className="call-timer" aria-label={`Še ${left} sekund`}>
                0:{String(left).padStart(2, '0')}
              </span>
              <button type="button" className="btn btn-secondary" onClick={() => void stop()} disabled={!live}>
                Končaj pogovor
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary btn-call" onClick={() => void start()}>
              <MicGlyph /> {phase === 'ended' || phase === 'error' ? 'Pogovorite se znova' : 'Pogovorite se z Ano'}
            </button>
          )}

          <div className="demo-note">
            Pravi glasovni pogovor, največ 1 minuto. Brskalnik vas bo vprašal za dovoljenje za mikrofon. Salon in podatki so
            izmišljeni, nič se ne rezervira.
          </div>
        </div>
      </div>
    </div>
  );
}

function MicGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ faq */

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {QUESTIONS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div className={`faq-item${isOpen ? ' open' : ''}`} key={item.q}>
            <button
              type="button"
              className="faq-q"
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span>{item.q}</span>
              <span className="plus" aria-hidden="true">
                +
              </span>
            </button>
            <div className="faq-a" id={`faq-${i}`} hidden={!isOpen}>
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ small parts */

function Benefit({ tone, icon, title, children }: { tone: string; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <article className="card">
      <div className={`iconbox ${tone}`}>{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

type Sys = { mini: string; title: string; sub: string; tone?: 'orange' | 'green' };
function FlowRow({ left, right, arrow }: { left: Sys; right: Sys; arrow: string }) {
  const box = (s: Sys) => (
    <div className={`system ${s.tone ?? ''}`}>
      <div className="mini" aria-hidden="true">
        {s.mini}
      </div>
      <div>
        <b>{s.title}</b>
        <small>{s.sub}</small>
      </div>
    </div>
  );
  return (
    <div className="flow-row">
      {box(left)}
      <div className="arrow" aria-hidden="true">
        {arrow}
      </div>
      {box(right)}
    </div>
  );
}

const svg = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const;
function ArrowRight() {
  return (
    <svg {...svg} width={18} height={18}>
      <path d="M5 12h13M13 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg {...svg}>
      <path d="M4 5h16v11H8l-4 3V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg {...svg}>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg {...svg}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

import { BRAND, BRAND_TAGLINE } from '@/brand';
import { ButtonLink } from '@/components/ui';
import { AgentWidget } from '@/components/widget';
import { EXAMPLE_AGENT, EXAMPLE_BUSINESS, EXAMPLE_GREETING } from './example';

/** Thesis, the two ways forward, and the shared widget as a live demo. Sized to its content. */
export function Hero() {
  return (
    <section aria-labelledby="hero-naslov">
      <div className="page grid items-center gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
        <div className="min-w-0">
          <p className="eyebrow">{BRAND_TAGLINE}</p>
          <h1
            id="hero-naslov"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-fg md:text-4xl"
          >
            Vaša spletna stran zdaj odgovarja z glasom
          </h1>
          <p className="mt-4 max-w-prose text-md text-fg-muted">
            {BRAND} prebere besedilo vaše spletne strani in po slovensko, podnevi in ponoči odgovarja iz njega,
            dogovarja termine ter vam po vsakem pogovoru pošlje povzetek.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink to="/registracija" variant="primary">
              Začnite brezplačno
            </ButtonLink>
            <ButtonLink to="/cenik">Poglejte cenik</ButtonLink>
          </div>
          <p className="mt-3 text-sm text-fg-subtle">Brezplačen preizkus ima omejeno število dni in minut.</p>
        </div>

        <div className="min-w-0 lg:justify-self-end">
          <AgentWidget
            agentName={EXAMPLE_AGENT}
            businessName={EXAMPLE_BUSINESS}
            firstMessage={EXAMPLE_GREETING}
            replySource="demo"
          />
          <p className="mt-3 max-w-sm text-sm text-fg-muted">
            Preizkusite sami: to je pomočnik izmišljenega salona. Vprašajte na primer »Koliko stane?« ali »Želim
            rezervirati termin.«
          </p>
        </div>
      </div>
    </section>
  );
}

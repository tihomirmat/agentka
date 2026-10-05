import { BRAND, BRAND_TAGLINE } from '@/brand';
import { ButtonLink } from '@/components/ui';
import { AgentWidget } from '@/components/widget';
import { WIDGET_COLORS } from '@/data/api';
import { TRIAL } from '@/data/labels';
import { useTrialTermsText } from '../shared/trial';
import { EXAMPLE_AGENT, EXAMPLE_BUSINESS, EXAMPLE_GREETING } from './example';

/**
 * Thesis, the two ways forward, the terms of the free trial in numbers (the only place on
 * this page that prints them) and the shared widget as a live demo of a fictional salon.
 */
export function Hero() {
  const trial = useTrialTermsText();
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
            {BRAND} prebere besedilo vaše spletne strani in iz njega obiskovalcem odgovarja po slovensko. Dogovarja
            termine in vam po vsakem pogovoru pošlje povzetek.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink to="/registracija" variant="primary">
              Začnite brezplačno
            </ButtonLink>
            <ButtonLink to="/cenik">Poglejte cenik</ButtonLink>
          </div>
          <p className="mt-3 min-h-5 text-sm text-fg-muted">{trial ? `${TRIAL.name}: ${trial}.` : null}</p>
        </div>

        <div className="min-w-0 lg:justify-self-end">
          <AgentWidget
            agentName={EXAMPLE_AGENT}
            businessName={EXAMPLE_BUSINESS}
            firstMessage={EXAMPLE_GREETING}
            accentHex={WIDGET_COLORS[0]?.hex}
            replySource="demo"
            note={false}
          />
          <div className="mt-3 flex max-w-sm flex-col gap-1.5">
            <p className="text-sm text-fg-muted">
              Poskusite sami. To je pomočnik izmišljenega salona Lana: vprašajte ga o cenah, delovnem času ali naslovu
              ali recite »Želim termin.«
            </p>
            <p className="text-xs text-fg-muted">
              Predstavitev: odgovori so vnaprej pripravljeni, glas bo na voljo ob zagonu.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import { ButtonLink, Card } from '@/components/ui';

/** Last band: one line and the primary button. */
export function FinalCta() {
  return (
    <section aria-labelledby="zakljucek-naslov" className="border-t border-border py-12 md:py-16">
      <div className="page">
        <Card tone="quiet" className="flex flex-col items-start gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 id="zakljucek-naslov" className="font-display text-2xl font-semibold tracking-tight text-fg">
              Preizkusite pomočnika na svoji spletni strani
            </h2>
            <p className="mt-1.5 text-base text-fg-muted">Brezplačen preizkus ima omejeno število dni in minut.</p>
          </div>
          <ButtonLink to="/registracija" variant="primary">
            Začnite brezplačno
          </ButtonLink>
        </Card>
      </div>
    </section>
  );
}

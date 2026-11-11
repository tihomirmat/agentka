import { Link } from 'react-router-dom';
import { DPA, LEGAL_VERSION, PRIVACY, SUBPROCESSORS, TERMS, type LegalSection } from './content';
import { TEXT_LINK } from '../shared/links';

const validFrom = LEGAL_VERSION.split('-').reverse().join('. ');

function Sections({ sections }: { sections: LegalSection[] }) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.h} className="mt-8">
          <h2 className="font-display text-xl font-semibold text-fg">{s.h}</h2>
          {s.p?.map((t) => (
            <p key={t} className="mt-3 text-base leading-relaxed text-fg-muted">
              {t}
            </p>
          ))}
          {s.list ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-fg-muted">
              {s.list.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  );
}

function Shell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="page py-10 md:py-14">
      <article className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">{title}</h1>
        <p className="mt-3 text-md text-fg-muted">{intro}</p>
        <p className="mt-1 text-sm text-fg-subtle">Velja od {validFrom}.</p>
        {children}
      </article>
    </div>
  );
}

/** Route "/pogoji": terms of use with the data processing agreement as Annex 1. */
export function TermsPage() {
  return (
    <Shell title="Pogoji uporabe" intro="Pogoji za uporabo storitve Agentka, vključno s pogodbo o obdelavi osebnih podatkov (Priloga 1).">
      <Sections sections={TERMS} />
      <div id="pogodba-o-obdelavi" className="mt-12 border-t border-border pt-4">
        <Sections sections={DPA} />
      </div>
      <p className="mt-10 text-sm text-fg-muted">
        Glej tudi{' '}
        <Link className={TEXT_LINK} to="/zasebnost">
          Politiko zasebnosti
        </Link>{' '}
        in{' '}
        <Link className={TEXT_LINK} to="/podizvajalci">
          seznam podizvajalcev
        </Link>
        .
      </p>
    </Shell>
  );
}

/** Route "/zasebnost": privacy policy of agentka.si. */
export function PrivacyPage() {
  return (
    <Shell title="Politika zasebnosti" intro="Kako na agentka.si zbiramo, uporabljamo in varujemo osebne podatke.">
      <Sections sections={PRIVACY} />
      <p className="mt-10 text-sm text-fg-muted">
        Seznam obdelovalcev:{' '}
        <Link className={TEXT_LINK} to="/podizvajalci">
          Podizvajalci
        </Link>
        .
      </p>
    </Shell>
  );
}

/** Route "/podizvajalci": the public list of sub-processors referred to by the DPA. */
export function SubprocessorsPage() {
  return (
    <Shell
      title="Podizvajalci"
      intro="Podjetja, ki za Agentko obdelujejo osebne podatke. O spremembah seznama naročnike obvestimo po e-pošti najmanj 14 dni vnaprej."
    >
      <div className="mt-8 flex flex-col gap-4">
        {SUBPROCESSORS.map((s) => (
          <section key={s.name} className="rounded-lg border border-border bg-surface p-4">
            <h2 className="text-md font-semibold text-fg">{s.name}</h2>
            <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
              <dt className="text-fg-subtle">Namen</dt>
              <dd className="text-fg-muted">{s.purpose}</dd>
              <dt className="text-fg-subtle">Lokacija</dt>
              <dd className="text-fg-muted">{s.location}</dd>
              <dt className="text-fg-subtle">Prenos iz EU</dt>
              <dd className="text-fg-muted">{s.transfer}</dd>
              <dt className="text-fg-subtle">Zasebnost</dt>
              <dd className="min-w-0 break-words">
                <a className={TEXT_LINK} href={s.url} target="_blank" rel="noreferrer">
                  {s.url.replace(/^https:\/\//, '')}
                </a>
              </dd>
            </dl>
          </section>
        ))}
      </div>
    </Shell>
  );
}

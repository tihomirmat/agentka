import { Circle, CircleCheck } from 'lucide-react';
import { ButtonLink, Card, CardHeader, Skeleton } from '@/components/ui';
import * as api from '@/data/api';
import { plural } from '@/data/format';
import { WIZARD_STEPS } from '@/data/labels';
import { cn } from '@/lib/cn';

interface Item {
  key: string;
  done: boolean;
  /** undefined while the answer is still loading */
  known: boolean;
  title: string;
  text: string;
  to: string;
  action: string;
}

/**
 * "Kaj še manjka": shown while the setup is not finished or the agent has no source to
 * answer from. It disappears by itself when both are done.
 */
export function SetupChecklist() {
  const session = api.useSession();
  const sources = api.useQuery(() => api.listSources(), []);

  const setupDone = session.onboardingStep === 'done';
  const rows = sources.data;
  const includedCount = rows?.filter((s) => s.included).length ?? 0;
  const sourcesKnown = rows !== undefined;
  const sourcesDone = sourcesKnown && includedCount > 0;

  if (setupDone && (!sourcesKnown || sourcesDone)) return null;

  const stepNumber = session.onboardingStep === 'done' ? 1 : session.onboardingStep;
  const stepLabel = WIZARD_STEPS.find((s) => s.step === stepNumber)?.label ?? '';

  const items: Item[] = [
    {
      key: 'setup',
      done: setupDone,
      known: true,
      title: 'Začetna nastavitev',
      text: setupDone ? 'Končana.' : `Čarovnik je pri koraku ${stepNumber} od ${WIZARD_STEPS.length}: ${stepLabel}.`,
      to: `/zacetek/${stepNumber}`,
      action: `Nadaljuj pri koraku ${stepNumber}`,
    },
    {
      key: 'sources',
      done: sourcesDone,
      known: sourcesKnown,
      title: 'Viri znanja',
      text: sourcesDone
        ? `Vključenih virov: ${includedCount}.`
        : 'Uvozite spletno stran ali dodajte besedilo, sicer agent ne more odgovarjati.',
      to: '/app/viri',
      action: 'Dodaj vire',
    },
  ];
  const missing = items.filter((i) => !i.done).length;

  return (
    <Card>
      <CardHeader
        title="Kaj še manjka"
        description={`Še ${plural(missing, ['korak', 'koraka', 'koraki', 'korakov'])} do agenta, ki lahko odgovarja obiskovalcem.`}
        divider
      />
      <ul>
        {items.map((item) => (
          <li
            key={item.key}
            className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5"
          >
            {item.known ? (
              item.done ? (
                <CircleCheck size={20} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle size={20} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden="true" />
              )
            ) : (
              <Skeleton className="mt-0.5 h-5 w-5 rounded-full" />
            )}
            <div className="min-w-0 flex-1 basis-48">
              <p className={cn('text-base font-medium', item.done ? 'text-fg-muted' : 'text-fg')}>
                {item.title}
                <span className="sr-only">{item.known ? (item.done ? ' (opravljeno)' : ' (manjka)') : ''}</span>
              </p>
              <p className="text-sm text-fg-muted">{item.known ? item.text : 'Preverjam stanje …'}</p>
            </div>
            {item.known && !item.done ? (
              <ButtonLink to={item.to} size="sm" className="shrink-0">
                {item.action}
              </ButtonLink>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

import { useEffect, useRef, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useSession } from '@/data/api';
import { WIZARD_STEPS } from '@/data/labels';
import { cn } from '@/lib/cn';
import { Logo, SampleDataNote } from '@/components/ui';

export type WizardStepNumber = 1 | 2 | 3 | 4 | 5;

function parseStep(value: string | undefined): WizardStepNumber | null {
  const n = Number(value);
  return n >= 1 && n <= 5 && Number.isInteger(n) ? (n as WizardStepNumber) : null;
}

/**
 * The step shown now and helpers to move. The step comes from the address
 * (/zacetek/3); without a number it is the step where the person stopped.
 * Saving progress (api.setOnboardingStep) is the page's job.
 */
export function useWizardStep() {
  const params = useParams();
  const session = useSession();
  const navigate = useNavigate();
  const resume: WizardStepNumber = session.onboardingStep === 'done' ? 1 : session.onboardingStep;
  const step = parseStep(params.step) ?? resume;
  return {
    step,
    isFirst: step === 1,
    isLast: step === 5,
    goTo: (n: WizardStepNumber) => navigate(`/zacetek/${n}`),
    /** leave the wizard for the app */
    exit: () => navigate('/app/pregled'),
  };
}

/** Wizard frame: logo, the five numbered steps, a centred column for the step. */
export function WizardShell() {
  const { step } = useWizardStep();
  const session = useSession();
  const reached = session.onboardingStep === 'done' ? 6 : session.onboardingStep;
  const mainRef = useRef<HTMLElement>(null);
  const current = WIZARD_STEPS.find((s) => s.step === step);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [step]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-bg">
        <div className="page flex h-topbar items-center justify-between gap-3">
          <Logo to="/app/pregled" size="sm" />
          <SampleDataNote responsive />
        </div>
      </header>

      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-gutter py-6 sm:py-10">
          <nav aria-label="Koraki nastavitve" className="mb-8">
            <p className="mb-3 text-sm text-fg-muted md:hidden">
              Korak {step} od {WIZARD_STEPS.length}: <span className="font-medium text-fg">{current?.label}</span>
            </p>
            {/* Five equal columns: a line, the number, a line; the name sits under the number. */}
            <ol className="grid grid-cols-5">
              {WIZARD_STEPS.map((s, i) => {
                const done = s.step < step || (s.step < reached && s.step !== step);
                const active = s.step === step;
                return (
                  <li key={s.step} className="min-w-0">
                    <NavLink
                      to={`/zacetek/${s.step}`}
                      aria-current={active ? 'step' : undefined}
                      aria-label={`Korak ${s.step}: ${s.label}${done ? ' (opravljeno)' : ''}`}
                      className="group flex min-w-0 flex-col items-center gap-2 rounded"
                    >
                      <span className="flex w-full items-center">
                        <span
                          aria-hidden="true"
                          className={cn('h-px flex-1', i === 0 ? 'bg-transparent' : s.step <= step ? 'bg-accent' : 'bg-border-strong')}
                        />
                        <span
                          className={cn(
                            'nums mx-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-100',
                            active && 'border-accent bg-accent text-accent-fg',
                            !active && done && 'border-accent bg-accent-soft text-accent-soft-fg',
                            !active && !done && 'border-border-strong bg-surface text-fg-muted group-hover:border-fg-subtle',
                          )}
                        >
                          {done && !active ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : s.step}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            'h-px flex-1',
                            i === WIZARD_STEPS.length - 1 ? 'bg-transparent' : s.step < step ? 'bg-accent' : 'bg-border-strong',
                          )}
                        />
                      </span>
                      <span
                        className={cn(
                          'hidden px-1 text-center text-sm md:block',
                          active ? 'font-semibold text-fg' : 'font-medium text-fg-muted group-hover:text-fg',
                        )}
                      >
                        {s.label}
                      </span>
                    </NavLink>
                  </li>
                );
              })}
            </ol>
          </nav>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export interface WizardStepProps {
  title: ReactNode;
  /** one or two sentences: what this step is for */
  description?: ReactNode;
  children: ReactNode;
  /** "Nazaj" button (left). Leave out on step 1. */
  back?: ReactNode;
  /** "Preskoči" button (right, quiet) */
  skip?: ReactNode;
  /** "Naprej" / "Končaj" button (right, primary) */
  next?: ReactNode;
}

/**
 * The body of one wizard step: heading, content and the bar with the three slots.
 *
 *   <WizardStep title="Vaša spletna stran" description="…"
 *     back={<Button variant="ghost" onClick={…}>Nazaj</Button>}
 *     skip={<Button variant="ghost" onClick={…}>Preskoči</Button>}
 *     next={<Button variant="primary" onClick={…}>Naprej</Button>}>
 *     …
 *   </WizardStep>
 */
export function WizardStep({ title, description, children, back, skip, next }: WizardStepProps) {
  return (
    <section className="min-w-0">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">{title}</h1>
      {description ? <p className="mt-2 max-w-prose text-md text-fg-muted">{description}</p> : null}
      <div className="mt-6 min-w-0">{children}</div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <div className="flex items-center gap-2">{back}</div>
        <div className="ml-auto flex items-center gap-2">
          {skip}
          {next}
        </div>
      </div>
    </section>
  );
}

/**
 * Setup wizard: /zacetek and /zacetek/:step. Five steps; steps 1 to 4 can be skipped, the
 * way out of the last one is "Končaj nastavitev" (or "Nadaljuj pozneje" in the shell).
 *
 * - The step comes from the address; /zacetek alone goes to the step where the person stopped.
 * - "Naprej" saves the step's fields and moves progress forward (api.setOnboardingStep);
 *   "Preskoči" moves forward WITHOUT saving; "Nazaj" never loses anything, because the drafts
 *   of all steps live here and not in the step.
 * - Progress only moves forward, and never leaves 'done'.
 * - Finishing switches the agent on when it has an included source (the api does it); the
 *   toast says which of the two happened, and step 5 said so before the button was pressed.
 */
import { useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { useWizardStep, type WizardStepNumber } from '@/components/layout';
import { Button, EmptyState, Skeleton, SkeletonText, useDraft, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { makeDrafts, messageOf, type Drafts, type StepNav } from './draft';
import { AgentStep } from './steps/AgentStep';
import { BookingStep } from './steps/BookingStep';
import { InstallStep } from './steps/InstallStep';
import { NotifyStep } from './steps/NotifyStep';
import { WebsiteStep } from './steps/WebsiteStep';

export default function Wizard() {
  const { step: param } = useParams();
  const { step } = useWizardStep();
  // /zacetek, /zacetek/0, /zacetek/abc … → the step where the person stopped.
  if (!/^[1-5]$/.test(param ?? '')) return <Navigate to={`/zacetek/${step}`} replace />;
  return <WizardData step={step} />;
}

/** Loads what the steps start from; the drafts are created once all of it has arrived. */
function WizardData({ step }: { step: WizardStepNumber }) {
  const account = api.useQuery(() => api.getAccount(), []);
  const agent = api.useQuery(() => api.getAgent(), []);
  const booking = api.useQuery(() => api.getBookingSettings(), []);
  const notify = api.useQuery(() => api.getNotificationSettings(), []);

  if (account.data && agent.data && booking.data && notify.data) {
    return (
      <WizardFlow
        step={step}
        account={account.data}
        agent={agent.data}
        booking={booking.data}
        notify={notify.data}
      />
    );
  }

  const queries = [account, agent, booking, notify];
  const error = queries.find((q) => q.error)?.error;
  if (error) {
    return (
      <EmptyState
        icon={CircleAlert}
        title={error}
        action={<Button onClick={() => queries.forEach((q) => q.reload())}>Poskusi znova</Button>}
      />
    );
  }
  return (
    <div role="status" aria-label="Nalaganje" className="flex min-w-0 flex-col gap-4">
      <Skeleton className="h-8 w-56" />
      <SkeletonText lines={2} />
      <Skeleton className="mt-4 h-40 w-full rounded-lg" />
    </div>
  );
}

function WizardFlow({
  step,
  account,
  agent,
  booking,
  notify,
}: {
  step: WizardStepNumber;
  account: api.Account;
  agent: api.Agent;
  booking: api.BookingSettings;
  notify: api.NotificationSettings;
}) {
  const flow = useWizardStep();
  const session = api.useSession();
  const toast = useToast();
  // What the steps start from is read once; the person's edits lie on top of it (useDraft).
  const [initial] = useState<Drafts>(() => makeDrafts({ account, agent, booking, notify }, session.onboardingStep));
  const draft = useDraft<Drafts>(initial);
  const drafts = draft.value ?? initial;
  // Two changes in one event must not overwrite each other, so the latest drafts are kept here too.
  const latest = useRef(drafts);
  latest.current = drafts;
  const reached = useRef(session.onboardingStep);
  reached.current = session.onboardingStep;

  function patch<K extends keyof Drafts>(key: K) {
    return (change: Partial<Drafts[K]>) => {
      const next = { ...latest.current[key], ...change };
      latest.current = { ...latest.current, [key]: next };
      draft.patch({ [key]: next } as Partial<Drafts>);
    };
  }

  /** Remember how far the person got, then show the next step. */
  async function proceed(from: 1 | 2 | 3 | 4) {
    const next = (from + 1) as WizardStepNumber;
    const now = reached.current;
    if (now !== 'done' && next > now) {
      try {
        await api.setOnboardingStep(next);
      } catch (e) {
        toast.error(messageOf(e));
      }
    }
    flow.goTo(next);
  }

  /** The step has already saved 'done'; say what that did to the agent, then leave. */
  async function finish() {
    let message = 'Nastavitev je končana.';
    try {
      const now = await api.getAgent();
      if (now.status === 'active') message += ' Predogled: agent je označen kot aktiven.';
      else if (now.status === 'draft') message += ' Agent ostaja osnutek, ker nima nobenega vključenega vira znanja.';
    } catch {
      // the toast is only a confirmation; Pregled shows the real state
    }
    toast.success(message);
    flow.exit();
  }

  const nav = (from: 1 | 2 | 3 | 4): StepNav => ({
    onBack: from > 1 ? () => flow.goTo((from - 1) as WizardStepNumber) : undefined,
    onSkip: () => void proceed(from),
    onDone: () => proceed(from),
  });

  switch (step) {
    case 1:
      return <WebsiteStep {...nav(1)} draft={drafts.website} onChange={patch('website')} account={account} />;
    case 2:
      return <AgentStep {...nav(2)} draft={drafts.agent} onChange={patch('agent')} />;
    case 3:
      return <BookingStep {...nav(3)} draft={drafts.booking} onChange={patch('booking')} />;
    case 4:
      return <NotifyStep {...nav(4)} draft={drafts.notify} onChange={patch('notify')} />;
    case 5:
      return (
        // No "Preskoči" here: leaving without finishing is "Nadaljuj pozneje" in the shell.
        <InstallStep agent={agent} onBack={() => flow.goTo(4)} onDone={finish} />
      );
  }
}

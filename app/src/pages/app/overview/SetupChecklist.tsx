import { Button, ButtonLink, Card, CardHeader, SkeletonRows, StepList, useToast, type Step } from '@/components/ui';
import * as api from '@/data/api';
import { plural } from '@/data/format';
import { AGENT_STATUS, AGENT_STATUS_HELP, WIZARD_STEPS } from '@/data/labels';

/**
 * "Kaj še manjka": the ONE place on Pregled that says what is missing before the agent can
 * answer visitors. It reads the same facts as the status pill (the agent and
 * api.getAgentReadiness), so the list and the status cannot contradict each other:
 *   1. the first setup (wizard)         2. a knowledge source          3. switching the agent on
 * It stays while the setup is open, a source is missing or the agent is still a draft, and
 * disappears by itself when none of that is true. The shell strip is hidden on this page, so
 * the message is said here once.
 */
export function SetupChecklist() {
  const toast = useToast();
  const session = api.useSession();
  const agent = api.useQuery(() => api.getAgent(), []);
  const readiness = api.useQuery(() => api.getAgentReadiness(), []);
  // The result of switching on is visible at once (the list and the pill change): toast only.
  const activate = api.useAction(api.activateAgent, { onError: toast.error });

  const setupDone = session.onboardingStep === 'done';
  const a = agent.data;
  const r = readiness.data;

  if (!a || !r) {
    // A finished account sees nothing here, so do not flash a card for it while loading.
    if (setupDone) return null;
    return (
      <Card>
        <CardHeader title="Kaj še manjka" divider />
        <SkeletonRows rows={3} />
      </Card>
    );
  }

  const sourcesMissing = r.missing.find((m) => m.key === 'sources');
  if (setupDone && !sourcesMissing && a.status !== 'draft') return null;

  const stepNumber = session.onboardingStep === 'done' ? 1 : session.onboardingStep;
  const stepLabel = WIZARD_STEPS.find((s) => s.step === stepNumber)?.label ?? '';
  const missingPill = { tone: 'warning', label: 'Manjka' } as const;

  const setup: Step = setupDone
    ? { id: 'setup', title: 'Začetna nastavitev', detail: 'Končana.', state: 'done' }
    : {
        id: 'setup',
        title: 'Začetna nastavitev',
        detail: `Čarovnik je pri koraku ${stepNumber} od ${WIZARD_STEPS.length}: ${stepLabel}.`,
        state: 'current',
        pill: missingPill,
        action: (
          <ButtonLink to={`/zacetek/${stepNumber}`} size="sm">
            Nadaljuj pri koraku {stepNumber}
          </ButtonLink>
        ),
      };

  const sources: Step = sourcesMissing
    ? {
        id: 'sources',
        title: sourcesMissing.title,
        detail: sourcesMissing.text,
        state: 'current',
        pill: missingPill,
        action: (
          <ButtonLink to={sourcesMissing.action.to} size="sm">
            {sourcesMissing.action.label}
          </ButtonLink>
        ),
      }
    : { id: 'sources', title: 'Viri znanja', detail: 'Agent ima vsaj en vključen vir znanja.', state: 'done' };

  let agentRow: Step;
  if (a.status === 'draft') {
    if (!r.canActivate) {
      agentRow = {
        id: 'agent',
        title: 'Vklop agenta',
        detail: 'Agenta boste lahko vklopili, ko bo vključen vsaj en vir znanja.',
        state: 'waiting',
      };
    } else if (!setupDone) {
      agentRow = {
        id: 'agent',
        title: 'Vklop agenta',
        detail: 'Agent se vklopi, ko končate začetno nastavitev.',
        state: 'waiting',
      };
    } else {
      agentRow = {
        id: 'agent',
        title: 'Vklop agenta',
        // What the status means is said once, next to the widget; here only that nothing else is missing.
        detail: 'Vsi pogoji za vklop so izpolnjeni.',
        state: 'current',
        pill: missingPill,
        action: (
          <Button
            size="sm"
            loading={activate.pending}
            onClick={async () => {
              const result = await activate.run();
              if (result) toast.success(result.message);
            }}
          >
            Vklopi agenta
          </Button>
        ),
      };
    }
  } else {
    // Switched on (or stopped for a reason that is explained on the pill): nothing to do here.
    const status = AGENT_STATUS[a.status];
    agentRow = {
      id: 'agent',
      title: 'Vklop agenta',
      detail: AGENT_STATUS_HELP[a.status],
      state: a.status === 'active' ? 'done' : 'current',
      pill: { tone: status.tone, label: status.label },
    };
  }

  const steps = [setup, sources, agentRow];
  const missing = steps.filter((s) => s.state !== 'done').length;

  return (
    <Card>
      <CardHeader
        title="Kaj še manjka"
        description={`Še ${plural(missing, ['korak', 'koraka', 'koraki', 'korakov'])} do agenta, ki lahko odgovarja obiskovalcem.`}
        divider
      />
      <StepList steps={steps} />
    </Card>
  );
}

/**
 * Pregled: the first screen after the setup. Numbers on top; status of each part of the
 * agent on the left, each card with one way to the screen where it is changed; the live
 * test widget with the agent's status on the right.
 *
 * What is said ONCE here: "Kaj še manjka" (setup, sources, switching the agent on) says what
 * is missing; the panel next to the widget says what the agent's status means. The shell
 * strip is hidden on this page for that reason, and no card repeats either message.
 * Saving the instructions uses the page's single SaveBar (last element, with the leave guard).
 */
import { useMemo } from 'react';
import { ButtonLink, PageHeader, SaveBar, useDraft, useToast } from '@/components/ui';
import { TopBarActions } from '@/components/layout';
import * as api from '@/data/api';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { AgentPanel } from './overview/AgentPanel';
import { BookingCard } from './overview/BookingCard';
import { InstructionsCard, type InstructionsDraft } from './overview/InstructionsCard';
import { KnowledgeCard } from './overview/KnowledgeCard';
import { NotificationsCard } from './overview/NotificationsCard';
import { RecentCard } from './overview/RecentCard';
import { SetupChecklist } from './overview/SetupChecklist';
import { StatsRow } from './overview/StatsRow';

export default function Overview() {
  const toast = useToast();
  const agent = api.useQuery(() => api.getAgent(), []);
  const save = api.useAction(api.updateAgent);
  const instructions = agent.data?.instructions;
  const source = useMemo<InstructionsDraft | undefined>(
    () => (instructions === undefined ? undefined : { instructions }),
    [instructions],
  );
  const draft = useDraft<InstructionsDraft>(source);

  // The deploy action stays in the top bar where there is room; on a phone it sits under the title.
  const roomInTopBar = useMediaQuery('(min-width: 640px)');
  const deploy = (
    <ButtonLink to="/app/namestitev" variant="primary" size="sm">
      Namesti na spletno stran
    </ButtonLink>
  );

  async function saveInstructions() {
    const saved = await save.run(draft.changes);
    if (!saved) return;
    draft.commit({ instructions: saved.instructions });
    toast.success('Navodila so shranjena.');
  }

  return (
    <>
      {roomInTopBar ? <TopBarActions>{deploy}</TopBarActions> : null}

      <PageHeader
        title="Pregled"
        description="Stanje vašega agenta in številke tega obračunskega obdobja."
        actions={roomInTopBar ? undefined : deploy}
      />

      <div className="flex min-w-0 flex-col gap-6">
        <StatsRow />
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <SetupChecklist />
            <KnowledgeCard />
            <BookingCard />
            <NotificationsCard />
            <InstructionsCard agent={agent} draft={draft} />
            <RecentCard />
          </div>
          <AgentPanel />
        </div>
      </div>

      <SaveBar
        dirty={draft.dirty}
        saving={save.pending}
        error={save.error}
        onDiscard={draft.discard}
        onSave={saveInstructions}
      />
    </>
  );
}

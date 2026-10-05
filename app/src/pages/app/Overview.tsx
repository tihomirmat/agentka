/**
 * Pregled: the first screen after the setup. Numbers on top; status of each part of the
 * agent on the left, each card with one way to the screen where it is changed; the live
 * test widget on the right.
 */
import { ButtonLink, PageHeader } from '@/components/ui';
import { TopBarActions } from '@/components/layout';
import { AgentPanel } from './overview/AgentPanel';
import { BookingCard } from './overview/BookingCard';
import { InstructionsCard } from './overview/InstructionsCard';
import { KnowledgeCard } from './overview/KnowledgeCard';
import { NotificationsCard } from './overview/NotificationsCard';
import { RecentCard } from './overview/RecentCard';
import { SetupChecklist } from './overview/SetupChecklist';
import { StatsRow } from './overview/StatsRow';

export default function Overview() {
  return (
    <>
      <TopBarActions>
        <ButtonLink to="/app/namestitev" variant="primary" size="sm" aria-label="Namesti na spletno stran">
          <span className="sm:hidden" aria-hidden="true">
            Namesti
          </span>
          <span className="hidden sm:inline" aria-hidden="true">
            Namesti na spletno stran
          </span>
        </ButtonLink>
      </TopBarActions>

      <PageHeader title="Pregled" description="Stanje vašega agenta in številke tega obračunskega obdobja." />

      <div className="flex min-w-0 flex-col gap-6">
        <StatsRow />
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <SetupChecklist />
            <KnowledgeCard />
            <BookingCard />
            <NotificationsCard />
            <InstructionsCard />
            <RecentCard />
          </div>
          <AgentPanel />
        </div>
      </div>
    </>
  );
}

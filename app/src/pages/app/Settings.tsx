import { CircleAlert } from 'lucide-react';
import { Button, Card, CardBody, EmptyState, PageHeader, SkeletonText } from '@/components/ui';
import * as api from '@/data/api';
import { AgentCard } from './settings/AgentCard';
import { CompanyCard } from './settings/CompanyCard';
import { DeleteCard } from './settings/DeleteCard';
import { ResetCard } from './settings/ResetCard';
import { TeamCard } from './settings/TeamCard';

export default function Settings() {
  const account = api.useQuery(() => api.getAccount(), []);
  const agent = api.useQuery(() => api.getAgent(), []);
  const voices = api.useQuery(() => api.listVoices(), []);
  const team = api.useQuery(() => api.listTeam(), []);

  const header = (
    <PageHeader title="Nastavitve" description="Podatki o podjetju, agent, ekipa in uporabniški račun." />
  );

  if (account.loading || agent.loading || voices.loading) {
    return (
      <>
        {header}
        <div className="flex min-w-0 flex-col gap-6" aria-busy="true">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardBody>
                <SkeletonText lines={5} />
              </CardBody>
            </Card>
          ))}
        </div>
      </>
    );
  }

  const loadError = account.error ?? agent.error ?? voices.error;
  if (loadError || !account.data || !agent.data || !voices.data) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={loadError ?? 'Nastavitev ni bilo mogoče naložiti.'}
            action={
              <Button
                onClick={() => {
                  account.reload();
                  agent.reload();
                  voices.reload();
                }}
              >
                Poskusi znova
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="flex min-w-0 flex-col gap-6">
        <CompanyCard account={account.data} />
        <AgentCard agent={agent.data} accountStatus={account.data.status} voices={voices.data} />
        <TeamCard
          accountName={account.data.name}
          team={team.data}
          loading={team.loading}
          error={team.error}
          onRetry={team.reload}
        />
        <ResetCard />
        <DeleteCard accountName={account.data.name} />
      </div>
    </>
  );
}

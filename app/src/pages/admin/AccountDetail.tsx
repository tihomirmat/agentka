import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircleAlert, Pause, Play, SearchX } from 'lucide-react';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  ConfirmDialog,
  CopyValue,
  EmptyState,
  PageHeader,
  SkeletonText,
  StatusPill,
  useToast,
} from '@/components/ui';
import * as api from '@/data/api';
import { formatUrl, plural } from '@/data/format';
import { ACCOUNT_STATUS, AGENT_STATUS } from '@/data/labels';
import { ActivityCard, AgentCard, ErrorsCard, KnowledgeCard, SubscriptionCard } from './accounts/DetailCards';
import { ERROR_FORMS } from './accounts/helpers';

const BACK = { to: '/admin', label: 'Uporabniški računi' };

export default function AccountDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const toast = useToast();
  const query = api.useQuery(() => api.adminGetAccount(id), [id]);
  const setPaused = api.useAction(api.adminSetPaused, { onError: (m) => toast.error(m) });
  const [confirm, setConfirm] = useState<'pause' | 'resume' | null>(null);

  if (query.loading) {
    return (
      <>
        <PageHeader title="Uporabniški račun" back={BACK} />
        <div className="grid min-w-0 gap-6 lg:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardBody>
                <SkeletonText lines={4} />
              </CardBody>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (query.error) {
    return (
      <>
        <PageHeader title="Uporabniški račun" back={BACK} />
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={query.error}
            action={<Button onClick={query.reload}>Poskusi znova</Button>}
          />
        </Card>
      </>
    );
  }

  const detail = query.data;
  if (!detail) {
    return (
      <>
        <PageHeader title="Uporabniški račun" back={BACK} />
        <Card>
          <EmptyState
            icon={SearchX}
            title="Tega uporabniškega računa ni na seznamu."
            action={<ButtonLink to="/admin">Nazaj na uporabniške račune</ButtonLink>}
          />
        </Card>
      </>
    );
  }

  const { account, plan } = detail;
  const sub = ACCOUNT_STATUS[account.status];
  const agent = AGENT_STATUS[detail.agent_status];
  const paused = detail.agent_status === 'paused';
  const canPause = detail.agent_status === 'active' || detail.agent_status === 'error';
  const subscriptionHeld = account.status === 'past_due' || account.status === 'paused_limit';

  return (
    <>
      <PageHeader
        back={BACK}
        title={account.name}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
            <span>{formatUrl(account.website_url) || 'Brez spletne strani'}</span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              Lastnik:
              <CopyValue value={detail.owner_email} copyLabel="Kopiraj e-naslov lastnika" />
            </span>
          </span>
        }
        meta={
          <span className="flex flex-wrap items-center gap-2">
            {plan ? <Badge tone="accent">{plan.name}</Badge> : <Badge>Brez paketa</Badge>}
            <StatusPill tone={sub.tone}>{sub.label}</StatusPill>
            <StatusPill tone={agent.tone}>Agent: {agent.label.toLowerCase()}</StatusPill>
            {detail.error_count > 0 ? (
              <StatusPill tone="danger">{plural(detail.error_count, ERROR_FORMS)}</StatusPill>
            ) : null}
          </span>
        }
        actions={
          paused ? (
            <Button variant="primary" icon={Play} onClick={() => setConfirm('resume')}>
              Znova vklopi agenta
            </Button>
          ) : canPause ? (
            <Button icon={Pause} onClick={() => setConfirm('pause')}>
              Začasno ustavi agenta
            </Button>
          ) : undefined
        }
      />

      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <SubscriptionCard detail={detail} />
          <AgentCard detail={detail} />
          <KnowledgeCard detail={detail} />
          <ActivityCard detail={detail} />
        </div>
        <ErrorsCard detail={detail} />
        <p className="text-sm text-fg-subtle">
          Vsebine pogovorov in podatkov obiskovalcev tu ne prikazujemo, vidite samo številke. E-naslovi v opisih napak so skriti.
        </p>
      </div>

      {confirm ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirm(null);
          }}
          title={confirm === 'pause' ? `Začasno ustavim agenta stranke »${account.name}«?` : `Znova vklopim agenta stranke »${account.name}«?`}
          description={
            confirm === 'pause'
              ? 'Pripomoček na spletni strani stranke bo obiskovalcem sporočil, da agent trenutno ni na voljo. Agenta lahko znova vklopite, ko želite.'
              : `Pripomoček na spletni strani stranke bo spet odgovarjal obiskovalcem.${
                  subscriptionHeld ? ` Stanje naročnine ostane »${sub.label}«.` : ''
                }`
          }
          confirmLabel={confirm === 'pause' ? 'Začasno ustavi agenta' : 'Znova vklopi agenta'}
          onConfirm={async () => {
            const result = await setPaused.run(account.id, confirm === 'pause');
            if (!result) return;
            if (result.simulated) toast.info(result.message);
            else toast.success(result.message);
          }}
        />
      ) : null}
    </>
  );
}

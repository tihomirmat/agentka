import { CircleAlert } from 'lucide-react';
import * as api from '@/data/api';
import { formatRelativeDateTime } from '@/data/format';
import { Button, Card, CardBody, EmptyState, PageHeader, Skeleton, SkeletonText, useToast } from '@/components/ui';
import { AppearanceCard } from './install/AppearanceCard';
import { Checklist, type ChecklistStep, type StepState } from './install/Checklist';
import { CodeCard } from './install/CodeCard';
import { DomainCard } from './install/DomainCard';
import { domainError } from './install/helpers';
import { SaveBar } from './screen-kit/SaveBar';
import { useDraft } from './screen-kit/useDraft';

const TITLE = 'Namestitev';
const DESCRIPTION = 'Dodajte agenta na svojo spletno stran z eno vrstico kode.';

/** Namestitev: the embed code, where to put it, which domain may use it and how the widget looks. */
export default function Install() {
  const agent = api.useQuery(() => api.getAgent(), []);
  const status = api.useQuery(() => api.getInstallStatus(), []);
  const code = api.useQuery(() => api.getEmbedCode(), []);
  const toast = useToast();

  const draft = useDraft<api.Agent>(agent.data);
  const save = api.useAction(api.updateAgent);

  const value = draft.value;

  if (agent.error && !value && !agent.loading) {
    return (
      <>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={agent.error}
            action={<Button onClick={agent.reload}>Poskusi znova</Button>}
          />
        </Card>
      </>
    );
  }

  if (!value) {
    return (
      <>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <div className="flex flex-col gap-6" role="status" aria-label="Nalaganje">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardBody className="flex flex-col gap-3">
                <Skeleton className="h-5 w-48" />
                <SkeletonText lines={3} />
              </CardBody>
            </Card>
          ))}
        </div>
      </>
    );
  }

  const invalid = domainError(value.allowed_domain) !== undefined;

  function codeCopied() {
    // Ticking the checklist is a convenience: a failure here must not disturb the copy itself.
    void api.markCodeCopied().catch(() => undefined);
  }

  async function submit() {
    if (invalid) return;
    const saved = await save.run(draft.changes);
    if (saved) {
      draft.commit(saved);
      toast.success('Nastavitve namestitve so shranjene.');
    }
  }

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <div className="flex min-w-0 flex-col gap-6">
        <ChecklistCard status={status} />

        <CodeCard
          code={code.data?.code}
          error={code.error}
          onRetry={code.reload}
          onCopied={codeCopied}
          business={draft.server?.business_name ?? ''}
          agentName={draft.server?.name ?? ''}
          domain={draft.server?.allowed_domain ?? ''}
        />

        <DomainCard
          value={value.allowed_domain}
          saved={draft.server?.allowed_domain ?? ''}
          onChange={(domain) => draft.patch({ allowed_domain: domain })}
        />

        <AppearanceCard agent={value} onPatch={draft.patch} />
      </div>

      <SaveBar
        visible={draft.dirty}
        saving={save.pending}
        canSave={!invalid}
        blockedReason={invalid ? 'Popravite domeno, da lahko shranite.' : undefined}
        error={save.error}
        onSave={() => void submit()}
        onDiscard={draft.discard}
      />
    </>
  );
}

/** The checklist, built from api.getInstallStatus(). Only what the api can know is marked as done. */
function ChecklistCard({ status }: { status: api.QueryResult<api.InstallStatus> }) {
  const s = status.data;

  if (!s) {
    if (status.error) {
      return (
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={status.error}
            action={<Button onClick={status.reload}>Poskusi znova</Button>}
          />
        </Card>
      );
    }
    return (
      <Card>
        <CardBody className="flex flex-col gap-3" role="status" aria-label="Nalaganje">
          <Skeleton className="h-5 w-56" />
          <SkeletonText lines={3} />
        </CardBody>
      </Card>
    );
  }

  const heard = s.last_conversation_at !== null;
  const done = [s.code_copied || heard, s.domain_set, heard];
  const firstOpen = done.findIndex((d) => !d);
  const stateOf = (i: number): StepState => (done[i] ? 'done' : i === firstOpen ? 'current' : 'waiting');

  const steps: ChecklistStep[] = [
    {
      id: 'koda',
      title: 'Kopirajte kodo',
      state: stateOf(0),
      detail: s.code_copied
        ? 'Kodo ste kopirali.'
        : heard
          ? 'Pripomoček je že vgrajen.'
          : 'Kodo najdete spodaj, pod naslovom »Vgradite pripomoček«.',
    },
    {
      id: 'domena',
      title: 'Vpišite domeno svoje spletne strani',
      state: stateOf(1),
      detail: s.domain_set
        ? `Dovoljena domena: ${s.allowed_domain}`
        : 'Vpišite jo spodaj, pri »Dovoljena domena«, in shranite.',
    },
    {
      id: 'pogovor',
      title: 'Vstavite kodo in preizkusite',
      state: stateOf(2),
      detail:
        s.last_conversation_at !== null
          ? `Zadnji pogovor s te domene: ${formatRelativeDateTime(s.last_conversation_at)}`
          : 'S te domene še ni bilo nobenega pogovora. Vstavite kodo, odprite svojo stran in preizkusite agenta.',
    },
  ];

  return <Checklist steps={steps} />;
}

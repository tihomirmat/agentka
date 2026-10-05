import { useMemo } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button, Card, CardBody, EmptyState, PageHeader, SaveBar, SkeletonText, useDraft, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { AgentCard } from './settings/AgentCard';
import { CompanyCard } from './settings/CompanyCard';
import { DeleteCard } from './settings/DeleteCard';
import { parseWebsite, toForm, validate, type SettingsForm } from './settings/form';
import { TeamCard } from './settings/TeamCard';

export default function Settings() {
  const toast = useToast();
  const account = api.useQuery(() => api.getAccount(), []);
  const agent = api.useQuery(() => api.getAgent(), []);
  const voices = api.useQuery(() => api.listVoices(), []);
  const team = api.useQuery(() => api.listTeam(), []);
  const readiness = api.useQuery(() => api.getAgentReadiness(), []);
  const saveAccount = api.useAction(api.updateAccount);
  const saveAgent = api.useAction(api.updateAgent);

  // ONE draft for every editable field of the page, ONE save bar (with the leave guard).
  const source = useMemo<SettingsForm | undefined>(
    () => (account.data && agent.data ? toForm(account.data, agent.data) : undefined),
    [account.data, agent.data],
  );
  const draft = useDraft<SettingsForm>(source);

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
  if (loadError || !account.data || !agent.data || !voices.data || !draft.value) {
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

  const form = draft.value;
  const errors = validate(form);
  const invalid = Boolean(errors.name || errors.website || errors.agent_name);

  async function save() {
    if (!account.data || !agent.data || invalid) return;
    const ch = draft.changes;
    // Only what changed goes to the api; the language belongs to the account and to the agent.
    const accountPatch: api.AccountPatch = {};
    if (ch.name !== undefined) accountPatch.name = ch.name.trim();
    if (ch.website !== undefined) accountPatch.website_url = parseWebsite(ch.website).value;
    if (ch.timezone !== undefined) accountPatch.timezone = ch.timezone;
    if (ch.language !== undefined) accountPatch.language = ch.language;
    const agentPatch: api.AgentPatch = {};
    if (ch.agent_name !== undefined) agentPatch.name = ch.agent_name.trim();
    if (ch.voice_id !== undefined) agentPatch.voice_id = ch.voice_id;
    if (ch.first_message !== undefined) agentPatch.first_message = ch.first_message;
    if (ch.language !== undefined) agentPatch.language = ch.language;

    let savedAccount = account.data;
    let savedAgent = agent.data;
    if (Object.keys(accountPatch).length > 0) {
      const result = await saveAccount.run(accountPatch);
      if (!result) return;
      savedAccount = result;
    }
    if (Object.keys(agentPatch).length > 0) {
      const result = await saveAgent.run(agentPatch);
      if (!result) return;
      savedAgent = result;
    }
    draft.commit(toForm(savedAccount, savedAgent));
    toast.success('Nastavitve so shranjene.');
  }

  return (
    <>
      {header}
      <div className="flex min-w-0 flex-col gap-6">
        <CompanyCard form={form} errors={errors} savedTimezone={account.data.timezone} onChange={draft.patch} />
        <AgentCard
          agent={agent.data}
          form={form}
          errors={errors}
          voices={voices.data}
          readiness={readiness.data}
          onChange={draft.patch}
        />
        <TeamCard
          accountName={account.data.name}
          team={team.data}
          loading={team.loading}
          error={team.error}
          onRetry={team.reload}
        />
        <DeleteCard accountName={account.data.name} onBeforeDelete={draft.discard} />
      </div>
      <SaveBar
        dirty={draft.dirty}
        saving={saveAccount.pending || saveAgent.pending}
        canSave={!invalid}
        blockedReason="Najprej popravite polja, ki so označena."
        error={saveAccount.error ?? saveAgent.error}
        onDiscard={draft.discard}
        onSave={save}
      />
    </>
  );
}

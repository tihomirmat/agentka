import { useState, type ReactNode } from 'react';
import { Pause, Play, Power } from 'lucide-react';
import {
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  CopyValue,
  FactList,
  Field,
  Input,
  Notice,
  Select,
  StatusPill,
  Textarea,
  useToast,
} from '@/components/ui';
import * as api from '@/data/api';
import { AGENT_STATUS, AGENT_STATUS_HELP, LANGUAGES, pausedByHelp } from '@/data/labels';
import { mentionsAi, type FormErrors, type SettingsForm } from './form';

export interface AgentCardProps {
  /** what the server holds: the status rules work on this, not on the draft */
  agent: api.Agent;
  form: SettingsForm;
  errors: FormErrors;
  voices: api.Voice[];
  /** undefined while it loads */
  readiness: api.AgentReadiness | undefined;
  onChange: (changes: Partial<SettingsForm>) => void;
}

/**
 * The one place that switches the agent on and off. The rules are the shared ones
 * (api.getAgentReadiness / activateAgent / pauseAgent / resumeAgent, labels.ts): a draft is
 * switched on here when it can be, otherwise the person is sent to Viri znanja with the
 * reason; a pause that someone else holds (platform admin, used-up minutes, failed payment)
 * cannot be lifted from here, so the card says who holds it and what ends it. It offers no
 * button for those: the shell strip above the page already carries "Uredi plačilo" /
 * "Izberi večji paket", and a second copy of the same action would only repeat it.
 */
function AgentStatus({ agent, readiness }: { agent: api.Agent; readiness: api.AgentReadiness | undefined }) {
  const toast = useToast();
  const onError = (m: string) => toast.error(m);
  const pause = api.useAction(api.pauseAgent, { onError });
  const resume = api.useAction(api.resumeAgent, { onError });
  const activate = api.useAction(api.activateAgent, { onError });
  const [confirm, setConfirm] = useState<'pause' | 'resume' | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const status = AGENT_STATUS[agent.status];
  const heldBy = agent.status === 'paused' ? agent.paused_by : null;
  const missing = agent.status === 'draft' ? readiness?.missing[0] : undefined;

  /** The api's sentence is a simulated result: ONE notice next to the buttons, no toast. */
  function show(result: api.ActionResult | undefined) {
    if (!result) return;
    if (result.simulated) setNote(result.message);
    else toast.success(result.message);
  }

  let action: ReactNode = null;
  if (agent.status === 'active') {
    action = (
      <Button icon={Pause} onClick={() => setConfirm('pause')}>
        Začasno ustavi agenta
      </Button>
    );
  } else if (agent.status === 'paused' && heldBy === 'customer') {
    action = (
      <Button icon={Play} onClick={() => setConfirm('resume')}>
        Znova vklopi agenta
      </Button>
    );
  } else if (agent.status === 'draft' && readiness) {
    action = missing ? (
      <ButtonLink to={missing.action.to}>{missing.action.label}</ButtonLink>
    ) : (
      <Button
        icon={Power}
        loading={activate.pending}
        onClick={async () => {
          setNote(null);
          show(await activate.run());
        }}
      >
        Vklopi agenta
      </Button>
    );
  }

  return (
    <div className="min-w-0 border-y border-border bg-surface-2 px-4 py-3 sm:px-5">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          <p className="flex flex-wrap items-center gap-2 text-base font-medium text-fg">
            Stanje agenta
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </p>
          <p className="mt-0.5 text-sm text-fg-muted">{AGENT_STATUS_HELP[agent.status]}</p>
          {heldBy ? <p className="mt-1 text-sm text-fg">{pausedByHelp(heldBy, 'settings')}</p> : null}
          {missing ? <p className="mt-1 text-sm text-fg">{missing.text}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      {note ? (
        <Notice size="sm" tone="neutral" className="mt-3">
          {note}
        </Notice>
      ) : null}

      {confirm === 'pause' ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirm(null);
          }}
          title="Začasno ustavim agenta?"
          description="Pripomoček na vaši spletni strani bo obiskovalcem sporočil, da agent trenutno ni na voljo. Agenta lahko znova vklopite, ko želite."
          confirmLabel="Začasno ustavi agenta"
          onConfirm={async () => {
            setNote(null);
            show(await pause.run());
          }}
        />
      ) : null}
      {confirm === 'resume' ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirm(null);
          }}
          title="Znova vklopim agenta?"
          description="Pripomoček na vaši spletni strani bo spet odgovarjal obiskovalcem."
          confirmLabel="Znova vklopi agenta"
          onConfirm={async () => {
            setNote(null);
            show(await resume.run());
          }}
        />
      ) : null}
    </div>
  );
}

/** Agent: status (its own buttons) and the editable fields (part of the page's one draft). */
export function AgentCard({ agent, form, errors, voices, readiness, onChange }: AgentCardProps) {
  const voiceOptions = voices.map((v) => ({ value: v.id, label: v.name, description: v.description || undefined }));
  if (!voices.some((v) => v.id === agent.voice_id)) {
    voiceOptions.push({ value: agent.voice_id, label: agent.voice_id, description: undefined });
  }

  /**
   * While the greeting is still the one made from the name and the voice, it follows them
   * ("AI pomočnik" / "AI pomočnica"); once the person has written their own, it is left alone.
   */
  function change(changes: Partial<SettingsForm>) {
    if ('agent_name' in changes || 'voice_id' in changes) {
      const untouched = form.first_message === api.defaultFirstMessage(form.agent_name, agent.business_name, form.voice_id);
      if (untouched) {
        const next = { ...form, ...changes };
        changes = { ...changes, first_message: api.defaultFirstMessage(next.agent_name, agent.business_name, next.voice_id) };
      }
    }
    onChange(changes);
  }

  const greetingMissing = form.first_message.trim().length > 0 && !mentionsAi(form.first_message);

  return (
    <Card>
      <CardHeader title="Agent" description="Kako se agent predstavi in ali trenutno odgovarja obiskovalcem." className="pb-4" />
      <AgentStatus agent={agent} readiness={readiness} />
      <CardBody className="flex flex-col gap-5 pt-4 sm:pt-5">
        <div className="grid min-w-0 gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Ime agenta" required error={errors.agent_name} hint="S tem imenom se agent predstavi obiskovalcem.">
            <Input value={form.agent_name} onChange={(e) => change({ agent_name: e.target.value })} />
          </Field>
          <Field label="Glas" hint="Glas, s katerim agent govori.">
            <Select value={form.voice_id} options={voiceOptions} onValueChange={(voice_id) => change({ voice_id })} />
          </Field>
          <Field label="Jezik agenta" hint="V tem jeziku agent govori z obiskovalci.">
            <Select
              value={form.language}
              options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
              onValueChange={(language) => change({ language })}
            />
          </Field>
          <Field
            className="md:col-span-2 lg:col-span-3"
            label="Pozdrav"
            hint="Prvi stavek, ki ga agent izreče, ko obiskovalec odpre pripomoček."
            warning={
              greetingMissing
                ? 'V pozdravu ni navedeno, da je agent umetna inteligenca. Priporočamo, da obiskovalca že v prvem stavku obvestite, da se pogovarja z umetno inteligenco.'
                : undefined
            }
          >
            <Textarea rows={3} value={form.first_message} onChange={(e) => change({ first_message: e.target.value })} />
          </Field>
        </div>

        <div className="border-t border-border pt-5">
          <FactList
            columns={1}
            items={[
              {
                label: 'ID agenta',
                value: (
                  <div className="flex min-w-0 flex-col gap-1">
                    <CopyValue value={agent.id} mono copyLabel="Kopiraj ID agenta" className="w-fit" />
                    <span className="text-sm text-fg-subtle">Oznaka vašega agenta. Najdete jo tudi v kodi za vgradnjo.</span>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </CardBody>
    </Card>
  );
}

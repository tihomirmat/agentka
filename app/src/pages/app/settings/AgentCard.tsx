import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, TriangleAlert } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  CopyValue,
  Field,
  Input,
  Select,
  StatusPill,
  Textarea,
  useToast,
} from '@/components/ui';
import * as api from '@/data/api';
import { AGENT_STATUS } from '@/data/labels';
import { SaveFooter } from './SaveFooter';
import { useDraft } from './useDraft';

/** The greeting should say that the agent is an AI assistant (rule 8 of the spec). */
function mentionsAi(text: string): boolean {
  return /(\bAI\b|umetn|virtualn|digitaln)/i.test(text);
}

export interface AgentCardProps {
  agent: api.Agent;
  accountStatus: api.Account['status'];
  voices: { id: string; name: string; description: string }[];
}

export function AgentCard({ agent, accountStatus, voices }: AgentCardProps) {
  const toast = useToast();
  const save = api.useAction(api.updateAgent);
  const setStatus = api.useAction(api.updateAgent, { onError: (m) => toast.error(m) });
  const [attempted, setAttempted] = useState(false);
  const [confirm, setConfirm] = useState<'pause' | 'resume' | null>(null);

  const form = useDraft({ name: agent.name, voice_id: agent.voice_id, first_message: agent.first_message });
  const draft = form.value;

  const nameError = draft.name.trim() ? undefined : 'Vpišite ime agenta.';
  const greetingMissing = draft.first_message.trim().length > 0 && !mentionsAi(draft.first_message);

  const voiceOptions = voices.map((v) => ({ value: v.id, label: v.name, description: v.description }));
  if (!voices.some((v) => v.id === agent.voice_id)) {
    voiceOptions.push({ value: agent.voice_id, label: agent.voice_id, description: '' });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (nameError) return;
    const saved = await save.run({
      name: draft.name.trim(),
      voice_id: draft.voice_id,
      first_message: draft.first_message,
    });
    if (!saved) return;
    setAttempted(false);
    toast.success('Nastavitve agenta so shranjene.');
  }

  const status = AGENT_STATUS[agent.status];
  const heldByPlatform = accountStatus === 'past_due' || accountStatus === 'paused_limit';

  return (
    <Card>
      <CardHeader title="Agent" description="Kako se agent predstavi in ali trenutno odgovarja obiskovalcem." className="pb-4" />
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-y border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1 basis-64">
          <p className="flex flex-wrap items-center gap-2 text-base font-medium text-fg">
            Stanje agenta
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </p>
          <p className="mt-0.5 text-sm text-fg-muted">
            {agent.status === 'active'
              ? 'Agent odgovarja obiskovalcem na vaši spletni strani.'
              : agent.status === 'paused'
                ? heldByPlatform
                  ? 'Agent je ustavljen zaradi stanja naročnine. Uredite ga v Naročnini.'
                  : 'Pripomoček obiskovalcem sporoča, da agent trenutno ni na voljo.'
                : agent.status === 'draft'
                  ? 'Agent je še v osnutku.'
                  : 'Agent zaradi napake trenutno ne deluje.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {agent.status === 'active' ? (
            <Button icon={Pause} onClick={() => setConfirm('pause')}>
              Začasno ustavi agenta
            </Button>
          ) : null}
          {agent.status === 'paused' && !heldByPlatform ? (
            <Button icon={Play} onClick={() => setConfirm('resume')}>
              Znova vklopi agenta
            </Button>
          ) : null}
          {agent.status === 'paused' && heldByPlatform ? (
            <Link
              to="/app/narocnina"
              className="inline-flex h-10 items-center rounded px-2 text-base font-medium text-accent hover:text-accent-hover hover:underline"
            >
              Odpri Naročnino
            </Link>
          ) : null}
          {agent.status === 'draft' ? (
            <Link
              to="/zacetek"
              className="inline-flex h-10 items-center rounded px-2 text-base font-medium text-accent hover:text-accent-hover hover:underline"
            >
              Nadaljuj z nastavitvijo
            </Link>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <CardBody className="flex flex-col gap-5">
          <div className="grid min-w-0 gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Ime agenta" required error={attempted ? nameError : undefined} hint="S tem imenom se agent predstavi obiskovalcem.">
              <Input value={draft.name} onChange={(e) => form.patch({ name: e.target.value })} />
            </Field>
            <Field label="Glas" hint="Glas, s katerim agent govori.">
              <Select
                value={draft.voice_id}
                options={voiceOptions}
                onValueChange={(voice_id) => form.patch({ voice_id })}
              />
            </Field>
            <div className="min-w-0 md:col-span-2">
              <Field label="Pozdrav" hint="Prvi stavek, ki ga agent izreče, ko obiskovalec odpre pripomoček.">
                <Textarea
                  rows={3}
                  value={draft.first_message}
                  onChange={(e) => form.patch({ first_message: e.target.value })}
                />
              </Field>
              {greetingMissing ? (
                <p className="mt-2 flex items-start gap-2 text-sm text-warning" role="status">
                  <TriangleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                  <span>
                    V pozdravu ni navedeno, da je agent umetna inteligenca. Priporočamo, da obiskovalca že v prvem
                    stavku obvestite, da se pogovarja z umetno inteligenco.
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1 border-t border-border pt-5">
            <span className="text-sm font-medium text-fg">ID agenta</span>
            <CopyValue value={agent.id} mono copyLabel="Kopiraj ID agenta" className="w-fit" />
            <span className="text-sm text-fg-subtle">Oznaka vašega agenta. Najdete jo tudi v kodi za vgradnjo.</span>
          </div>
        </CardBody>
        <SaveFooter dirty={form.dirty} pending={save.pending} error={save.error} onReset={() => { form.reset(); setAttempted(false); }} />
      </form>

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
            if (await setStatus.run({ status: 'paused' })) toast.success('Agent je začasno ustavljen.');
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
            if (await setStatus.run({ status: 'active' })) toast.success('Agent je znova vklopljen.');
          }}
        />
      ) : null}
    </Card>
  );
}


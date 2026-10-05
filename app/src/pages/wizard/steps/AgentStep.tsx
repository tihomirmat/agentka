import { useState } from 'react';
import { WizardStep } from '@/components/layout';
import { Button, ChoiceCard, Field, Input, Notice, Select, SkeletonRows, Textarea, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { LANGUAGES } from '@/data/labels';
import { greetingFor, hasAiDisclosure, messageOf, type AgentDraft, type StepNav } from '../draft';

interface Props extends StepNav {
  draft: AgentDraft;
  onChange: (patch: Partial<AgentDraft>) => void;
}

export function AgentStep({ draft, onChange, onBack, onSkip, onDone }: Props) {
  const toast = useToast();
  const voices = api.useQuery(() => api.listVoices(), []);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const problems = {
    business: draft.businessName.trim() ? null : 'Vpišite ime podjetja.',
    agent: draft.agentName.trim() ? null : 'Vpišite ime agenta.',
    greeting: draft.greeting.trim() ? null : 'Vpišite pozdrav, s katerim se agent predstavi.',
  };
  const disclosureMissing = draft.greeting.trim() !== '' && !hasAiDisclosure(draft.greeting);

  /**
   * A greeting that still is the generated one follows the names and the voice (a female
   * voice says "pomočnica"); one the person wrote does not.
   */
  function change(patch: Partial<Pick<AgentDraft, 'agentName' | 'businessName' | 'voiceId'>>) {
    const before = greetingFor(draft.agentName, draft.businessName, draft.voiceId);
    const after = greetingFor(
      patch.agentName ?? draft.agentName,
      patch.businessName ?? draft.businessName,
      patch.voiceId ?? draft.voiceId,
    );
    onChange(draft.greeting === before ? { ...patch, greeting: after } : patch);
  }

  async function next() {
    setSubmitted(true);
    if (problems.business || problems.agent || problems.greeting) return;
    setBusy(true);
    try {
      await api.updateAccount({ name: draft.businessName.trim(), language: draft.language });
      await api.updateAgent({
        name: draft.agentName.trim(),
        first_message: draft.greeting.trim(),
        voice_id: draft.voiceId,
        language: draft.language,
      });
      await onDone();
    } catch (e) {
      toast.error(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WizardStep
      title="Vaš agent"
      description="Obiskovalci bodo pogovor začeli z agentom, zato mu določite ime, pozdrav in glas."
      back={
        <Button variant="ghost" onClick={onBack}>
          Nazaj
        </Button>
      }
      skip={
        <Button variant="ghost" onClick={onSkip}>
          Preskoči
        </Button>
      }
      next={
        <Button variant="primary" loading={busy} onClick={next}>
          Naprej
        </Button>
      }
    >
      <div className="flex min-w-0 flex-col gap-5">
        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <Field
            label="Ime podjetja"
            hint="Agent se predstavi kot pomočnik tega podjetja."
            error={submitted ? problems.business : null}
          >
            <Input
              autoComplete="organization"
              value={draft.businessName}
              onChange={(e) => change({ businessName: e.target.value })}
            />
          </Field>
          <Field label="Ime agenta" hint="S tem imenom se agent predstavi obiskovalcem." error={submitted ? problems.agent : null}>
            <Input value={draft.agentName} onChange={(e) => change({ agentName: e.target.value })} />
          </Field>
        </div>

        <Field
          label="Pozdrav"
          hint={`Prvi stavek, ki ga agent pove ali napiše. Naj pove, da je ${api.assistantNoun(draft.voiceId)}.`}
          warning={
            disclosureMissing
              ? `V pozdravu ni navedeno, da je agent ${api.assistantNoun(draft.voiceId)}. Obiskovalec mora takoj izvedeti, da se ne pogovarja s človekom. Dodajte na primer »${api.assistantNoun(draft.voiceId)}«.`
              : undefined
          }
          error={submitted ? problems.greeting : null}
        >
          <Textarea rows={3} value={draft.greeting} onChange={(e) => onChange({ greeting: e.target.value })} />
        </Field>

        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-sm font-medium text-fg">Glas agenta</legend>
          {voices.data ? (
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {voices.data.map((v) => (
                <ChoiceCard
                  key={v.id}
                  name="wizard-voice"
                  value={v.id}
                  checked={draft.voiceId === v.id}
                  onSelect={() => change({ voiceId: v.id })}
                  title={v.name}
                  description={v.description || undefined}
                  className="py-3"
                />
              ))}
            </div>
          ) : voices.error ? (
            <Notice
              tone="danger"
              title={voices.error}
              action={
                <Button size="sm" onClick={voices.reload}>
                  Poskusi znova
                </Button>
              }
            />
          ) : (
            <div className="rounded-lg border border-border bg-surface">
              <SkeletonRows rows={2} />
            </div>
          )}
          <p className="mt-1.5 text-sm text-fg-subtle">Glas boste lahko poslušali v polni različici.</p>
        </fieldset>

        <Field
          className="sm:max-w-xs"
          label="Jezik"
          hint="Agent odgovarja v tem jeziku. Pozdrav napišite v istem jeziku."
        >
          <Select
            value={draft.language}
            onValueChange={(language) => onChange({ language })}
            options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
          />
        </Field>
      </div>
    </WizardStep>
  );
}

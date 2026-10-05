import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { WizardStep } from '@/components/layout';
import { Button, Field, Input, Select, SkeletonRows, Textarea } from '@/components/ui';
import * as api from '@/data/api';
import { LANGUAGES } from '@/data/labels';
import { buildGreeting, hasAiDisclosure, messageOf, type AgentDraft, type StepNav } from '../draft';
import { Callout, ChoiceOption } from '../parts';

interface Props extends StepNav {
  draft: AgentDraft;
  onChange: (patch: Partial<AgentDraft>) => void;
}

export function AgentStep({ draft, onChange, onBack, onSkip, onDone }: Props) {
  const voices = api.useQuery(() => api.listVoices(), []);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const problems = {
    business: draft.businessName.trim() ? null : 'Vpišite ime podjetja.',
    agent: draft.agentName.trim() ? null : 'Vpišite ime agenta.',
    greeting: draft.greeting.trim() ? null : 'Vpišite pozdrav, s katerim se agent predstavi.',
  };
  const disclosureMissing = draft.greeting.trim() !== '' && !hasAiDisclosure(draft.greeting);

  /** A greeting that still is the generated one follows the names; one the person wrote does not. */
  function rename(patch: Partial<Pick<AgentDraft, 'agentName' | 'businessName'>>) {
    const before = buildGreeting(draft.agentName, draft.businessName);
    const after = buildGreeting(patch.agentName ?? draft.agentName, patch.businessName ?? draft.businessName);
    onChange(draft.greeting === before ? { ...patch, greeting: after } : patch);
  }

  async function next() {
    setSubmitted(true);
    setSaveError(null);
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
      setSaveError(messageOf(e));
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
              onChange={(e) => rename({ businessName: e.target.value })}
            />
          </Field>
          <Field label="Ime agenta" hint="S tem imenom se agent predstavi obiskovalcem." error={submitted ? problems.agent : null}>
            <Input value={draft.agentName} onChange={(e) => rename({ agentName: e.target.value })} />
          </Field>
        </div>

        <Field
          label="Pozdrav"
          hint={
            disclosureMissing ? (
              <span role="alert" className="flex items-start gap-1.5 text-warning">
                <TriangleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                <span>
                  V pozdravu ni navedeno, da je agent AI pomočnik. Obiskovalec mora takoj izvedeti, da se ne
                  pogovarja s človekom. Dodajte na primer »AI pomočnik«.
                </span>
              </span>
            ) : (
              'Prvi stavek, ki ga agent pove ali napiše. Naj pove, da je AI pomočnik.'
            )
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
                <ChoiceOption
                  key={v.id}
                  name="wizard-voice"
                  value={v.id}
                  checked={draft.voiceId === v.id}
                  onSelect={() => onChange({ voiceId: v.id })}
                  title={v.name}
                  description={v.description}
                  className="py-3"
                />
              ))}
            </div>
          ) : voices.error ? (
            <Callout tone="danger" title={voices.error}>
              <Button size="sm" onClick={voices.reload}>
                Poskusi znova
              </Button>
            </Callout>
          ) : (
            <div className="rounded-lg border border-border bg-surface">
              <SkeletonRows rows={2} />
            </div>
          )}
          <p className="mt-1.5 text-sm text-fg-subtle">Predposlušanje bo na voljo, ko bo agent povezan.</p>
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

        {saveError ? <Callout tone="danger" title="Shranjevanje ni uspelo.">{saveError}</Callout> : null}
      </div>
    </WizardStep>
  );
}

import { useState } from 'react';
import { WizardStep } from '@/components/layout';
import { AgentWidget } from '@/components/widget';
import { Button, CodeBlock, CopyButton, SkeletonText } from '@/components/ui';
import * as api from '@/data/api';
import { messageOf, type StepNav } from '../draft';
import { Callout } from '../parts';

interface Props extends StepNav {
  agent: api.Agent;
}

export function InstallStep({ agent, onBack, onSkip, onDone }: Props) {
  const embed = api.useQuery(() => api.getEmbedCode(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setError(null);
    setBusy(true);
    try {
      await api.setOnboardingStep('done');
      await onDone();
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  const code = embed.data?.code ?? '';
  const messageForDeveloper = `Pozdravljeni,\n\nprosim, vstavite to kodo na vse strani naše spletne strani, tik pred zaključno oznako </body>:\n\n${code}\n\nHvala.`;

  return (
    <WizardStep
      title="Preizkus in namestitev"
      description="Preizkusite agenta, nato kodo vstavite na svojo spletno stran. Šele takrat ga bodo videli vaši obiskovalci."
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
        <Button variant="primary" loading={busy} onClick={finish}>
          Končaj nastavitev
        </Button>
      }
    >
      <div className="grid min-w-0 gap-8 md:grid-cols-2">
        <section aria-labelledby="wizard-test-title" className="min-w-0">
          <h2 id="wizard-test-title" className="text-md font-semibold text-fg">
            Preizkusite agenta
          </h2>
          <p className="mb-3 mt-1 text-sm text-fg-muted">
            Vprašajte ga tako, kot bi ga vprašal obiskovalec vaše spletne strani.
          </p>
          <AgentWidget
            agentName={agent.name}
            businessName={agent.business_name}
            firstMessage={agent.first_message}
            textInput={agent.widget_text_input}
            accentHex={agent.widget_accent_color}
          />
        </section>

        <section aria-labelledby="wizard-code-title" className="min-w-0">
          <h2 id="wizard-code-title" className="text-md font-semibold text-fg">
            Vstavite kodo
          </h2>
          <p className="mb-3 mt-1 text-sm text-fg-muted">
            Koda je ena vrstica. Vstavite jo na konec strani, tik pred zaključno oznako{' '}
            <code className="font-mono text-xs text-fg">&lt;/body&gt;</code>.
          </p>
          {embed.data ? (
            <CodeBlock label="Koda za vgradnjo" code={code} onCopied={() => void api.markCodeCopied()} />
          ) : embed.error ? (
            <Callout tone="danger" title={embed.error}>
              <Button size="sm" onClick={embed.reload}>
                Poskusi znova
              </Button>
            </Callout>
          ) : (
            <SkeletonText lines={3} />
          )}

          <ul className="mt-5 flex min-w-0 flex-col gap-4 text-sm text-fg-muted">
            <li>
              <span className="block text-base font-medium text-fg">WordPress</span>
              Kodo prilepite v nogo strani (footer), na primer z vstavkom za dodajanje kode v glavo in nogo strani.
            </li>
            <li>
              <span className="block text-base font-medium text-fg">Wix, Squarespace in drugi graditelji strani</span>
              V nastavitvah strani poiščite možnost za lastno kodo (po angleško »custom code« ali »code injection«) in
              jo dodajte na konec vseh strani.
            </li>
            <li>
              <span className="block text-base font-medium text-fg">Ne želite sami?</span>
              Kodo pošljite svojemu izdelovalcu strani. Sporočilo z navodilom je pripravljeno.
              {embed.data ? (
                <span className="mt-2 block">
                  <CopyButton
                    text={messageForDeveloper}
                    label="Kopiraj sporočilo za izdelovalca"
                    onCopied={() => void api.markCodeCopied()}
                  />
                </span>
              ) : null}
            </li>
          </ul>
          <p className="mt-5 text-sm text-fg-subtle">Kodo najdete tudi pozneje pod Namestitev.</p>
        </section>
      </div>

      {error ? (
        <Callout tone="danger" title="Nastavitve ni bilo mogoče končati." className="mt-6">
          {error}
        </Callout>
      ) : null}
    </WizardStep>
  );
}

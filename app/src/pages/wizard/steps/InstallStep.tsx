import { useState } from 'react';
import { WizardStep } from '@/components/layout';
import { AgentWidget } from '@/components/widget';
import { Button, ButtonLink, CodeBlock, CopyButton, Notice, SkeletonText, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { AGENT_STATUS_HELP, agentStatusText } from '@/data/labels';
import { messageOf, type StepNav } from '../draft';

/** The last step has no "Preskoči": leaving without finishing is "Nadaljuj pozneje" in the shell. */
interface Props extends Omit<StepNav, 'onSkip'> {
  agent: api.Agent;
}

export function InstallStep({ agent, onBack, onDone }: Props) {
  const toast = useToast();
  const embed = api.useQuery(() => api.getEmbedCode(), []);
  const readiness = api.useQuery(() => api.getAgentReadiness(), []);
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    try {
      await api.setOnboardingStep('done');
      await onDone();
    } catch (e) {
      toast.error(`Nastavitve ni bilo mogoče končati. ${messageOf(e)}`);
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
            voiceId={agent.voice_id}
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
            <Notice
              tone="danger"
              title={embed.error}
              action={
                <Button size="sm" onClick={embed.reload}>
                  Poskusi znova
                </Button>
              }
            />
          ) : (
            <SkeletonText lines={3} />
          )}

          <ul className="mt-5 flex min-w-0 flex-col gap-4 text-sm text-fg-muted">
            <li>
              <span className="block text-base font-medium text-fg">WordPress</span>
              Kodo prilepite v nogo strani (footer), na primer z vtičnikom za dodajanje kode v glavo in nogo strani.
            </li>
            <li>
              <span className="block text-base font-medium text-fg">Wix, Squarespace in drugi urejevalniki strani</span>
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
          <p className="mt-5 text-sm text-fg-subtle">Kodo najdete tudi pozneje v razdelku Namestitev.</p>
        </section>
      </div>

      <WhatHappens readiness={readiness} />
    </WizardStep>
  );
}

/**
 * What "Končaj nastavitev" will do to the agent, said BEFORE the button is pressed. The api
 * decides (getAgentReadiness): with an included source the agent goes live, without one it
 * stays a draft. The wording of the states is the shared AGENT_STATUS_HELP.
 */
function WhatHappens({ readiness }: { readiness: api.QueryResult<api.AgentReadiness> }) {
  const r = readiness.data;
  if (!r) return null;

  if (r.status === 'draft' && r.canActivate) {
    return (
      <Notice tone="info" title="Ko pritisnete »Končaj nastavitev«, se agent vklopi." className="mt-6">
        {AGENT_STATUS_HELP.active}
      </Notice>
    );
  }

  if (r.status === 'draft') {
    const missing = r.missing[0];
    return (
      <Notice
        tone="warning"
        title="Agent bo po koncu nastavitve ostal osnutek."
        className="mt-6"
        action={
          <ButtonLink to="/zacetek/1" size="sm">
            Dodaj strani v koraku 1
          </ButtonLink>
        }
      >
        {missing ? `${missing.text} ` : null}
        {AGENT_STATUS_HELP.draft}
      </Notice>
    );
  }

  // Already switched on (or stopped): finishing does not change that.
  return (
    <Notice tone="neutral" title={`${agentStatusText(r.status)}. Končanje nastavitve tega ne spremeni.`} live={false} className="mt-6">
      {AGENT_STATUS_HELP[r.status]}
    </Notice>
  );
}

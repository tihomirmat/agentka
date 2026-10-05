import { useState } from 'react';
import { Send } from 'lucide-react';
import { WizardStep } from '@/components/layout';
import { Button, Card, CardBody, Field, Input, SwitchRow } from '@/components/ui';
import * as api from '@/data/api';
import { messageOf, type NotifyDraft, type StepNav } from '../draft';
import { Callout } from '../parts';

interface Props extends StepNav {
  draft: NotifyDraft;
  onChange: (patch: Partial<NotifyDraft>) => void;
}

export function NotifyStep({ draft, onChange, onBack, onSkip, onDone }: Props) {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [testNote, setTestNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  async function saveSettings() {
    await api.updateNotificationSettings({
      notify_email: draft.email.trim(),
      visitor_email_enabled: draft.visitorMail,
    });
  }

  async function next() {
    setEmailError(null);
    setBusy(true);
    try {
      await saveSettings();
      await onDone();
    } catch (e) {
      setEmailError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setEmailError(null);
    setTestNote(null);
    setTesting(true);
    try {
      // The test goes to the saved address, so what is on screen is saved first.
      await saveSettings();
      const result = await api.sendTestEmail();
      setTestNote(result.message);
    } catch (e) {
      setEmailError(messageOf(e));
    } finally {
      setTesting(false);
    }
  }

  return (
    <WizardStep
      title="Obvestila"
      description="Na ta e-naslov pošljemo povzetek pogovora in podatke obiskovalca, da ne zamudite nobenega kontakta."
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
        <Button variant="primary" loading={busy} disabled={testing} onClick={next}>
          Naprej
        </Button>
      }
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start">
          <Field
            className="sm:flex-1"
            label="E-naslov za obvestila"
            hint="To je lahko drug naslov, kot ste ga uporabili pri registraciji."
            error={emailError}
          >
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              value={draft.email}
              onChange={(e) => {
                setEmailError(null);
                // the earlier test result belonged to the previous address
                setTestNote(null);
                onChange({ email: e.target.value });
              }}
            />
          </Field>
          <div className="sm:pt-[1.625rem]">
            <Button icon={Send} loading={testing} disabled={busy} onClick={sendTest} className="w-full sm:w-auto">
              Pošlji testno sporočilo
            </Button>
          </div>
        </div>

        {testNote ? (
          <Callout tone="info" title="Rezultat testa">
            {testNote}
          </Callout>
        ) : null}

        <Card>
          <CardBody>
            <SwitchRow
              label="Obiskovalcu pošlji potrditev po e-pošti"
              description="Obiskovalec po pogovoru prejme povzetek in dogovorjeno, če je vpisal svoj e-naslov."
              checked={draft.visitorMail}
              onCheckedChange={(visitorMail) => onChange({ visitorMail })}
            />
          </CardBody>
        </Card>
      </div>
    </WizardStep>
  );
}

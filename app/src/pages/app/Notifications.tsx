import { useState } from 'react';
import { CircleAlert, Send } from 'lucide-react';
import * as api from '@/data/api';
import { formatRelativeDay } from '@/data/format';
import { EMAIL_KIND } from '@/data/labels';
import { BRAND } from '@/brand';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Notice,
  PageHeader,
  SaveBar,
  Select,
  Skeleton,
  SkeletonText,
  useDraft,
  useToast,
} from '@/components/ui';
import { RecentMessages } from './notifications/RecentMessages';
import { TemplateCard } from './notifications/TemplateCard';
import {
  DEFAULT_OWNER_TEMPLATE,
  DEFAULT_VISITOR_TEMPLATE,
  OWNER_VARIABLES,
  VISITOR_VARIABLES,
  valuesFor,
} from './notifications/templates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREVIEW_CONVERSATIONS = 8;

const TITLE = 'Obvestila';
const DESCRIPTION = 'Kaj pošljemo po vsakem pogovoru in na kateri naslov.';

/** Obvestila: who is told what after a conversation, and in whose name. */
export default function Notifications() {
  const settings = api.useQuery(() => api.getNotificationSettings(), []);
  const account = api.useQuery(() => api.getAccount(), []);
  const conversations = api.useQuery(() => api.listConversations(), []);
  const toast = useToast();

  const draft = useDraft<api.NotificationSettings>(settings.data);
  const save = api.useAction(api.updateNotificationSettings);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // The api's own sentence for the last test message: ONE inline notice, no toast as well.
  const [testResult, setTestResult] = useState<api.ActionResult | null>(null);
  const sendTest = api.useAction(api.sendTestEmail, { onError: toast.error });

  const value = draft.value;

  if (settings.error && !value && !settings.loading) {
    return (
      <>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <Card>
          <EmptyState
            icon={CircleAlert}
            title={settings.error}
            action={<Button onClick={settings.reload}>Poskusi znova</Button>}
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
          {[0, 1, 2].map((i) => (
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

  const notify = value.notify_email.trim();
  const reply = value.reply_to.trim();
  const sender = value.sender_name.trim();

  const notifyError = !notify
    ? 'Vpišite e-naslov, na katerega naj pošljemo obvestila. Primer: info@podjetje.si'
    : !EMAIL_RE.test(notify)
      ? 'E-naslov ni pravilno zapisan. Primer: info@podjetje.si'
      : undefined;
  const replyError = reply && !EMAIL_RE.test(reply) ? 'Naslov za odgovore ni pravilno zapisan. Primer: info@podjetje.si' : undefined;
  const senderError = !sender ? 'Vpišite ime, ki ga obiskovalec vidi kot pošiljatelja.' : undefined;
  const invalid = Boolean(notifyError ?? replyError ?? senderError);

  // The test message goes to the SAVED address, so it is offered only when the field matches it.
  const emailChanged = draft.server !== undefined && value.notify_email !== draft.server.notify_email;
  const testBlockedReason = emailChanged
    ? 'Najprej shranite spremembe: testno sporočilo gre na shranjeni naslov.'
    : notifyError
      ? 'Najprej popravite e-naslov za obvestila.'
      : false;

  const business = account.data?.name ?? value.sender_name;
  const recent = (conversations.data ?? []).slice(0, PREVIEW_CONVERSATIONS);
  const defaultConversation = recent.find((c) => c.visitor_name && c.visitor_email) ?? recent[0];
  const chosen = recent.find((c) => c.id === previewId) ?? defaultConversation;
  const values = valuesFor(chosen, business);
  const senderShown = sender || business;

  async function runTest() {
    setTestResult(null);
    const r = await sendTest.run();
    if (r) setTestResult(r);
  }

  async function submit() {
    if (invalid) return;
    const saved = await save.run(draft.changes);
    if (saved) {
      draft.commit(saved);
      toast.success('Nastavitve obvestil so shranjene.');
    }
  }

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader
            title="Naslov in pošiljatelj"
            description="Obvestila prejmete na svoj e-naslov. Sporočila obiskovalcem se pošljejo v imenu vašega podjetja, njihovi odgovori pa prispejo na naslov za odgovore."
          />
          <CardBody className="flex flex-col gap-4">
            <div className="grid min-w-0 gap-4 lg:grid-cols-3">
              <Field
                label="E-naslov za obvestila"
                error={notifyError}
                hint="Na ta naslov prejmete povzetek pogovorov in podatke obiskovalcev."
              >
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="info@podjetje.si"
                  value={value.notify_email}
                  onChange={(e) => draft.patch({ notify_email: e.target.value })}
                />
              </Field>
              <Field label="Ime pošiljatelja" error={senderError} hint="To ime obiskovalec vidi ob prejetem sporočilu.">
                <Input
                  autoComplete="organization"
                  value={value.sender_name}
                  onChange={(e) => draft.patch({ sender_name: e.target.value })}
                />
              </Field>
              <Field
                label="Naslov za odgovore"
                optional
                error={replyError}
                hint={
                  reply && !replyError
                    ? `Ko obiskovalec pritisne »Odgovori«, odgovor prispe na ${reply}.`
                    : 'Na ta naslov prispejo odgovori obiskovalcev.'
                }
              >
                <Input
                  type="email"
                  inputMode="email"
                  spellCheck={false}
                  placeholder="info@podjetje.si"
                  value={value.reply_to}
                  onChange={(e) => draft.patch({ reply_to: e.target.value })}
                />
              </Field>
            </div>
            <div className="border-t border-border pt-4">
              <Button
                icon={Send}
                loading={sendTest.pending}
                disabledReason={testBlockedReason}
                onClick={() => void runTest()}
              >
                Pošlji testno sporočilo
              </Button>
            </div>
            {testResult ? (
              <Notice size="sm" tone={testResult.simulated ? 'neutral' : 'success'}>
                {testResult.message}
              </Notice>
            ) : null}
          </CardBody>
        </Card>

        <Notice tone="neutral" title="Pogovor za predogled" live={false}>
          <p>
            Spremenljivke v besedilih spodaj se zapolnijo s podatki izbranega pogovora, da vidite, kaj bo prejemnik zares
            prebral.
          </p>
          <div className="mt-3 max-w-sm">
            {recent.length > 0 && chosen ? (
              <Select
                aria-label="Pogovor za predogled"
                value={chosen.id}
                onValueChange={setPreviewId}
                options={recent.map((c) => ({
                  value: c.id,
                  label: `${c.visitor_name ?? 'Brez imena'} · ${formatRelativeDay(c.started_at)}`,
                  description: c.topic,
                }))}
              />
            ) : (
              <p className="text-sm text-fg-subtle">Pogovorov še ni, zato so spremenljivke prikazane z imenom.</p>
            )}
          </div>
        </Notice>

        <TemplateCard
          title={EMAIL_KIND.visitor_confirmation}
          description="Obiskovalec po pogovoru prejme povzetek na svoj e-naslov, če ga je vpisal."
          enabled={value.visitor_email_enabled}
          onEnabledChange={(on) => draft.patch({ visitor_email_enabled: on })}
          value={value.visitor_template}
          onChange={(text) => draft.patch({ visitor_template: text })}
          defaultValue={DEFAULT_VISITOR_TEMPLATE}
          variables={VISITOR_VARIABLES}
          subject={`Povzetek pogovora – ${senderShown}`}
          subjectNote={`Zadevo določi ${BRAND} in je ni mogoče spremeniti.`}
          from={senderShown}
          to={chosen?.visitor_email ?? null}
          toMissing="obiskovalec ni vpisal e-naslova"
          replyTo={reply && !replyError ? reply : null}
          values={values}
          realSample={chosen !== undefined}
        />

        <TemplateCard
          title={EMAIL_KIND.owner_notification}
          description="Po vsakem pogovoru prejmete povzetek in podatke obiskovalca na naslov za obvestila."
          enabled={value.owner_email_enabled}
          onEnabledChange={(on) => draft.patch({ owner_email_enabled: on })}
          value={value.owner_template}
          onChange={(text) => draft.patch({ owner_template: text })}
          defaultValue={DEFAULT_OWNER_TEMPLATE}
          variables={OWNER_VARIABLES}
          subject={chosen ? `Nov pogovor: ${chosen.topic}` : 'Nov pogovor: tema pogovora'}
          subjectNote={`Zadeva vsebuje temo pogovora. Določi jo ${BRAND} in je ni mogoče spremeniti.`}
          from={senderShown}
          to={notify && !notifyError ? notify : null}
          toMissing="naslov za obvestila še ni vpisan"
          replyTo={null}
          values={values}
          realSample={chosen !== undefined}
        />

        <RecentMessages />
      </div>

      <SaveBar
        dirty={draft.dirty}
        saving={save.pending}
        canSave={!invalid}
        blockedReason={invalid ? 'Popravite polja, označena z napako, da lahko shranite.' : undefined}
        error={save.error}
        onSave={() => void submit()}
        onDiscard={draft.discard}
      />
    </>
  );
}

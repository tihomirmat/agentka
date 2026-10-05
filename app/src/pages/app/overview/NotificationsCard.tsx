import { ButtonLink, Card, CardBody, CardFooter, CardHeader, CopyValue, StatusPill } from '@/components/ui';
import * as api from '@/data/api';
import { formatRelativeDateTime } from '@/data/format';
import { EMAIL_KIND } from '@/data/labels';
import { Detail, Details, Notice, Pending } from './parts';

/** The newest failed e-mail of the account, read from the e-mail log of the conversations that have one. */
async function findLastFailedEmail(): Promise<api.EmailLog | null> {
  const conversations = await api.listConversations(); // newest first
  const withFailure = conversations.filter(
    (c) => c.visitor_email_status === 'failed' || c.owner_email_status === 'failed',
  );
  for (const c of withFailure) {
    const failed = (await api.listEmailLog(c.id)).filter((e) => e.status === 'failed');
    const newest = failed.sort((a, b) => b.sent_at.localeCompare(a.sent_at))[0];
    if (newest) return newest;
  }
  return null;
}

function OnOff({ on }: { on: boolean }) {
  return on ? <StatusPill tone="success">Vklopljeno</StatusPill> : <StatusPill tone="neutral">Izklopljeno</StatusPill>;
}

/** "Obvestila": who is told after a conversation, and the last e-mail that did not arrive. */
export function NotificationsCard() {
  const settings = api.useQuery(() => api.getNotificationSettings(), []);
  const failed = api.useQuery(findLastFailedEmail, []);
  const n = settings.data;

  return (
    <Card>
      <CardHeader
        title="Obvestila"
        description="Kdo po pogovoru prejme e-pošto."
        action={n ? <OnOff on={n.owner_email_enabled || n.visitor_email_enabled} /> : null}
      />
      {n && failed.data !== undefined ? (
        <>
          <CardBody className="flex flex-col gap-4">
            <Details>
              <Detail label="E-naslov">
                {n.notify_email ? (
                  <CopyValue value={n.notify_email} copyLabel="Kopiraj e-naslov" mono className="text-sm" />
                ) : (
                  <span className="text-fg-muted">Ni vpisan.</span>
                )}
              </Detail>
              <Detail label="Obvestilo vam">
                <OnOff on={n.owner_email_enabled} />
              </Detail>
              <Detail label="Potrditev obiskovalcu">
                <OnOff on={n.visitor_email_enabled} />
              </Detail>
            </Details>
            {failed.data ? (
              <Notice tone="danger" title="Zadnje sporočilo ni bilo dostavljeno.">
                {EMAIL_KIND[failed.data.kind]} za {failed.data.to}, {formatRelativeDateTime(failed.data.sent_at)}.
                {failed.data.error ? ` ${failed.data.error}` : ''}
              </Notice>
            ) : null}
          </CardBody>
          <CardFooter>
            <ButtonLink to="/app/obvestila" size="sm">
              Uredi obvestila
            </ButtonLink>
          </CardFooter>
        </>
      ) : (
        <Pending queries={[settings, failed]} lines={3} />
      )}
    </Card>
  );
}

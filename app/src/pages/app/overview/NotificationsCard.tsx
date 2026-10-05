import { ButtonLink, Card, CardBody, CardFooter, CardHeader, CopyValue, FactList, Notice, StatusPill } from '@/components/ui';
import * as api from '@/data/api';
import { formatRelativeDateTime } from '@/data/format';
import { EMAIL_KIND } from '@/data/labels';
import { Pending } from './parts';

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

const yesNo = (on: boolean) => (on ? 'Da' : 'Ne');

/** "Obvestila": who is told after a conversation, and the last e-mail that did not arrive. */
export function NotificationsCard() {
  const settings = api.useQuery(() => api.getNotificationSettings(), []);
  const failed = api.useQuery(findLastFailedEmail, []);
  const n = settings.data;
  const anyOn = n ? n.owner_email_enabled || n.visitor_email_enabled : false;

  return (
    <Card>
      <CardHeader
        title="Obvestila"
        description="Kdo po pogovoru prejme e-pošto."
        // ONE pill for the whole card; the rows below say da / ne in plain words.
        action={
          n ? (
            <StatusPill tone={anyOn ? 'success' : 'neutral'}>{anyOn ? 'Vklopljeno' : 'Izklopljeno'}</StatusPill>
          ) : null
        }
      />
      {n && failed.data !== undefined ? (
        <>
          <CardBody className="flex flex-col gap-4">
            <FactList
              columns={3}
              items={[
                {
                  label: 'E-naslov',
                  value: n.notify_email ? (
                    <CopyValue value={n.notify_email} copyLabel="Kopiraj e-naslov" mono className="text-sm" />
                  ) : (
                    <span className="text-fg-muted">Ni vpisan.</span>
                  ),
                },
                { label: EMAIL_KIND.owner_notification, value: yesNo(n.owner_email_enabled) },
                { label: EMAIL_KIND.visitor_confirmation, value: yesNo(n.visitor_email_enabled) },
              ]}
            />
            {failed.data ? (
              <Notice
                tone="danger"
                title="Zadnje sporočilo ni bilo dostavljeno."
                action={
                  failed.data.conversation_id ? (
                    <ButtonLink to={`/app/pogovori/${failed.data.conversation_id}`} size="sm">
                      Odpri pogovor
                    </ButtonLink>
                  ) : null
                }
              >
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

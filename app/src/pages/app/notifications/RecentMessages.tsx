import { Link } from 'react-router-dom';
import { CircleAlert, Mail } from 'lucide-react';
import * as api from '@/data/api';
import { formatRelativeDateTime } from '@/data/format';
import { EMAIL_KIND, EMAIL_STATUS } from '@/data/labels';
import { Button, ButtonLink, Card, CardHeader, EmptyState, SkeletonRows, StatusPill } from '@/components/ui';

/** How many of the newest conversations are searched for sent messages. */
const CONVERSATIONS_LOOKED_AT = 15;
const SHOWN = 6;

/**
 * The api lists the e-mail log per conversation only, so the newest conversations are asked one
 * by one. The list shows the newest messages and, on top of them, any that were not delivered.
 */
async function loadRecent(): Promise<api.EmailLog[]> {
  const conversations = await api.listConversations();
  const logs = await Promise.all(conversations.slice(0, CONVERSATIONS_LOOKED_AT).map((c) => api.listEmailLog(c.id)));
  const all = logs.flat().sort((a, b) => b.sent_at.localeCompare(a.sent_at));
  const newest = all.slice(0, SHOWN);
  const shown = new Set(newest.map((e) => e.id));
  const failedOlder = all.slice(SHOWN).filter((e) => e.status === 'failed' && !shown.has(e.id));
  return [...newest, ...failedOlder].sort((a, b) => b.sent_at.localeCompare(a.sent_at));
}

/** "Zadnja poslana sporočila": status of every message, and what to do about a failed one. */
export function RecentMessages() {
  const recent = api.useQuery(loadRecent, []);
  const rows = recent.data ?? [];

  return (
    <Card>
      <CardHeader
        title="Zadnja poslana sporočila"
        description="Zadnjih šest sporočil po pogovorih in vsa, ki niso bila dostavljena."
        divider
      />
      {recent.loading ? (
        <SkeletonRows rows={4} />
      ) : recent.error && !recent.data ? (
        <EmptyState
          icon={CircleAlert}
          title={recent.error}
          action={<Button onClick={recent.reload}>Poskusi znova</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Ko agent opravi prvi pogovor, se tukaj pokažejo poslana sporočila."
          action={<ButtonLink to="/app/namestitev">Odpri namestitev</ButtonLink>}
        />
      ) : (
        <ul>
          {rows.map((e) => {
            const status = EMAIL_STATUS[e.status];
            return (
              <li key={e.id} className="min-w-0 border-b border-border px-4 py-3 last:border-b-0 sm:px-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-base font-medium text-fg">{EMAIL_KIND[e.kind]}</span>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  <span className="nums ml-auto text-sm text-fg-subtle">{formatRelativeDateTime(e.sent_at)}</span>
                </div>
                <p className="mt-0.5 min-w-0 truncate text-sm text-fg-muted">
                  <span className="text-fg-subtle">Za </span>
                  {e.to}
                  <span className="text-fg-subtle"> · </span>
                  {e.subject}
                </p>
                {e.status === 'failed' ? (
                  <p className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
                    <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      {e.error ?? 'Sporočila ni bilo mogoče dostaviti.'}
                      {e.conversation_id ? (
                        <>
                          {' '}
                          <Link
                            to={`/app/pogovori/${e.conversation_id}`}
                            className="rounded font-medium underline underline-offset-2 hover:no-underline"
                          >
                            Odpri pogovor
                          </Link>
                        </>
                      ) : null}
                    </span>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

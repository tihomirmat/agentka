import { Link } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { ButtonLink, Card, CardFooter, CardHeader, EmptyState, StatusPill } from '@/components/ui';
import * as api from '@/data/api';
import { formatRelativeDateTime } from '@/data/format';
import { CONVERSATION_OUTCOME } from '@/data/labels';
import { Pending } from './parts';

/** "Najnovejši pogovori": up to four, each leads to its own page. */
export function RecentCard() {
  const conversations = api.useQuery(() => api.listConversations(), []);
  const recent = conversations.data?.slice(0, 4);

  return (
    <Card>
      <CardHeader title="Najnovejši pogovori" description="Pogovori obiskovalcev z agentom, od najnovejšega." divider />
      {recent === undefined ? (
        <Pending queries={[conversations]} lines={4} />
      ) : recent.length === 0 ? (
        <EmptyState
          compact
          icon={MessagesSquare}
          title="Ko bo agent opravil prvi pogovor, ga boste videli tukaj."
          action={
            <ButtonLink to="/app/namestitev" size="sm">
              Odpri namestitev
            </ButtonLink>
          }
        />
      ) : (
        <>
          <ul>
            {recent.map((c) => {
              const outcome = CONVERSATION_OUTCOME[c.outcome];
              return (
                <li key={c.id} className="border-b border-border last:border-b-0">
                  <Link
                    to={`/app/pogovori/${c.id}`}
                    className="flex min-w-0 flex-col gap-1 px-4 py-3 transition-colors duration-100 hover:bg-surface-2 focus-visible:outline-offset-[-2px] sm:px-5"
                  >
                    <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-medium text-fg">{formatRelativeDateTime(c.started_at)}</span>
                      <StatusPill tone={outcome.tone}>{outcome.label}</StatusPill>
                      {c.visitor_name ? <span className="min-w-0 truncate text-sm text-fg-muted">{c.visitor_name}</span> : null}
                    </span>
                    <span className="truncate text-base text-fg-muted">{c.summary}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <CardFooter>
            <ButtonLink to="/app/pogovori" size="sm">
              Vsi pogovori
            </ButtonLink>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

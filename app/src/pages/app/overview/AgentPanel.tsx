import { AgentWidget } from '@/components/widget';
import { Skeleton, StatusPill } from '@/components/ui';
import * as api from '@/data/api';
import { AGENT_STATUS, AGENT_STATUS_HELP, PAUSED_BY, agentStatusText } from '@/data/labels';
import { Pending } from './parts';

/**
 * Right column of Pregled: the live test widget, with the status of the agent and what that
 * status means for visitors (one sentence from labels.ts, the same everywhere). What is
 * still missing, and the button that fixes it, are in "Kaj še manjka" on the left.
 */
export function AgentPanel() {
  const agent = api.useQuery(() => api.getAgent(), []);
  const a = agent.data;
  const status = a ? AGENT_STATUS[a.status] : null;

  return (
    <aside aria-labelledby="overview-test-title" className="min-w-0 lg:self-start lg:sticky-top lg:top-6">
      <div className="mb-3 min-w-0">
        <h2 id="overview-test-title" className="text-md font-semibold text-fg">
          Preizkusite svojega agenta
        </h2>
        <p className="mt-0.5 text-sm text-fg-muted">Vprašajte ga tako, kot bi ga vprašal obiskovalec.</p>
        <div className="mt-2.5 min-w-0">
          {a && status ? (
            <>
              <StatusPill tone={status.tone}>{agentStatusText(a.status)}</StatusPill>
              <p className="mt-1.5 text-sm text-fg-muted">
                {AGENT_STATUS_HELP[a.status]}
                {a.status === 'paused' && a.paused_by ? ` ${PAUSED_BY[a.paused_by].help}` : null}
              </p>
            </>
          ) : (
            <Skeleton className="h-5 w-28 rounded-full" />
          )}
        </div>
      </div>
      {a ? (
        <AgentWidget
          agentName={a.name}
          businessName={a.business_name}
          voiceId={a.voice_id}
          firstMessage={a.first_message}
          textInput={a.widget_text_input}
          accentHex={a.widget_accent_color}
        />
      ) : agent.error ? (
        <div className="rounded-lg border border-border bg-surface">
          <Pending queries={[agent]} />
        </div>
      ) : (
        <Skeleton className="h-[30rem] w-full max-w-sm rounded-lg" />
      )}
    </aside>
  );
}

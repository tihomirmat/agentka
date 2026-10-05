import { AgentWidget } from '@/components/widget';
import { Skeleton, StatusPill } from '@/components/ui';
import * as api from '@/data/api';
import { AGENT_STATUS } from '@/data/labels';
import { Pending } from './parts';

/** Right column of Pregled: the live test widget with the status of the agent. */
export function AgentPanel() {
  const agent = api.useQuery(() => api.getAgent(), []);
  const a = agent.data;
  const status = a ? AGENT_STATUS[a.status] : null;

  return (
    <aside aria-labelledby="overview-test-title" className="min-w-0 lg:self-start lg:sticky-top lg:top-6">
      <div className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0 flex-1 basis-40">
          <h2 id="overview-test-title" className="text-md font-semibold text-fg">
            Preizkusite svojega agenta
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">Vprašajte ga tako, kot bi ga vprašal obiskovalec.</p>
        </div>
        {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : <Skeleton className="h-5 w-20 rounded-full" />}
      </div>
      {a ? (
        <AgentWidget
          agentName={a.name}
          businessName={a.business_name}
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

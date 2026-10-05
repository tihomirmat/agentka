import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Textarea } from '@/components/ui';
import type { Draft } from '@/components/ui';
import type { Agent, QueryResult } from '@/data/api';
import { Pending } from './parts';

export interface InstructionsDraft {
  instructions: string;
}

/**
 * "Navodila agentu": the one thing on Pregled that is edited in place. The card only edits
 * the draft; saving, discarding and the "leave without saving?" question belong to the
 * page's single SaveBar (Overview.tsx).
 */
export function InstructionsCard({ agent, draft }: { agent: QueryResult<Agent>; draft: Draft<InstructionsDraft> }) {
  const hintId = useId();
  return (
    <Card>
      <CardHeader title="Navodila agentu" description="Kako naj agent govori in na kaj naj pazi." />
      {draft.value ? (
        <CardBody className="flex flex-col gap-3">
          <Textarea
            aria-label="Navodila agentu"
            aria-describedby={hintId}
            rows={8}
            value={draft.value.instructions}
            onChange={(e) => draft.patch({ instructions: e.target.value })}
          />
          <div id={hintId} className="grid min-w-0 gap-2 text-sm text-fg-muted sm:grid-cols-2 sm:gap-5">
            <p>
              <span className="font-medium text-fg">Sem sodi:</span> ton pogovora, kaj naj agent poudari in česa naj ne
              obljublja.
            </p>
            <p>
              <span className="font-medium text-fg">Ne sodi sem:</span> dejstva in cene. Zapišite jih v razdelku{' '}
              <Link to="/app/viri" className="rounded font-medium text-accent underline underline-offset-2 hover:text-accent-hover">
                Viri znanja
              </Link>
              , od tam agent odgovarja.
            </p>
          </div>
        </CardBody>
      ) : (
        <Pending queries={[agent]} lines={5} />
      )}
    </Card>
  );
}

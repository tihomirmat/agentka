import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardBody, CardFooter, CardHeader, Textarea, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { Pending } from './parts';

/** "Navodila agentu": the one thing on Pregled that is edited in place. */
export function InstructionsCard() {
  const agent = api.useQuery(() => api.getAgent(), []);
  return (
    <Card>
      <CardHeader title="Navodila agentu" description="Kako naj agent govori in na kaj naj pazi." />
      {agent.data ? <InstructionsForm saved={agent.data.instructions} /> : <Pending queries={[agent]} lines={5} />}
    </Card>
  );
}

function InstructionsForm({ saved }: { saved: string }) {
  const toast = useToast();
  const hintId = useId();
  const [draft, setDraft] = useState(saved);
  // The value the draft is compared with: what was last saved (also right after saving, before the reload).
  const [baseline, setBaseline] = useState(saved);
  const save = api.useAction(api.updateAgent);

  useEffect(() => {
    setBaseline(saved);
  }, [saved]);

  const dirty = draft !== baseline;

  async function submit() {
    const result = await save.run({ instructions: draft });
    if (!result) return;
    setBaseline(draft);
    toast.success('Navodila so shranjena.');
  }

  return (
    <>
      <CardBody className="flex flex-col gap-3">
        <Textarea
          aria-label="Navodila agentu"
          aria-describedby={hintId}
          rows={8}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div id={hintId} className="grid min-w-0 gap-2 text-sm text-fg-muted sm:grid-cols-2 sm:gap-5">
          <p>
            <span className="font-medium text-fg">Sem sodi:</span> ton pogovora, kaj naj agent poudari in česa naj ne
            obljublja.
          </p>
          <p>
            <span className="font-medium text-fg">Ne sodi sem:</span> dejstva in cene. Zapišite jih pod{' '}
            <Link to="/app/viri" className="rounded font-medium text-accent underline underline-offset-2 hover:text-accent-hover">
              Viri znanja
            </Link>
            , od tam agent odgovarja.
          </p>
        </div>
        {save.error ? (
          <p role="alert" className="text-sm text-danger">
            {save.error}
          </p>
        ) : null}
      </CardBody>
      <CardFooter>
        {dirty ? (
          <Button size="sm" variant="ghost" disabled={save.pending} onClick={() => setDraft(baseline)}>
            Razveljavi
          </Button>
        ) : null}
        <Button size="sm" disabled={!dirty} loading={save.pending} onClick={submit}>
          Shrani spremembe
        </Button>
      </CardFooter>
    </>
  );
}

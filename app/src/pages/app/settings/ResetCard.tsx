import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, Card, CardBody, ConfirmDialog, useToast } from '@/components/ui';
import * as api from '@/data/api';

/** Ponastavi vzorčne podatke: exists only in the preview, because the data lives in this browser. */
export function ResetCard() {
  const toast = useToast();
  const reset = api.useAction(api.resetSampleData, { onError: (m) => toast.error(m) });
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1 basis-72">
          <h2 className="text-md font-semibold text-fg">Vzorčni podatki</h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            Ta možnost obstaja samo v predogledu. Zavrže vse spremembe in znova prikaže začetne vzorčne podatke.
          </p>
        </div>
        <Button icon={RotateCcw} onClick={() => setOpen(true)}>
          Ponastavi vzorčne podatke
        </Button>
      </CardBody>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tone="danger"
        title="Ponastavim vzorčne podatke?"
        description="Vse spremembe, ki ste jih naredili v tem brskalniku, bodo izgubljene. Prijavljeni ostanete. Tega ni mogoče razveljaviti."
        confirmLabel="Ponastavi vzorčne podatke"
        onConfirm={async () => {
          const result = await reset.run();
          if (!result) return;
          if (result.simulated) toast.info(result.message);
          else toast.success(result.message);
        }}
      />
    </Card>
  );
}

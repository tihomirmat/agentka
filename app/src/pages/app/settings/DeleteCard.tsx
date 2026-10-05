import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { TypedConfirmDialog } from './TypedConfirmDialog';

/** Danger zone. The API in the preview does not delete anything and says so; its message is shown as it is. */
export function DeleteCard({ accountName }: { accountName: string }) {
  const toast = useToast();
  const remove = api.useAction(api.deleteAccount, { onError: (m) => toast.error(m) });
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-danger">
      <CardHeader
        title="Izbris uporabniškega računa"
        description="Izbris je trajen in ga ni mogoče razveljaviti."
      />
      <CardBody className="flex flex-col gap-4 first:pt-0 sm:first:pt-0">
        <p className="text-base text-fg">
          <span className="font-medium">Kaj se izbriše: </span>
          agent, viri znanja, pogovori, kontakti in rezervacije.
        </p>
        <div>
          <Button variant="danger" icon={Trash2} onClick={() => setOpen(true)}>
            Izbriši uporabniški račun
          </Button>
        </div>
      </CardBody>
      <TypedConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Izbrišem uporabniški račun »${accountName}«?`}
        description="Izbrisali se bodo agent, viri znanja, pogovori, kontakti in rezervacije. Tega ni mogoče razveljaviti."
        fieldLabel="Za potrditev vpišite ime podjetja"
        expected={accountName}
        confirmLabel="Izbriši uporabniški račun"
        onConfirm={async () => {
          const result = await remove.run();
          if (!result) return;
          if (result.simulated) toast.info(result.message);
          else toast.success(result.message);
        }}
      />
    </Card>
  );
}

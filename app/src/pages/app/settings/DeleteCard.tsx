import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, TypedConfirmDialog, useToast } from '@/components/ui';
import * as api from '@/data/api';

export interface DeleteCardProps {
  accountName: string;
  /** called just before the account is deleted, so the page lets go of unsaved edits and the leave guard stays quiet */
  onBeforeDelete: () => void;
}

/**
 * Izbris uporabniškega računa. The api removes the account's rows and ends the session, so
 * the page cannot stay: afterwards the person is taken to the start page, and the api's
 * sentence is shown there as a toast (a toast raised right before a page change survives it).
 */
export function DeleteCard({ accountName, onBeforeDelete }: DeleteCardProps) {
  const toast = useToast();
  const navigate = useNavigate();
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
          onBeforeDelete();
          const result = await remove.run();
          if (!result) return;
          toast.info(result.message);
          navigate('/', { replace: true });
        }}
      />
    </Card>
  );
}

import { useState, type ReactNode } from 'react';
import { Button, Dialog, Field, Input } from '@/components/ui';

export interface TypedConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** the text that must be typed before the button works */
  expected: string;
  /** label of the field, e.g. "Za potrditev vpišite ime podjetja" */
  fieldLabel: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
}

/** A danger dialog that stays locked until the person types a given text (ConfirmDialog cannot do this). */
export function TypedConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  expected,
  fieldLabel,
  confirmLabel,
  onConfirm,
}: TypedConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const matches = typed.trim() === expected.trim();

  function close(next: boolean) {
    if (busy) return;
    if (!next) setTyped('');
    onOpenChange(next);
  }

  async function submit() {
    if (!matches) return;
    try {
      setBusy(true);
      await onConfirm();
    } finally {
      setBusy(false);
      setTyped('');
      onOpenChange(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)} disabled={busy}>
            Prekliči
          </Button>
          <Button variant="danger" disabled={!matches} loading={busy} onClick={submit}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label={fieldLabel} hint={`Vpisati morate: ${expected}`}>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
        </Field>
      </form>
    </Dialog>
  );
}

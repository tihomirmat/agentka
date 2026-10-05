import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** the question, e.g. "Odstranim vir »Cenik storitev«?" */
  title: ReactNode;
  /** what will happen and whether it can be undone */
  description?: ReactNode;
  /** says exactly what the button does: "Odstrani vir", never "V redu" */
  confirmLabel: string;
  cancelLabel?: string;
  /** 'danger' for actions that delete or cannot be undone */
  tone?: 'default' | 'danger';
  /** may return a promise; the dialog shows progress and closes when it settles */
  onConfirm: () => void | Promise<unknown>;
}

/** The in-page replacement for the browser confirm box. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Prekliči',
  tone = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    try {
      setBusy(true);
      await onConfirm();
    } finally {
      setBusy(false);
      onOpenChange(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={busy} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

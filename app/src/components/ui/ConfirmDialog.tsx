import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Field } from './Field';
import { Input } from './Input';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** the question, e.g. "Odstranim vir »Cenik storitev«?" */
  title: ReactNode;
  /** what will happen and whether it can be undone */
  description?: ReactNode;
  /** more detail under the description (what is lost, a short list) */
  children?: ReactNode;
  /** says exactly what the button does: "Odstrani vir", never "V redu" */
  confirmLabel: string;
  cancelLabel?: string;
  /** 'danger' for actions that delete or cannot be undone */
  tone?: 'default' | 'danger';
  /**
   * The text the person must type before the button works (e.g. the business name), for
   * the few actions that destroy everything. See TypedConfirmDialog.
   */
  requireText?: string;
  /** label of that field: "Za potrditev vpišite ime podjetja" */
  requireTextLabel?: string;
  /** may return a promise; the dialog shows progress and closes when it settles */
  onConfirm: () => void | Promise<unknown>;
}

/** The in-page replacement for the browser confirm box. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Prekliči',
  tone = 'default',
  requireText,
  requireTextLabel = 'Za potrditev vpišite besedilo',
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState('');
  const locked = requireText !== undefined && typed.trim() !== requireText.trim();

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  async function handleConfirm() {
    if (locked || busy) return;
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
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={busy}
            disabled={locked}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children || requireText !== undefined ? (
        <div className="flex flex-col gap-4">
          {children}
          {requireText !== undefined ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleConfirm();
              }}
            >
              <Field label={requireTextLabel} hint={`Vpisati morate: ${requireText}`}>
                <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
              </Field>
            </form>
          ) : null}
        </div>
      ) : undefined}
    </Dialog>
  );
}

export interface TypedConfirmDialogProps
  extends Omit<ConfirmDialogProps, 'requireText' | 'requireTextLabel' | 'tone'> {
  /** the text that must be typed before the button works */
  expected: string;
  /** label of the field, e.g. "Za potrditev vpišite ime podjetja" */
  fieldLabel: string;
}

/**
 * A danger dialog that stays locked until the person types a given text. Only for actions
 * that destroy everything (deleting the account). It is ConfirmDialog with `requireText`.
 */
export function TypedConfirmDialog({ expected, fieldLabel, ...rest }: TypedConfirmDialogProps) {
  return <ConfirmDialog tone="danger" requireText={expected} requireTextLabel={fieldLabel} {...rest} />;
}

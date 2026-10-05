import type { ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** one or two sentences under the title */
  description?: ReactNode;
  children?: ReactNode;
  /** buttons, right-aligned; the main action goes last */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** false = the person must use a button (no ✕, no click outside) */
  dismissible?: boolean;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

/**
 * An in-page dialog (focus is trapped, Esc closes it). Controlled:
 *
 *   const [open, setOpen] = useState(false);
 *   <Dialog open={open} onOpenChange={setOpen} title="Dodaj besedilo" footer={<Button …/>}>…</Dialog>
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-overlay motion-safe:animate-fade-in" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <RadixDialog.Content
            {...(description ? {} : { 'aria-describedby': undefined })}
            onPointerDownOutside={dismissible ? undefined : (e) => e.preventDefault()}
            onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
            className={cn(
              'pointer-events-auto flex max-h-full w-full flex-col rounded-lg border border-border bg-raised shadow-lg motion-safe:animate-rise-in',
              SIZES[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
              <div className="min-w-0">
                <RadixDialog.Title className="font-display text-lg font-semibold text-fg">
                  {title}
                </RadixDialog.Title>
                {description ? (
                  <RadixDialog.Description className="mt-1 text-base text-fg-muted">
                    {description}
                  </RadixDialog.Description>
                ) : null}
              </div>
              {dismissible ? (
                <RadixDialog.Close
                  aria-label="Zapri"
                  className="-mr-2 -mt-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-fg-muted transition-colors hover:bg-raised-hover hover:text-fg"
                >
                  <X size={18} aria-hidden="true" />
                </RadixDialog.Close>
              ) : null}
            </div>
            {children ? <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div> : null}
            {footer ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">
                {footer}
              </div>
            ) : null}
          </RadixDialog.Content>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

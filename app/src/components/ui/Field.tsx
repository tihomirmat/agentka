import { createContext, useContext, useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Used by Input, Textarea, Select, Checkbox and Switch. Returns the id and aria
 * attributes of the surrounding <Field>, or creates a stable id when there is none.
 */
export function useFieldControl(props: {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}) {
  const field = useContext(FieldContext);
  const ownId = useId();
  const invalid = props['aria-invalid'] ?? (field?.invalid ? true : undefined);
  return {
    id: props.id ?? field?.id ?? ownId,
    'aria-describedby': props['aria-describedby'] ?? field?.describedBy,
    'aria-invalid': invalid,
    required: field?.required || undefined,
  };
}

export interface FieldProps {
  label: ReactNode;
  /** one quiet sentence under the control */
  hint?: ReactNode;
  /** what is wrong and what to do; replaces the hint and marks the control invalid */
  error?: ReactNode;
  required?: boolean;
  /** shown after the label for fields people may skip */
  optional?: boolean;
  /** give an id only when something else must point at the control */
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + hint or error, wired together with stable ids.
 *
 *   <Field label="E-naslov za obvestila" hint="Sem pošljemo povzetek vsakega pogovora.">
 *     <Input type="email" value={v} onChange={…} />
 *   </Field>
 */
export function Field({ label, hint, error, required = false, optional = false, id, className, children }: FieldProps) {
  const auto = useId();
  const controlId = id ?? `f${auto}`;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <FieldContext.Provider value={{ id: controlId, describedBy, invalid: Boolean(error), required }}>
      <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
        <label htmlFor={controlId} className="text-sm font-medium text-fg">
          {label}
          {optional ? <span className="ml-1.5 font-normal text-fg-subtle">neobvezno</span> : null}
        </label>
        {children}
        {error ? (
          <p id={errorId} className="flex items-start gap-1.5 text-sm text-danger">
            <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p id={hintId} className="text-sm text-fg-subtle">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

/** Shared look of text controls. */
export const CONTROL_CLASS =
  'w-full min-w-0 rounded border border-border-strong bg-surface text-base text-fg ' +
  'transition-colors duration-100 placeholder:text-fg-subtle hover:border-fg-subtle ' +
  'focus-visible:border-ring focus-visible:outline-offset-0 ' +
  'aria-[invalid=true]:border-danger disabled:bg-surface-2 disabled:text-fg-subtle disabled:hover:border-border-strong ' +
  '[&[readonly]]:bg-surface-2';

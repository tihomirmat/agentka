import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { CONTROL_CLASS, useFieldControl } from './Field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** small text or icon inside the field, before the value (e.g. "https://") */
  prefix?: ReactNode;
  /** small text or icon inside the field, after the value (e.g. "min") */
  suffix?: ReactNode;
  /**
   * A BUTTON inside the field, at its end (clear the search, show the password): pass an
   * <IconButton size="sm" …/>. It has its own focus ring — the field's outline lights up only
   * while the text input itself has the focus, never because the button inside it does.
   */
  trailing?: ReactNode;
  /** use the mono font for codes, ids and addresses */
  mono?: boolean;
}

/**
 * Single-line text field. Inside <Field> it picks up the id, hint and error by itself.
 * `className` sets the width of the whole control (default: full width).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { prefix, suffix, trailing, mono = false, className, type = 'text', ...rest },
  ref,
) {
  const control = useFieldControl(rest);
  const shared = {
    ref,
    type,
    ...rest,
    id: control.id,
    'aria-describedby': control['aria-describedby'],
    'aria-invalid': control['aria-invalid'],
    'aria-required': rest.required ?? control.required,
  };

  if (!prefix && !suffix && !trailing) {
    return <input {...shared} className={cn(CONTROL_CLASS, 'h-10 px-3', mono && 'font-mono text-sm', className)} />;
  }

  // With an affix the wrapper carries the border and the focus ring. The ring follows the
  // INPUT's focus (`has-[input:focus-visible]`), not focus anywhere inside the wrapper.
  return (
    <div
      className={cn(
        'flex h-10 w-full min-w-0 items-center rounded border border-border-strong bg-surface transition-colors duration-100',
        'hover:border-fg-subtle has-[input:focus-visible]:border-ring has-[input:focus-visible]:outline has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-ring',
        control['aria-invalid'] ? 'border-danger' : null,
        rest.disabled ? 'bg-surface-2' : null,
        className,
      )}
    >
      {prefix ? (
        <span className="flex shrink-0 select-none items-center pl-3 text-sm text-fg-subtle">{prefix}</span>
      ) : null}
      <input
        {...shared}
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent px-3 text-base text-fg outline-none placeholder:text-fg-subtle',
          prefix ? 'pl-1.5' : null,
          suffix || trailing ? 'pr-1.5' : null,
          mono && 'font-mono text-sm',
        )}
      />
      {suffix ? (
        <span className={cn('flex shrink-0 select-none items-center text-sm text-fg-subtle', trailing ? 'pr-1' : 'pr-3')}>
          {suffix}
        </span>
      ) : null}
      {trailing ? <span className="flex shrink-0 items-center pr-1">{trailing}</span> : null}
    </div>
  );
});

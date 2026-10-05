import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { CONTROL_CLASS, useFieldControl } from './Field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
}

/** Multi-line text field. Give it `rows`; it can be resized vertically. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { mono = false, className, rows = 4, ...rest },
  ref,
) {
  const control = useFieldControl(rest);
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...rest}
      id={control.id}
      aria-describedby={control['aria-describedby']}
      aria-invalid={control['aria-invalid']}
      aria-required={rest.required ?? control.required}
      className={cn(CONTROL_CLASS, 'block resize-y px-3 py-2', mono && 'font-mono text-sm', className)}
    />
  );
});

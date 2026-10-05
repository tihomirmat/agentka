import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFieldControl } from './Field';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /** text next to the box; clicking it toggles the box */
  label?: ReactNode;
  description?: ReactNode;
}

/** A choice saved together with a form. Without `label`, give it an aria-label. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, ...rest },
  ref,
) {
  const control = useFieldControl(rest);
  const descId = description ? `${control.id}-desc` : undefined;
  const box = (
    <span className="relative inline-flex h-[18px] w-[18px] shrink-0">
      <input
        ref={ref}
        type="checkbox"
        {...rest}
        id={control.id}
        aria-describedby={descId ?? control['aria-describedby']}
        aria-invalid={control['aria-invalid']}
        className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-sm border border-border-strong bg-surface transition-colors duration-100 checked:border-accent checked:bg-accent hover:border-fg-subtle disabled:cursor-not-allowed disabled:opacity-55"
      />
      <Check
        size={14}
        strokeWidth={3}
        aria-hidden="true"
        className="pointer-events-none absolute left-[2px] top-[2px] text-accent-fg opacity-0 peer-checked:opacity-100"
      />
    </span>
  );

  if (!label) return <span className={cn('inline-flex', className)}>{box}</span>;

  return (
    <div className={cn('flex min-w-0 items-start gap-2.5', className)}>
      <span className="mt-[3px] inline-flex">{box}</span>
      <div className="min-w-0">
        <label htmlFor={control.id} className="cursor-pointer text-base text-fg">
          {label}
        </label>
        {description ? (
          <p id={descId} className="text-sm text-fg-subtle">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
});

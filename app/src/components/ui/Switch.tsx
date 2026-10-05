import { useId, type ReactNode } from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '@/lib/cn';
import { useFieldControl } from './Field';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  /** required when there is no visible label tied to the switch */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
}

/** On/off that takes effect at once. For a choice that is saved with a form, use Checkbox. */
export function Switch({ checked, onCheckedChange, disabled, className, ...rest }: SwitchProps) {
  const control = useFieldControl(rest);
  return (
    <RadixSwitch.Root
      id={control.id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={rest['aria-label']}
      aria-labelledby={rest['aria-labelledby']}
      aria-describedby={control['aria-describedby']}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-border-strong bg-surface-3 transition-colors duration-150',
        'data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-55',
        className,
      )}
    >
      <RadixSwitch.Thumb className="block h-4 w-4 translate-x-[3px] rounded-full bg-fg-subtle transition-transform duration-150 data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-accent-fg" />
    </RadixSwitch.Root>
  );
}

export interface SwitchRowProps extends Omit<SwitchProps, 'aria-label' | 'aria-labelledby'> {
  label: ReactNode;
  description?: ReactNode;
}

/** A setting line: name and explanation on the left, the switch on the right. */
export function SwitchRow({ label, description, className, id, ...rest }: SwitchRowProps) {
  const auto = useId();
  const switchId = id ?? `sw${auto}`;
  const descId = `${switchId}-desc`;
  return (
    <div className={cn('flex min-w-0 items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <label htmlFor={switchId} className="block cursor-pointer text-base font-medium text-fg">
          {label}
        </label>
        {description ? (
          <p id={descId} className="mt-0.5 text-sm text-fg-subtle">
            {description}
          </p>
        ) : null}
      </div>
      <Switch id={switchId} aria-describedby={description ? descId : undefined} {...rest} />
    </div>
  );
}

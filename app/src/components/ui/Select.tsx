import type { ReactNode } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CONTROL_CLASS, useFieldControl } from './Field';

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  /** quiet second line inside the list */
  description?: string;
  disabled?: boolean;
}

export interface SelectProps<V extends string = string> {
  value: V | undefined;
  onValueChange: (value: V) => void;
  options: SelectOption<V>[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** needed only when the select is not inside a <Field> */
  'aria-label'?: string;
  /**
   * Marks the select as wrong: it gets the same danger border as an <Input>. Inside <Field
   * error="…"> this happens by itself; pass it only where the message is written next to the
   * control without a Field (a row of working hours).
   */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** id of the element that says what is wrong (the message next to the control) */
  'aria-describedby'?: string;
  size?: 'sm' | 'md';
  /** class of the trigger (width etc.) */
  className?: string;
  /** shown before the chosen value, e.g. a status dot */
  leading?: ReactNode;
}

/**
 * Pick one of a short list. Inside <Field> it picks up the id, hint and error by itself.
 *
 *   <Select value={mode} onValueChange={setMode} options={[{ value: 'auto', label: 'Samodejna rezervacija' }]} />
 */
export function Select<V extends string = string>({
  value,
  onValueChange,
  options,
  placeholder = 'Izberite',
  disabled,
  size = 'md',
  className,
  leading,
  ...rest
}: SelectProps<V>) {
  const control = useFieldControl(rest);
  return (
    <RadixSelect.Root value={value} onValueChange={(v) => onValueChange(v as V)} disabled={disabled}>
      <RadixSelect.Trigger
        id={control.id}
        aria-label={rest['aria-label']}
        aria-describedby={control['aria-describedby']}
        aria-invalid={control['aria-invalid']}
        className={cn(
          CONTROL_CLASS,
          'inline-flex items-center justify-between gap-2 text-left data-[placeholder]:text-fg-subtle',
          size === 'sm' ? 'h-8 px-2.5 text-sm' : 'h-10 px-3',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {leading}
          <span className="truncate">
            <RadixSelect.Value placeholder={placeholder} />
          </span>
        </span>
        <RadixSelect.Icon className="shrink-0 text-fg-subtle">
          <ChevronDown size={16} aria-hidden="true" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          className="z-[60] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-content-available-width)] overflow-hidden rounded-lg border border-border bg-raised shadow-md motion-safe:animate-fade-in"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((o) => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                textValue={o.label}
                className="relative flex cursor-pointer select-none items-start gap-2 rounded py-2 pl-8 pr-3 text-base text-fg outline-none data-[disabled]:cursor-not-allowed data-[highlighted]:bg-raised-hover data-[disabled]:text-fg-subtle"
              >
                <span className="absolute left-2 top-2.5 inline-flex h-4 w-4 items-center justify-center text-accent">
                  <RadixSelect.ItemIndicator>
                    <Check size={16} aria-hidden="true" />
                  </RadixSelect.ItemIndicator>
                </span>
                <span className="min-w-0">
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                  {o.description ? (
                    <span className="block text-sm text-fg-subtle">{o.description}</span>
                  ) : null}
                </span>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

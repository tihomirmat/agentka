import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, useFieldControl, type InputProps } from '@/components/ui';

export type PasswordInputProps = Omit<InputProps, 'type' | 'prefix' | 'suffix' | 'mono'>;

/**
 * Password field with a "Pokaži" / "Skrij" toggle inside the field. Use it inside a
 * <Field>; the toggle points at the input through aria-controls. The button's name comes
 * from its text, not from aria-label, so the field stays the only control labelled "Geslo".
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  const control = useFieldControl(props);
  const Icon = visible ? EyeOff : Eye;
  return (
    <Input
      ref={ref}
      {...props}
      type={visible ? 'text' : 'password'}
      suffix={
        <button
          type="button"
          aria-controls={control.id}
          onClick={() => setVisible((v) => !v)}
          className="-mr-1.5 inline-flex h-7 items-center gap-1.5 rounded px-2 text-sm font-medium text-fg-muted transition-colors duration-100 hover:bg-surface-2 hover:text-fg"
        >
          <Icon size={16} aria-hidden="true" />
          <span aria-hidden="true">{visible ? 'Skrij' : 'Pokaži'}</span>
          <span className="sr-only">{visible ? 'Skrij geslo' : 'Pokaži geslo'}</span>
        </button>
      }
    />
  );
});

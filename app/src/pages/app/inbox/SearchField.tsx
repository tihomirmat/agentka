import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui';

export interface SearchFieldProps {
  /** what is searched, for screen readers: "Iskanje po pogovorih" */
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** width etc. of the whole field */
  className?: string;
}

/** Search box with a magnifier and its own "clear" button (the browser's one is not themed). */
export function SearchField({ label, placeholder, value, onChange, className }: SearchFieldProps) {
  return (
    <Input
      role="searchbox"
      aria-label={label}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      prefix={<Search size={16} aria-hidden="true" />}
      suffix={
        value ? (
          <button
            type="button"
            aria-label="Počisti iskanje"
            onClick={() => onChange('')}
            className="-mr-2 inline-flex h-7 w-7 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : undefined
      }
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
}

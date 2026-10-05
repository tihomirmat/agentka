import { Search, X } from 'lucide-react';
import { Input } from './Input';

export interface SearchFieldProps {
  /** what is searched, for screen readers: "Iskanje po pogovorih" */
  label: string;
  /**
   * Names the CONTENT that can be typed, never a verb: "Ime, tema ali povzetek",
   * "Naslov ali povezava strani" — not "Išči …" / "Poiščite …".
   */
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** width etc. of the whole field */
  className?: string;
}

/**
 * THE search box: magnifier, text, and its own "clear" button once something is typed
 * (the browser's own clear button is switched off globally, it is not themed).
 */
export function SearchField({ label, placeholder, value, onChange, className }: SearchFieldProps) {
  return (
    <Input
      type="search"
      role="searchbox"
      aria-label={label}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="search"
      prefix={<Search size={16} aria-hidden="true" />}
      trailing={
        value ? (
          <button
            type="button"
            aria-label="Počisti iskanje"
            onClick={() => onChange('')}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
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

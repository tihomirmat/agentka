import type { RefObject } from 'react';
import { Check, Copy, TextCursorInput } from 'lucide-react';
import { copyFallbackHint, useCopy } from '@/lib/useCopy';
import { Button, type ButtonSize, type ButtonVariant } from './Button';

export interface CopyButtonProps {
  /** the text that lands in the clipboard */
  text: string;
  label?: string;
  copiedLabel?: string;
  /**
   * Element that shows the same text. If the browser refuses clipboard access, this
   * element gets selected so the person can copy it by hand.
   */
  targetRef?: RefObject<HTMLElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Called ONLY when the clipboard really accepted the text. Tick "copied" checklists here. */
  onCopied?: () => void;
  /**
   * Called when the clipboard was refused and the text was only selected. Word it honestly,
   * e.g. with copyFallbackSentence({ object: 'Kodo', pronoun: 'jo' }) from '@/components/ui'.
   */
  onFallback?: () => void;
  className?: string;
}

/** The one way to copy something. Never call navigator.clipboard in a screen. */
export function CopyButton({
  text,
  label = 'Kopiraj',
  copiedLabel = 'Kopirano',
  targetRef,
  variant = 'secondary',
  size = 'sm',
  onCopied,
  onFallback,
  className,
}: CopyButtonProps) {
  const { copy, state } = useCopy();
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      icon={state === 'copied' ? Check : state === 'selected' ? TextCursorInput : Copy}
      onClick={() => {
        void copy(text, targetRef?.current).then((outcome) => {
          if (outcome === 'copied') onCopied?.();
          else onFallback?.();
        });
      }}
    >
      <span aria-live="polite">
        {state === 'copied' ? copiedLabel : state === 'selected' ? copyFallbackHint() : label}
      </span>
    </Button>
  );
}

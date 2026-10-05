import type { ReactElement, ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

/** Wrap the app once (done in App.tsx). */
export const TooltipProvider = RadixTooltip.Provider;

export interface TooltipProps {
  content: ReactNode;
  /** exactly one element that can take focus (button, link) */
  children: ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/** Short extra explanation on hover and keyboard focus. Never put needed information only here. */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-[70] max-w-[16rem] rounded bg-inverse px-2 py-1 text-xs font-medium text-inverse-fg shadow-md motion-safe:animate-fade-in"
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

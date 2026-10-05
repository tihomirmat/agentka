import type { ComponentPropsWithoutRef } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

/**
 *   <Tabs defaultValue="stran">
 *     <TabsList aria-label="Vrste virov">
 *       <TabsTrigger value="stran">Spletna stran</TabsTrigger>
 *       <TabsTrigger value="datoteke" count={2}>Datoteke</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="stran">…</TabsContent>
 *   </Tabs>
 */
export const Tabs = RadixTabs.Root;

/**
 * The row of tab names. On a wide screen: names on one line with the accent line under the
 * active one. On a phone (under 480px) the names become chips that WRAP onto more lines, so
 * nothing scrolls sideways, no name is hidden and no stray rule hangs under a wrapped row.
 */
export function TabsList({ className, ...rest }: ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn(
        'flex min-w-0 flex-wrap gap-x-5 border-b border-border max-[479px]:gap-2 max-[479px]:border-b-0',
        className,
      )}
      {...rest}
    />
  );
}

export interface TabsTriggerProps extends ComponentPropsWithoutRef<typeof RadixTabs.Trigger> {
  /** small number after the label */
  count?: number;
}

export function TabsTrigger({ className, children, count, ...rest }: TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        '-mb-px inline-flex h-10 max-w-full items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-0.5 text-base font-medium text-fg-muted transition-colors duration-100',
        'hover:text-fg data-[state=active]:border-accent data-[state=active]:text-fg',
        // phone: a chip instead of an underlined name
        'max-[479px]:mb-0 max-[479px]:rounded max-[479px]:border max-[479px]:border-b max-[479px]:border-border-strong max-[479px]:px-3 max-[479px]:text-sm',
        'max-[479px]:data-[state=active]:border-accent max-[479px]:data-[state=active]:bg-accent-soft max-[479px]:data-[state=active]:text-accent-soft-fg',
        className,
      )}
      {...rest}
    >
      {children}
      {count !== undefined ? (
        <span className="nums rounded-sm bg-surface-2 px-1.5 text-xs font-medium text-fg-muted">{count}</span>
      ) : null}
    </RadixTabs.Trigger>
  );
}

/**
 * One panel. An inactive panel is not rendered and takes NO space — also when the page gives
 * it a display class (`flex`, `grid`), which would otherwise beat the `hidden` attribute.
 */
export function TabsContent({ className, ...rest }: ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      className={cn('min-w-0 pt-5 focus-visible:outline-offset-4 data-[state=inactive]:hidden', className)}
      {...rest}
    />
  );
}

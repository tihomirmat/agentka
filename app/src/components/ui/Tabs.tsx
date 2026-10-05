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

export function TabsList({ className, ...rest }: ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return (
    <div className="relative min-w-0 overflow-x-auto border-b border-border">
      <RadixTabs.List className={cn('flex min-w-max gap-5', className)} {...rest} />
    </div>
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
        '-mb-px inline-flex h-10 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-0.5 text-base font-medium text-fg-muted transition-colors duration-100',
        'hover:text-fg data-[state=active]:border-accent data-[state=active]:text-fg',
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

export function TabsContent({ className, ...rest }: ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn('min-w-0 pt-5 focus-visible:outline-offset-4', className)} {...rest} />;
}

import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild><IconButton icon={Ellipsis} label="Več dejanj" /></DropdownMenuTrigger>
 *     <DropdownMenuContent align="end">
 *       <DropdownMenuItem icon={Pencil} onSelect={…}>Uredi</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem icon={Trash2} tone="danger" onSelect={…}>Odstrani</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */
export const DropdownMenu = RadixMenu.Root;
export const DropdownMenuTrigger = RadixMenu.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  collisionPadding = 8,
  ...rest
}: ComponentPropsWithoutRef<typeof RadixMenu.Content>) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-[60] min-w-[12rem] max-w-[var(--radix-dropdown-menu-content-available-width)] rounded-lg border border-border bg-raised p-1 shadow-md motion-safe:animate-fade-in',
          className,
        )}
        {...rest}
      />
    </RadixMenu.Portal>
  );
}

export interface DropdownMenuItemProps extends ComponentPropsWithoutRef<typeof RadixMenu.Item> {
  icon?: LucideIcon;
  tone?: 'default' | 'danger';
  children: ReactNode;
}

export function DropdownMenuItem({ icon: Icon, tone = 'default', className, children, ...rest }: DropdownMenuItemProps) {
  return (
    <RadixMenu.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2.5 rounded px-2.5 py-2 text-base outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-55',
        tone === 'danger'
          ? 'text-danger data-[highlighted]:bg-danger-soft'
          : 'text-fg data-[highlighted]:bg-raised-hover',
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon size={16} className="shrink-0" aria-hidden="true" /> : null}
      <span className="min-w-0 flex-1">{children}</span>
    </RadixMenu.Item>
  );
}

export function DropdownMenuLabel({ className, ...rest }: ComponentPropsWithoutRef<typeof RadixMenu.Label>) {
  return <RadixMenu.Label className={cn('px-2.5 py-1.5 text-sm text-fg-subtle', className)} {...rest} />;
}

export function DropdownMenuSeparator({ className, ...rest }: ComponentPropsWithoutRef<typeof RadixMenu.Separator>) {
  return <RadixMenu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...rest} />;
}

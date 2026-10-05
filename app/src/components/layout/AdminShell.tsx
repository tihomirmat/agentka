import { ArrowLeft, Building2, Package } from 'lucide-react';
import { Badge } from '@/components/ui';
import { SidebarShell, type NavItem } from './SidebarShell';
import { UserMenu } from './UserMenu';

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Uporabniški računi', icon: Building2, end: true, alsoActive: ['/admin/racuni'] },
  { to: '/admin/paketi', label: 'Paketi', icon: Package },
];

const ADMIN_NAV_SECONDARY: NavItem[] = [{ to: '/app/pregled', label: 'Nazaj v aplikacijo', icon: ArrowLeft }];

/**
 * Platform admin frame. Same structure as the customer app, but it says
 * "Skrbnik platforme" in two places and carries a warning-toned strip (readable in both
 * themes), so it is never mistaken for a customer's own view.
 */
export function AdminShell() {
  return (
    <SidebarShell
      navLabel="Skrbniški meni"
      nav={ADMIN_NAV}
      navSecondary={ADMIN_NAV_SECONDARY}
      logoTo="/admin"
      logoAside={<Badge tone="warning">Skrbnik</Badge>}
      topBar={<span className="truncate text-base font-semibold text-fg">Skrbnik platforme</span>}
      notice={
        <div className="shrink-0 border-b border-border bg-warning-soft text-xs font-medium text-fg">
          <div className="page py-1.5">
            Skrbniški pogled: vidite številke vseh uporabniških računov, ne pa pogovorov in podatkov obiskovalcev. Stranke
            tega dela ne vidijo.
          </div>
        </div>
      }
      sidebarFooter={<UserMenu area="admin" />}
    />
  );
}

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenText,
  CalendarCheck,
  CalendarClock,
  Code,
  CreditCard,
  LayoutDashboard,
  Mail,
  MessagesSquare,
  Settings,
  TriangleAlert,
  Users,
  Info,
} from 'lucide-react';
import { getAccount, getAgent, useQuery, useSession } from '@/data/api';
import { dayDiff, formatMinutesOf, plural } from '@/data/format';
import { AGENT_STATUS, WIZARD_STEPS } from '@/data/labels';
import { cn } from '@/lib/cn';
import { ProgressBar, Skeleton, StatusPill } from '@/components/ui';
import { SidebarShell, type NavItem } from './SidebarShell';
import { UserMenu } from './UserMenu';

/** The ten sections of the customer app, in the order of the spec. */
export const APP_NAV: NavItem[] = [
  { to: '/app/pregled', label: 'Pregled', icon: LayoutDashboard },
  { to: '/app/viri', label: 'Viri znanja', icon: BookOpenText },
  { to: '/app/termini', label: 'Termini', icon: CalendarClock },
  { to: '/app/obvestila', label: 'Obvestila', icon: Mail },
  { to: '/app/pogovori', label: 'Pogovori', icon: MessagesSquare },
  { to: '/app/kontakti', label: 'Kontakti', icon: Users },
  { to: '/app/rezervacije', label: 'Rezervacije', icon: CalendarCheck },
  { to: '/app/namestitev', label: 'Namestitev', icon: Code },
  { to: '/app/narocnina', label: 'Naročnina', icon: CreditCard },
  { to: '/app/nastavitve', label: 'Nastavitve', icon: Settings },
];

function Notice({ tone, children, action }: { tone: 'info' | 'danger'; children: ReactNode; action: ReactNode }) {
  const Icon = tone === 'danger' ? TriangleAlert : Info;
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('shrink-0 border-b border-border text-sm text-fg', tone === 'danger' ? 'bg-danger-soft' : 'bg-info-soft')}
    >
      <div className="page flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <Icon size={16} className={cn('shrink-0', tone === 'danger' ? 'text-danger' : 'text-info')} aria-hidden="true" />
        <span className="min-w-0 flex-1 basis-56">{children}</span>
        {action}
      </div>
    </div>
  );
}

const NOTICE_LINK = 'shrink-0 rounded font-semibold text-fg underline underline-offset-2 hover:no-underline';

/** Customer app frame: sidebar, top bar with the business and agent status, page area. */
export function AppShell() {
  const session = useSession();
  const account = useQuery(getAccount, [session.accountId]);
  const agent = useQuery(getAgent, [session.accountId]);

  const a = account.data;
  const status = agent.data ? AGENT_STATUS[agent.data.status] : null;

  let notice: ReactNode = null;
  if (a?.status === 'past_due') {
    notice = (
      <Notice tone="danger" action={<Link className={NOTICE_LINK} to="/app/narocnina">Uredi plačilo</Link>}>
        Zadnje plačilo ni uspelo, zato je agent začasno ustavljen.
      </Notice>
    );
  } else if (a?.status === 'paused_limit') {
    notice = (
      <Notice tone="danger" action={<Link className={NOTICE_LINK} to="/app/narocnina">Izberi večji paket</Link>}>
        Vključene minute so porabljene, zato je agent začasno ustavljen.
      </Notice>
    );
  } else if (session.onboardingStep !== 'done') {
    const step = WIZARD_STEPS.find((s) => s.step === session.onboardingStep);
    notice = (
      <Notice
        tone="info"
        action={<Link className={NOTICE_LINK} to={`/zacetek/${session.onboardingStep}`}>Nadaljuj nastavitev</Link>}
      >
        Nastavitev še ni končana. Naslednji korak: {step?.label ?? 'Spletna stran'}.
      </Notice>
    );
  }

  const trialDays = a?.status === 'trial' && a.trial_ends_at ? Math.max(0, dayDiff(a.trial_ends_at)) : null;

  return (
    <SidebarShell
      navLabel="Glavni meni"
      nav={APP_NAV}
      logoTo="/app/pregled"
      notice={notice}
      topBar={
        a ? (
          <>
            <span className="truncate text-base font-semibold text-fg">{a.name}</span>
            {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
          </>
        ) : (
          <Skeleton className="h-4 w-32" />
        )
      }
      sidebarFooter={
        <>
          <Link
            to="/app/narocnina"
            className="mb-1 block rounded px-2 py-2 transition-colors duration-100 hover:bg-surface-2"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-fg-muted">Minute v tem obdobju</span>
              <span className="nums text-xs text-fg">{a ? formatMinutesOf(a.minutes_used, a.minutes_included) : '…'}</span>
            </span>
            <ProgressBar
              className="mt-1.5"
              size="sm"
              label="Porabljene minute v tem obdobju"
              value={a?.minutes_used ?? 0}
              max={a?.minutes_included ?? 1}
            />
            {trialDays !== null ? (
              <span className="mt-1.5 block text-xs text-fg-subtle">
                Brezplačni preizkus, še {plural(trialDays, ['dan', 'dneva', 'dni', 'dni'])}
              </span>
            ) : null}
          </Link>
          <UserMenu area="app" />
        </>
      }
    />
  );
}

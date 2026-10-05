import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Users,
} from 'lucide-react';
import { getAccount, getAgent, getAgentReadiness, useQuery, useSession } from '@/data/api';
import { dayDiff, formatDaysLeft, formatMinutesOf } from '@/data/format';
import { AGENT_STATUS, AGENT_STATUS_HELP, agentStatusText, pausedByHelp, TRIAL, WIZARD_STEPS } from '@/data/labels';
import { cn } from '@/lib/cn';
import { ProgressBar, Skeleton, StatusPill, Tooltip } from '@/components/ui';
import { NOTICE_BOX, NOTICE_ICON, NOTICE_ICON_COLOR, type NoticeTone } from '@/components/ui/Notice';
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

/**
 * THE SHELL STRIP — one line between the top bar and the page, at most ONE at a time.
 *
 * States the shell covers, by priority (pages must NOT repeat them in their own content):
 *   1. payment failed          → "Uredi plačilo"        (Naročnina)
 *   2. minutes used up         → "Izberi večji paket"   (Naročnina)
 *   3. setup wizard unfinished → "Nadaljuj nastavitev"  (the wizard)
 *   4. setup finished, but the agent is still a draft → what is missing, or "Vklopi agenta"
 *
 * A strip is hidden on the page that resolves its state, because that page shows the full
 * notice or checklist itself: 1 and 2 on Naročnina, 3 on Pregled (the "Kaj še manjka"
 * checklist), 4 on the page its action leads to and on Pregled. So every state is said once
 * per screen — by the shell everywhere, by the owning page in its own place.
 */
interface Strip {
  tone: NoticeTone;
  text: string;
  action: { label: string; to: string };
  /** paths on which the page itself carries this message */
  hideOn: string[];
}

function ShellStrip({ strip }: { strip: Strip }) {
  const Icon = NOTICE_ICON[strip.tone];
  return (
    <div
      role={strip.tone === 'danger' ? 'alert' : 'status'}
      className={cn('shrink-0 border-b text-sm text-fg', NOTICE_BOX[strip.tone])}
    >
      <div className="page flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <Icon size={16} className={cn('shrink-0', NOTICE_ICON_COLOR[strip.tone])} aria-hidden="true" />
        <span className="min-w-0 flex-1 basis-56">{strip.text}</span>
        <Link
          className="tap shrink-0 rounded font-semibold text-fg underline underline-offset-2 hover:no-underline"
          to={strip.action.to}
        >
          {strip.action.label}
        </Link>
      </div>
    </div>
  );
}

/** Customer app frame: sidebar, top bar with the business and agent status, page area. */
export function AppShell() {
  const session = useSession();
  const { pathname } = useLocation();
  const account = useQuery(getAccount, [session.accountId]);
  const agent = useQuery(getAgent, [session.accountId]);
  const readiness = useQuery(getAgentReadiness, [session.accountId]);

  const a = account.data;
  const ag = agent.data;
  const status = ag ? AGENT_STATUS[ag.status] : null;

  let strip: Strip | null = null;
  if (a?.status === 'past_due') {
    strip = {
      tone: 'danger',
      text: 'Zadnje plačilo ni uspelo, zato je agent začasno ustavljen.',
      action: { label: 'Uredi plačilo', to: '/app/narocnina' },
      hideOn: ['/app/narocnina'],
    };
  } else if (a?.status === 'paused_limit') {
    strip = {
      tone: 'danger',
      text: 'Vključene minute so porabljene, zato je agent začasno ustavljen.',
      action: { label: 'Izberi večji paket', to: '/app/narocnina' },
      hideOn: ['/app/narocnina'],
    };
  } else if (session.onboardingStep !== 'done') {
    const step = WIZARD_STEPS.find((s) => s.step === session.onboardingStep);
    strip = {
      tone: 'info',
      text: `Nastavitev še ni končana. Naslednji korak: ${step?.label ?? 'Spletna stran'}.`,
      action: { label: 'Nadaljuj nastavitev', to: `/zacetek/${session.onboardingStep}` },
      hideOn: ['/app/pregled'],
    };
  } else if (ag?.status === 'draft' && readiness.data) {
    const missing = readiness.data.missing[0];
    strip = missing
      ? {
          tone: 'info',
          text: 'Agent je še osnutek: nima še nobenega vključenega vira znanja, zato ga obiskovalci ne vidijo.',
          action: missing.action,
          // Viri and Nastavitve carry the reason and the action themselves.
          hideOn: ['/app/pregled', '/app/viri', '/app/nastavitve', missing.action.to],
        }
      : {
          tone: 'info',
          text: 'Agent je pripravljen, a še ni vklopljen, zato ga obiskovalci ne vidijo.',
          action: { label: 'Vklopi agenta v Nastavitvah', to: '/app/nastavitve' },
          hideOn: ['/app/pregled', '/app/nastavitve'],
        };
  }
  const notice: ReactNode = strip && !strip.hideOn.includes(pathname) ? <ShellStrip strip={strip} /> : null;

  const trialDays = a?.status === 'trial' && a.trial_ends_at ? Math.max(0, dayDiff(a.trial_ends_at)) : null;
  // The tooltip and the accessible name of the pill exist on EVERY page, Nastavitve included, where
  // the customer's own pause must not send the person "v Nastavitvah" (pausedByHelp).
  const statusHelp = ag
    ? ag.status === 'paused' && ag.paused_by
      ? `${AGENT_STATUS_HELP.paused} ${pausedByHelp(ag.paused_by, pathname === '/app/nastavitve' ? 'settings' : undefined)}`
      : AGENT_STATUS_HELP[ag.status]
    : '';

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
            {ag && status ? (
              // The pill says WHAT is active ("Agent: aktiven"); the tooltip says what that
              // means for visitors; the click leads to where the agent is switched on and off.
              <Tooltip content={statusHelp} side="bottom">
                <Link to="/app/nastavitve" className="shrink-0 rounded-full" aria-label={`${agentStatusText(ag.status)}. ${statusHelp}`}>
                  <StatusPill tone={status.tone}>
                    <span className="sm:hidden">{status.label}</span>
                    <span className="hidden sm:inline">{agentStatusText(ag.status)}</span>
                  </StatusPill>
                </Link>
              </Tooltip>
            ) : null}
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
                {TRIAL.name}, {formatDaysLeft(trialDays)}
              </span>
            ) : null}
          </Link>
          <UserMenu area="app" />
        </>
      }
    />
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, LogOut, RotateCcw, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { logout, resetSampleData, useSession } from '@/data/api';
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useToast,
} from '@/components/ui';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

/** Name of the signed-in person with the account menu. Lives at the bottom of the sidebar. */
export function UserMenu({ area }: { area: 'app' | 'admin' }) {
  const session = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full min-w-0 items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors duration-100 hover:bg-surface-2 data-[state=open]:bg-surface-2">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold text-fg-muted"
          >
            {initials(session.userName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-fg">{session.userName}</span>
            <span className="block truncate text-xs text-fg-subtle">{session.email}</span>
          </span>
          <ChevronsUpDown size={14} className="shrink-0 text-fg-subtle" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="min-w-[16rem]">
          <DropdownMenuLabel className="truncate">{session.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {session.role === 'admin' && area === 'app' ? (
            <DropdownMenuItem icon={ShieldCheck} onSelect={() => navigate('/admin')}>
              Skrbniški pogled
            </DropdownMenuItem>
          ) : null}
          {area === 'admin' ? (
            <DropdownMenuItem icon={LayoutDashboard} onSelect={() => navigate('/app/pregled')}>
              Nazaj v aplikacijo
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem icon={RotateCcw} onSelect={() => setConfirmReset(true)}>
            Ponastavi vzorčne podatke
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            icon={LogOut}
            onSelect={() => {
              void logout().then(() => navigate('/'));
            }}
          >
            Odjava
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Ponastavim vzorčne podatke?"
        description="Vse spremembe, ki ste jih naredili v tem predogledu, bodo izgubljene in prikazali se bodo začetni vzorčni podatki. Prijavljeni ostanete. Tega ni mogoče razveljaviti."
        confirmLabel="Ponastavi podatke"
        onConfirm={async () => {
          const result = await resetSampleData();
          toast.success(result.message);
        }}
      />
    </>
  );
}

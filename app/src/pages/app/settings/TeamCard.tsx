import { useState, type FormEvent, type ReactNode } from 'react';
import { CircleAlert, Trash2, UserPlus, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  CopyValue,
  EmptyState,
  Field,
  Input,
  Select,
  SkeletonRows,
  StatusPill,
  Tooltip,
  useToast,
} from '@/components/ui';
import * as api from '@/data/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_LABEL: Record<api.AccountRole, string> = { owner: 'Lastnik', member: 'Član' };

export interface TeamCardProps {
  accountName: string;
  team: api.User[] | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function TeamList({ children }: { children: ReactNode }) {
  return (
    <ul aria-label="Člani ekipe" className="m-0 list-none p-0">
      {children}
    </ul>
  );
}

export function TeamCard({ accountName, team, loading, error, onRetry }: TeamCardProps) {
  const toast = useToast();
  const invite = api.useAction(api.inviteMember);
  const remove = api.useAction(api.removeMember, { onError: (m) => toast.error(m) });
  const [email, setEmail] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [removing, setRemoving] = useState<api.User | null>(null);

  const emailError = EMAIL_RE.test(email.trim()) ? undefined : 'E-naslov ni pravilno zapisan. Primer: ime@podjetje.si';

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (emailError) return;
    const result = await invite.run(email.trim());
    if (!result) return;
    setEmail('');
    setAttempted(false);
    if (result.simulated) toast.info(result.message);
    else toast.success(result.message);
  }

  return (
    <Card>
      <CardHeader title="Ekipa" description="Osebe, ki imajo dostop do tega uporabniškega računa." divider />
      {loading ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <EmptyState icon={CircleAlert} title={error} action={<Button onClick={onRetry}>Poskusi znova</Button>} />
      ) : team?.length === 0 ? (
        <EmptyState icon={Users} title="V tem uporabniškem računu ni nobene osebe. Povabite prvega člana spodaj." />
      ) : (
        <TeamList>
          {team?.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3 last:border-b-0 sm:px-5"
            >
              <div className="min-w-0 flex-1 basis-44">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium text-fg">{user.name}</span>
                  <Badge tone={user.account_role === 'owner' ? 'accent' : 'neutral'}>
                    {ROLE_LABEL[user.account_role]}
                  </Badge>
                  {user.status === 'invited' ? <StatusPill tone="info">Vabilo čaka</StatusPill> : null}
                </div>
                <CopyValue
                  value={user.email}
                  copyLabel={`Kopiraj e-naslov (${user.name})`}
                  className="text-fg-muted"
                />
              </div>
              {user.account_role === 'owner' ? (
                <Tooltip content="Lastnika uporabniškega računa ni mogoče odstraniti.">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    aria-disabled="true"
                    aria-label={`Odstrani osebo ${user.name} (ni mogoče: lastnik uporabniškega računa)`}
                    onClick={(e) => e.preventDefault()}
                  >
                    Odstrani
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  aria-label={`Odstrani osebo ${user.name}`}
                  onClick={() => setRemoving(user)}
                >
                  Odstrani
                </Button>
              )}
            </li>
          ))}
        </TeamList>
      )}

      <form onSubmit={onInvite} noValidate className="border-t border-border px-4 py-4 sm:px-5 sm:py-5">
        <p className="mb-3 text-base font-medium text-fg">Povabi člana</p>
        <div className="grid min-w-0 items-start gap-x-4 gap-y-4 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <Field label="E-naslov osebe" error={attempted ? emailError : invite.error ?? undefined}>
            <Input
              type="email"
              value={email}
              placeholder="ime@podjetje.si"
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Vloga">
            <Select
              value="member"
              onValueChange={() => undefined}
              options={[
                { value: 'member', label: ROLE_LABEL.member },
                { value: 'owner', label: ROLE_LABEL.owner, description: 'Ni na voljo pri vabilu.', disabled: true },
              ]}
            />
          </Field>
          <div className="md:pt-[26px]">
            <Button type="submit" icon={UserPlus} loading={invite.pending}>
              Povabi člana
            </Button>
          </div>
        </div>
      </form>

      {removing ? (
        <ConfirmDialog
          open
          tone="danger"
          onOpenChange={(open) => {
            if (!open) setRemoving(null);
          }}
          title={`Odstranim osebo »${removing.name}«?`}
          description={`Oseba ne bo imela več dostopa do uporabniškega računa »${accountName}«. Povabite jo lahko znova.`}
          confirmLabel="Odstrani osebo"
          onConfirm={async () => {
            const result = await remove.run(removing.id);
            if (!result) return;
            if (result.simulated) toast.info(result.message);
            else toast.success(result.message);
          }}
        />
      ) : null}
    </Card>
  );
}

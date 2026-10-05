import { useState } from 'react';
import { CircleAlert, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import * as api from '@/data/api';
import { formatRelativeDateTime } from '@/data/format';
import { SOURCE_STATUS } from '@/data/labels';
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Dialog,
  EmptyState,
  Field,
  Input,
  Notice,
  SkeletonRows,
  StatusPill,
  Textarea,
  useToast,
} from '@/components/ui';
import { chars, firstLine } from './helpers';

interface TextTabProps {
  texts: api.KnowledgeSource[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

type DialogRequest =
  | { mode: 'add'; title: string }
  | { mode: 'edit'; source: api.KnowledgeSource };
type DialogState = (DialogRequest & { key: number }) | null;

/** "Besedilo" tab: titled free-text entries (the price list and facts that are not on the website). */
export function TextTab({ texts, loading, error, reload }: TextTabProps) {
  const toast = useToast();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [removing, setRemoving] = useState<api.KnowledgeSource | null>(null);
  const [opened, setOpened] = useState(0);
  const remove = api.useAction(api.removeSource, { onError: toast.error });

  function open(request: DialogRequest) {
    setOpened((n) => n + 1);
    setDialog({ ...request, key: opened + 1 });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="Besedila"
          description="Podatki, ki jih ni na vaši spletni strani. Agent jih uporablja kot vsak drug vir."
          action={
            <Button variant="primary" icon={Plus} onClick={() => open({ mode: 'add', title: '' })}>
              Dodaj besedilo
            </Button>
          }
          divider
        />
        {loading ? (
          <SkeletonRows rows={3} />
        ) : error && texts.length === 0 ? (
          <EmptyState
            icon={CircleAlert}
            title={error}
            action={<Button onClick={reload}>Poskusi znova</Button>}
          />
        ) : texts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Začnite s cenikom: agent ne sme navajati cen, ki jih tu ne zapišete."
            action={
              <Button icon={Plus} onClick={() => open({ mode: 'add', title: 'Cenik' })}>
                Dodaj cenik
              </Button>
            }
          />
        ) : (
          <ul>
            {texts.map((t) => {
              const status = SOURCE_STATUS[t.status];
              return (
                <li
                  key={t.id}
                  className="flex min-w-0 flex-wrap items-start gap-x-4 gap-y-2 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5"
                >
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="break-words text-base font-medium text-fg">{t.title}</p>
                    <p className="mt-0.5 truncate text-sm text-fg-muted">
                      {firstLine(t.content) || 'Besedilo je prazno.'}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-fg-subtle">
                      <span className="nums">{chars(t.chars)}</span>
                      {t.last_synced_at ? <span>Shranjeno {formatRelativeDateTime(t.last_synced_at)}</span> : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill tone={status.tone} live={t.status === 'pending'}>
                      {status.label}
                    </StatusPill>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Pencil}
                      aria-label={`Uredi besedilo »${t.title}«`}
                      onClick={() => open({ mode: 'edit', source: t })}
                    >
                      Uredi
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      aria-label={`Odstrani besedilo »${t.title}«`}
                      onClick={() => setRemoving(t)}
                    >
                      Odstrani
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {dialog ? (
        <TextDialog
          key={dialog.key}
          state={dialog}
          onClose={() => setDialog(null)}
          onDone={(message) => {
            setDialog(null);
            toast.success(message);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => {
          if (!o) setRemoving(null);
        }}
        tone="danger"
        title={`Odstranim besedilo »${removing?.title ?? ''}«?`}
        description="Agent tega besedila ne bo več uporabljal. Dejanja ni mogoče razveljaviti."
        confirmLabel="Odstrani besedilo"
        onConfirm={async () => {
          if (!removing) return;
          // The row disappears from the list: a toast says it, nothing else.
          const r = await remove.run(removing.id);
          if (r) toast.success(r.message);
        }}
      />
    </div>
  );
}

function TextDialog({
  state,
  onClose,
  onDone,
}: {
  state: Exclude<DialogState, null>;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const editing = state.mode === 'edit' ? state.source : null;
  const initialTitle = editing ? editing.title : state.mode === 'add' ? state.title : '';
  const initialContent = editing?.content ?? '';

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tried, setTried] = useState(false);

  const add = api.useAction(api.addTextSource);
  const update = api.useAction(api.updateTextSource);
  const pending = add.pending || update.pending;
  const serverError = add.error ?? update.error;

  const titleError = tried && !title.trim() ? 'Vpišite naslov besedila, na primer Cenik.' : undefined;
  const contentError =
    tried && !content.trim() ? 'Vpišite besedilo, ki naj ga agent pozna.' : undefined;
  const changed = title !== initialTitle || content !== initialContent;

  async function submit() {
    setTried(true);
    if (!title.trim() || !content.trim()) return;
    const saved = editing
      ? await update.run(editing.id, { title, content })
      : await add.run({ title, content });
    if (saved) {
      onDone(
        editing
          ? `Besedilo »${saved.title}« je shranjeno.`
          : `Besedilo »${saved.title}« je dodano. Agent ga uporablja kot vir znanja.`,
      );
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !pending) onClose();
      }}
      size="lg"
      title={editing ? 'Uredi besedilo' : 'Dodaj besedilo'}
      description="Besedilo, ki ga ni na vaši spletni strani, na primer cenik ali delovni čas."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Prekliči
          </Button>
          <Button
            variant="primary"
            loading={pending}
            disabled={editing ? !changed : false}
            onClick={() => void submit()}
          >
            {editing ? 'Shrani spremembe' : 'Dodaj besedilo'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Naslov" error={titleError}>
          <Input
            placeholder="Cenik"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={!editing}
          />
        </Field>
        <Field
          label="Besedilo"
          error={contentError}
          hint="Pišite jasno, tako kot bi povedali stranki: vsako storitev v svojo vrstico, zraven cena."
        >
          <Textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
        </Field>
        <p className="nums -mt-2 text-right text-sm text-fg-subtle" aria-live="polite">
          {chars(content.length)}
        </p>
        {serverError ? (
          <Notice size="sm" tone="danger">
            {serverError}
          </Notice>
        ) : null}
      </div>
    </Dialog>
  );
}

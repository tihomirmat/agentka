import { useRef, useState, type DragEvent } from 'react';
import { CircleAlert, FileText, Trash2, Upload, UploadCloud } from 'lucide-react';
import * as api from '@/data/api';
import { formatRelativeDateTime, plural } from '@/data/format';
import { SOURCE_STATUS } from '@/data/labels';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  SkeletonRows,
  StatusPill,
  useToast,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { chars, fileKind } from './helpers';

interface FilesTabProps {
  files: api.KnowledgeSource[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** "Datoteke" tab: upload area (stage 1 registers only the name) and the list of files. */
export function FilesTab({ files, loading, error, reload }: FilesTabProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [removing, setRemoving] = useState<api.KnowledgeSource | null>(null);

  const remove = api.useAction(api.removeSource, { onError: toast.error });

  async function addFiles(list: FileList | File[] | null) {
    const items = list ? Array.from(list) : [];
    if (items.length === 0) return;
    setProblems([]);
    setAdding(true);
    const added: string[] = [];
    const failed: string[] = [];
    for (const file of items) {
      try {
        await api.addFileSource(file.name, file.size);
        added.push(file.name);
      } catch (e) {
        const reason = e instanceof Error && e.message ? e.message : 'Datoteke ni bilo mogoče dodati.';
        failed.push(`»${file.name}«: ${reason}`);
      }
    }
    setAdding(false);
    setProblems(failed);
    if (added.length === 1) {
      toast.success(`Datoteka »${added[0]}« je dodana na seznam. Vsebina v predogledu ni naložena.`);
    } else if (added.length > 1) {
      toast.success(
        `${plural(added.length, ['datoteka je dodana', 'datoteki sta dodani', 'datoteke so dodane', 'datotek je dodanih'])} na seznam. Vsebina v predogledu ni naložena.`,
      );
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    void addFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="Datoteke"
          description="Dokumenti, ki jih ni na vaši spletni strani, na primer cenik ali predstavitev."
        />
        <CardBody className="flex flex-col gap-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex min-w-0 flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center transition-colors duration-100',
              dragging ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface-2',
            )}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-fg-muted">
              <UploadCloud size={20} aria-hidden="true" />
            </span>
            <div className="max-w-md">
              <p className="text-base font-medium text-fg">
                {files.length === 0 ? 'Dodajte prvo datoteko' : 'Dodajte še eno datoteko'}
              </p>
              <p className="mt-0.5 text-sm text-fg-muted">
                Povlecite jo sem ali jo izberite. Podprte so datoteke PDF, DOCX in TXT.
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              onChange={(e) => void addFiles(e.target.files)}
            />
            <Button
              variant="primary"
              icon={Upload}
              loading={adding}
              onClick={() => inputRef.current?.click()}
            >
              Izberite datoteko
            </Button>
            <p className="max-w-md text-sm text-fg-subtle">
              V tem predogledu se vsebina datoteke ne naloži: zabeleži se samo njeno ime.
            </p>
          </div>

          {problems.length > 0 ? (
            <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
              <ul className="flex flex-col gap-1">
                {problems.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                    <span className="min-w-0 break-words">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardBody>

        {loading ? (
          <div className="border-t border-border">
            <SkeletonRows rows={2} />
          </div>
        ) : error && files.length === 0 ? (
          <div className="border-t border-border">
            <EmptyState
              compact
              icon={CircleAlert}
              title={error}
              action={<Button onClick={reload}>Poskusi znova</Button>}
            />
          </div>
        ) : files.length > 0 ? (
          <ul className="border-t border-border">
            {files.map((f) => {
              const status = SOURCE_STATUS[f.status];
              return (
                <li
                  key={f.id}
                  className="flex min-w-0 flex-wrap items-start gap-x-4 gap-y-2 border-b border-border px-4 py-3 last:border-b-0 sm:px-5"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-2 text-fg-muted">
                    <FileText size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="break-words text-base font-medium text-fg">{f.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-fg-subtle">
                      <Badge tone="info">{fileKind(f)}</Badge>
                      <span className="nums">{chars(f.chars)}</span>
                      {f.last_synced_at ? <span>Dodano {formatRelativeDateTime(f.last_synced_at)}</span> : null}
                    </p>
                    {f.status === 'error' ? (
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-danger">
                        <CircleAlert size={14} className="mt-[3px] shrink-0" aria-hidden="true" />
                        <span>
                          {f.error ?? 'Datoteke ni bilo mogoče prebrati.'} Odstranite jo in dodajte popravljeno
                          datoteko.
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill tone={status.tone} live={f.status === 'pending'}>
                      {status.label}
                    </StatusPill>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      aria-label={`Odstrani datoteko »${f.title}«`}
                      onClick={() => setRemoving(f)}
                    >
                      Odstrani
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Card>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        tone="danger"
        title={`Odstranim datoteko »${removing?.title ?? ''}«?`}
        description="Agent te datoteke ne bo več uporabljal. Dejanja ni mogoče razveljaviti."
        confirmLabel="Odstrani datoteko"
        onConfirm={async () => {
          if (!removing) return;
          const r = await remove.run(removing.id);
          if (r) {
            if (r.simulated) toast.info(r.message);
            else toast.success(r.message);
          }
        }}
      />
    </div>
  );
}

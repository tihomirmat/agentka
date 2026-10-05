import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { previewAgentReply } from '@/data/api';
import { cn } from '@/lib/cn';
import { Waveform } from '@/components/ui';

export interface AgentWidgetProps {
  agentName: string;
  businessName: string;
  /** the greeting the agent opens with */
  firstMessage: string;
  /** show the text field (agent.widget_text_input) */
  textInput?: boolean;
  /**
   * The customer's widget colour (agent.widget_accent_color). It is THEIR colour, painted
   * on THEIR website, so it is the one place a hex value from data reaches the screen.
   * Without it the widget uses our accent.
   */
  accentHex?: string;
  /** called with every question the person sends (for the landing demo / wizard) */
  onAsk?: (question: string) => void;
  className?: string;
}

interface Turn {
  id: number;
  role: 'agent' | 'visitor';
  text: string;
}

/**
 * Preview of the widget a visitor sees on the customer's website: used on Pregled,
 * in wizard step 5 and as the demo on the landing page.
 *
 * Stage 1 has no voice and no real agent. Replies are canned sentences from
 * api.previewAgentReply, and the widget says so at the bottom.
 */
export function AgentWidget({
  agentName,
  businessName,
  firstMessage,
  textInput = true,
  accentHex,
  onAsk,
  className,
}: AgentWidgetProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const inputId = useId();

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, speaking]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question || speaking) return;
    setDraft('');
    setTurns((t) => [...t, { id: nextId.current++, role: 'visitor', text: question }]);
    onAsk?.(question);
    setSpeaking(true);
    try {
      const reply = await previewAgentReply(question);
      if (!alive.current) return;
      setTurns((t) => [...t, { id: nextId.current++, role: 'agent', text: reply.text }]);
    } catch {
      if (!alive.current) return;
      setTurns((t) => [
        ...t,
        { id: nextId.current++, role: 'agent', text: 'Odgovora ni bilo mogoče pripraviti. Poskusite znova.' },
      ]);
    } finally {
      if (alive.current) setSpeaking(false);
    }
  }

  const brandStyle: CSSProperties | undefined = accentHex ? { background: accentHex } : undefined;
  const onBrand = accentHex ? 'text-widget-fg' : 'bg-accent text-accent-fg';

  return (
    <section
      aria-label={`Predogled pomočnika ${agentName}`}
      className={cn(
        'flex h-[30rem] max-h-full w-full max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-md',
        className,
      )}
    >
      <header className={cn('flex shrink-0 items-center gap-3 px-4 py-3', onBrand)} style={brandStyle}>
        <Waveform bars={5} size={18} animated={speaking} />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{agentName}</p>
          <p className="truncate text-xs opacity-90">AI pomočnik · {businessName}</p>
        </div>
      </header>

      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4" aria-live="polite">
        <Bubble role="agent">{firstMessage}</Bubble>
        {turns.map((t) => (
          <Bubble key={t.id} role={t.role}>
            {t.text}
          </Bubble>
        ))}
        {speaking ? (
          <div className="flex items-center gap-2 text-sm text-fg-subtle">
            <Waveform bars={5} size={14} animated className="text-fg-subtle" />
            {agentName} odgovarja
          </div>
        ) : null}
      </div>

      {textInput ? (
        <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2.5">
          <label className="sr-only" htmlFor={inputId}>
            Vprašanje za pomočnika
          </label>
          <input
            id={inputId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Vpišite vprašanje"
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded border border-border-strong bg-surface px-3 text-base text-fg placeholder:text-fg-subtle focus-visible:border-ring focus-visible:outline-offset-0"
          />
          <button
            type="submit"
            aria-label="Pošlji vprašanje"
            disabled={!draft.trim() || speaking}
            className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded disabled:opacity-55', onBrand)}
            style={brandStyle}
          >
            <SendHorizontal size={18} aria-hidden="true" />
          </button>
        </form>
      ) : null}
      <p className="shrink-0 border-t border-border bg-surface-2 px-4 py-1.5 text-xs text-fg-muted">
        Predogled: odgovori so vzorčni, glas še ni povezan.
      </p>
    </section>
  );
}

function Bubble({ role, children }: { role: 'agent' | 'visitor'; children: string }) {
  return (
    <p
      className={cn(
        'max-w-[85%] rounded-lg px-3 py-2 text-base',
        role === 'agent' ? 'self-start bg-surface-2 text-fg' : 'self-end bg-accent-soft text-accent-soft-fg',
      )}
    >
      <span className="sr-only">{role === 'agent' ? 'Pomočnik: ' : 'Vi: '}</span>
      {children}
    </p>
  );
}

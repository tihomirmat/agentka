import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { SendHorizontal } from 'lucide-react';
import { assistantNoun, demoAgentReply, previewAgentReply, type DemoState } from '@/data/api';
import { cn } from '@/lib/cn';
import { Waveform } from '@/components/ui';

/** The one honest line under every widget preview. Do not reword it in a page. */
export const WIDGET_PREVIEW_NOTE =
  'Predogled: besedilni pogovor z vzorčnimi odgovori. Glas se vklopi, ko bo agent povezan.';

export interface AgentWidgetProps {
  agentName: string;
  businessName: string;
  /**
   * The chosen voice (agent.voice_id). Its gender decides the header line — "AI pomočnik" or
   * "AI pomočnica" — by the same rule as the greeting (defaultFirstMessage). Without it
   * (the landing demo: a male voice) the header says "AI pomočnik".
   */
  voiceId?: string;
  /** the greeting the agent opens with */
  firstMessage: string;
  /** show the text field (agent.widget_text_input) */
  textInput?: boolean;
  /**
   * The customer's widget colour (agent.widget_accent_color). It is THEIR colour, painted
   * on THEIR website, so it is the one place a hex value from data reaches the screen.
   * Without it the widget uses the default widget colour (the first of WIDGET_COLORS).
   */
  accentHex?: string;
  /**
   * Where the sample replies come from:
   *  - 'account' (default): the logged-in account's own agent — api.previewAgentReply, which
   *    answers from that account's sources (Pregled, wizard, Namestitev);
   *  - 'demo': the fictional salon of the landing page — api.demoAgentReply (no login).
   */
  replySource?: 'account' | 'demo';
  /** called with every question the person sends (for the landing demo / wizard) */
  onAsk?: (question: string) => void;
  /** the line under the widget; pass `false` only where the same sentence already stands next to it */
  note?: ReactNode | false;
  /** size of the whole preview (widget + the line under it): "h-[24rem] max-w-[17rem]" */
  className?: string;
}

interface Turn {
  id: number;
  role: 'agent' | 'visitor';
  text: string;
}

/**
 * Preview of the widget a visitor sees on the customer's website: used on Pregled,
 * in wizard step 5, on Namestitev and as the demo on the landing page.
 *
 * It is a picture of something that lives on ANOTHER website, so it does not follow our
 * light/dark theme: the body is always light and the header carries the customer's colour
 * (the `widget-*` tokens are the same in both themes).
 *
 * Stage 1 has no voice and no real agent: replies are sample sentences from the api, and
 * the line under the widget says so.
 */
export function AgentWidget({
  agentName,
  businessName,
  voiceId,
  firstMessage,
  textInput = true,
  accentHex,
  replySource = 'account',
  onAsk,
  note,
  className,
}: AgentWidgetProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const nextId = useRef(1);
  const demoState = useRef<DemoState | undefined>(undefined);
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

  async function ask(question: string): Promise<string> {
    if (replySource === 'demo') {
      const reply = await demoAgentReply(question, demoState.current);
      demoState.current = reply.state;
      return reply.text;
    }
    return (await previewAgentReply(question)).text;
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question || speaking) return;
    setDraft('');
    setTurns((t) => [...t, { id: nextId.current++, role: 'visitor', text: question }]);
    onAsk?.(question);
    setSpeaking(true);
    try {
      const text = await ask(question);
      if (!alive.current) return;
      setTurns((t) => [...t, { id: nextId.current++, role: 'agent', text }]);
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

  // The customer's colour is data, not one of our tokens; without it the default widget colour.
  const brandStyle: CSSProperties | undefined = accentHex ? { background: accentHex } : undefined;
  const brand = cn('text-widget-fg', accentHex ? null : 'bg-widget-default');

  return (
    <div className={cn('flex h-[31.5rem] max-h-full w-full max-w-sm flex-col gap-2', className)}>
      <section
        aria-label={`Predogled pomočnika ${agentName}`}
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-widget-border bg-widget-surface text-widget-text shadow-md"
      >
        <header className={cn('flex shrink-0 items-center gap-3 px-4 py-3', brand)} style={brandStyle}>
          <Waveform bars={5} size={18} animated={speaking} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{agentName}</p>
            <p className="truncate text-xs opacity-90">
              {assistantNoun(voiceId ?? '')} · {businessName}
            </p>
          </div>
        </header>

        <div
          ref={listRef}
          className="relative flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4"
          aria-live="polite"
        >
          <Bubble role="agent">{firstMessage}</Bubble>
          {turns.map((t) => (
            <Bubble key={t.id} role={t.role} brand={brand} brandStyle={brandStyle}>
              {t.text}
            </Bubble>
          ))}
          {speaking ? (
            <div className="flex items-center gap-2 text-sm text-widget-muted">
              <Waveform bars={5} size={14} animated />
              {agentName} odgovarja
            </div>
          ) : null}
        </div>

        {textInput ? (
          <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-widget-border px-3 py-2.5">
            <label className="sr-only" htmlFor={inputId}>
              Vprašanje za pomočnika
            </label>
            <input
              id={inputId}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Vpišite vprašanje"
              autoComplete="off"
              className="h-10 min-w-0 flex-1 rounded border border-widget-border-strong bg-widget-surface px-3 text-base text-widget-text placeholder:text-widget-muted focus-visible:outline-offset-0"
            />
            <button
              type="submit"
              aria-label="Pošlji vprašanje"
              disabled={!draft.trim() || speaking}
              className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded disabled:opacity-55', brand)}
              style={brandStyle}
            >
              <SendHorizontal size={18} aria-hidden="true" />
            </button>
          </form>
        ) : null}
      </section>
      {note === false ? null : <p className="shrink-0 text-xs text-fg-muted">{note ?? WIDGET_PREVIEW_NOTE}</p>}
    </div>
  );
}

function Bubble({
  role,
  children,
  brand,
  brandStyle,
}: {
  role: 'agent' | 'visitor';
  children: string;
  brand?: string;
  brandStyle?: CSSProperties;
}) {
  const visitor = role === 'visitor';
  return (
    <p
      className={cn(
        'max-w-[85%] rounded-lg px-3 py-2 text-base',
        visitor ? cn('self-end', brand) : 'self-start bg-widget-surface-2 text-widget-text',
      )}
      style={visitor ? brandStyle : undefined}
    >
      <span className="sr-only">{visitor ? 'Vi: ' : 'Pomočnik: '}</span>
      {children}
    </p>
  );
}

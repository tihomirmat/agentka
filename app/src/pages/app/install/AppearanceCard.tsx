import { Check } from 'lucide-react';
import { WIDGET_COLORS } from '@/data/api';
import type { Agent, WidgetPosition } from '@/data/types';
import { Card, CardBody, CardHeader, SwitchRow } from '@/components/ui';
import { AgentWidget } from '@/components/widget';
import { cn } from '@/lib/cn';

interface AppearanceCardProps {
  agent: Agent;
  onPatch: (changes: Partial<Agent>) => void;
}

const POSITIONS: { value: WidgetPosition; label: string }[] = [
  { value: 'bottom-right', label: 'Spodaj desno' },
  { value: 'bottom-left', label: 'Spodaj levo' },
];

const TILE_FOCUS =
  'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring';

/** "Videz pripomočka": colour, text field and position, with the shared widget reflecting them live. */
export function AppearanceCard({ agent, onPatch }: AppearanceCardProps) {
  const current = agent.widget_accent_color;
  const known = WIDGET_COLORS.some((c) => c.hex.toLowerCase() === current.toLowerCase());
  // A colour that is not one of the presets (older data) stays selectable, so nothing is lost silently.
  const colors = known ? WIDGET_COLORS : [...WIDGET_COLORS, { key: 'trenutna', name: `Trenutna barva (${current})`, hex: current }];

  return (
    <Card>
      <CardHeader
        title="Videz pripomočka"
        description="Tako pripomoček izgleda obiskovalcem na vaši spletni strani."
      />
      <CardBody className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <fieldset className="min-w-0">
            <legend className="text-sm font-medium text-fg">Barva</legend>
            <div className="mt-2 grid min-w-0 grid-cols-2 gap-2 xl:grid-cols-3">
              {colors.map((c) => {
                const selected = c.hex.toLowerCase() === current.toLowerCase();
                return (
                  <label key={c.key} className="relative flex min-w-0 cursor-pointer">
                    <input
                      type="radio"
                      name="barva-pripomocka"
                      className="peer sr-only"
                      checked={selected}
                      onChange={() => onPatch({ widget_accent_color: c.hex })}
                    />
                    <span
                      className={cn(
                        'flex w-full min-w-0 items-center gap-2.5 rounded-lg border px-2.5 py-2.5 transition-colors duration-100 sm:gap-3 sm:px-3',
                        TILE_FOCUS,
                        selected ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface hover:bg-surface-2',
                      )}
                    >
                      {/*
                        The one allowed colour value in a screen: the swatch paints the customer's own
                        widget colour from data (WIDGET_COLORS, agent.widget_accent_color). It is not a
                        colour of our interface, so it cannot be a design token.
                      */}
                      <span
                        aria-hidden="true"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-widget-fg"
                        style={{ background: c.hex }}
                      >
                        {selected ? <Check size={16} aria-hidden="true" /> : null}
                      </span>
                      <span
                        className={cn('min-w-0 text-sm sm:text-base', selected ? 'font-medium text-accent-soft-fg' : 'text-fg')}
                      >
                        {c.name}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <SwitchRow
            label="Polje za vpis besedila"
            description="Obiskovalec lahko agentu tudi piše, na primer svoj e-naslov ali telefonsko številko."
            checked={agent.widget_text_input}
            onCheckedChange={(on) => onPatch({ widget_text_input: on })}
          />

          <fieldset className="min-w-0">
            <legend className="text-sm font-medium text-fg">Položaj na strani</legend>
            <div className="mt-2 grid min-w-0 grid-cols-2 gap-2">
              {POSITIONS.map((p) => {
                const selected = agent.widget_position === p.value;
                return (
                  <label key={p.value} className="relative flex min-w-0 cursor-pointer">
                    <input
                      type="radio"
                      name="polozaj-pripomocka"
                      className="peer sr-only"
                      checked={selected}
                      onChange={() => onPatch({ widget_position: p.value })}
                    />
                    <span
                      className={cn(
                        'flex w-full min-w-0 flex-col gap-2 rounded-lg border p-3 transition-colors duration-100',
                        TILE_FOCUS,
                        selected ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface hover:bg-surface-2',
                      )}
                    >
                      <span aria-hidden="true" className="relative block h-12 w-full rounded border border-border bg-surface">
                        <span
                          className={cn(
                            'absolute bottom-1.5 h-5 w-4 rounded-sm',
                            p.value === 'bottom-right' ? 'right-1.5' : 'left-1.5',
                            selected ? 'bg-accent' : 'bg-fg-subtle',
                          )}
                        />
                      </span>
                      <span
                        className={cn('text-base', selected ? 'font-medium text-accent-soft-fg' : 'text-fg')}
                      >
                        {p.label}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="min-w-0">
          <p className="eyebrow">Predogled</p>
          <div
            className={cn(
              'mt-2 flex min-w-0 rounded-lg border border-border bg-surface-2 p-3',
              agent.widget_position === 'bottom-right' ? 'justify-end' : 'justify-start',
            )}
          >
            <AgentWidget
              agentName={agent.name}
              businessName={agent.business_name}
              firstMessage={agent.first_message}
              textInput={agent.widget_text_input}
              accentHex={agent.widget_accent_color}
              className="h-[24rem] max-w-[17rem]"
            />
          </div>
          <p className="mt-2 text-sm text-fg-subtle">
            Predogled prikazuje barvo, polje za vpis in položaj. Kako izgleda zaprt pripomoček ter kakšna sta njegova
            velikost in pisava na vaši strani, ne prikaže.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

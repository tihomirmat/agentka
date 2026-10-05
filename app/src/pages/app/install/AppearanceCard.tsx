import { ArrowDownLeft, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { WIDGET_COLORS } from '@/data/api';
import type { Agent, WidgetPosition } from '@/data/types';
import { Card, CardBody, CardHeader, ChoiceCard, SwitchRow } from '@/components/ui';
import { AgentWidget } from '@/components/widget';
import { cn } from '@/lib/cn';

interface AppearanceCardProps {
  agent: Agent;
  onPatch: (changes: Partial<Agent>) => void;
}

const POSITIONS: { value: WidgetPosition; label: string; icon: LucideIcon }[] = [
  { value: 'bottom-right', label: 'Spodaj desno', icon: ArrowDownRight },
  { value: 'bottom-left', label: 'Spodaj levo', icon: ArrowDownLeft },
];

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
        description="Tako je pripomoček videti obiskovalcem vaše spletne strani."
      />
      <CardBody className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <fieldset className="min-w-0">
            <legend className="text-sm font-medium text-fg">Barva</legend>
            <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
              {colors.map((c) => (
                <ChoiceCard
                  key={c.key}
                  name="barva-pripomocka"
                  value={c.key}
                  checked={c.hex.toLowerCase() === current.toLowerCase()}
                  onSelect={() => onPatch({ widget_accent_color: c.hex })}
                  title={c.name}
                  className="p-3"
                  aside={
                    /*
                      The one allowed colour value in a screen: the swatch paints the customer's own
                      widget colour from data (WIDGET_COLORS, agent.widget_accent_color). It is not a
                      colour of our interface, so it cannot be a design token. The ring is the strong
                      border, so a dark swatch stays visible on a dark card.
                    */
                    <span
                      aria-hidden="true"
                      className="inline-block h-5 w-5 shrink-0 rounded-full border border-border-strong"
                      style={{ background: c.hex }}
                    />
                  }
                />
              ))}
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
            <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
              {POSITIONS.map((p) => (
                <ChoiceCard
                  key={p.value}
                  name="polozaj-pripomocka"
                  value={p.value}
                  checked={agent.widget_position === p.value}
                  onSelect={() => onPatch({ widget_position: p.value })}
                  icon={p.icon}
                  title={p.label}
                  className="p-3"
                />
              ))}
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
              voiceId={agent.voice_id}
              firstMessage={agent.first_message}
              textInput={agent.widget_text_input}
              accentHex={agent.widget_accent_color}
              className="h-[24rem] max-w-[17rem]"
            />
          </div>
          <p className="mt-2 text-sm text-fg-subtle">
            Predogled prikazuje barvo, polje za vpis in položaj. Ne prikaže pa zaprtega pripomočka ter njegove velikosti in
            pisave na vaši strani.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenText,
  CalendarPlus,
  Ellipsis,
  FileText,
  MessagesSquare,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import { BRAND } from '@/brand';
import { formatDuration, formatEur, formatMinutesOf, formatRelativeDateTime } from '@/data/format';
import {
  AGENT_STATUS,
  BOOKING_MODE,
  BOOKING_STATUS,
  CONVERSATION_OUTCOME,
  LEAD_STATUS,
  LEAD_STATUS_ORDER,
  SOURCE_STATUS,
} from '@/data/labels';
import type { LeadStatus } from '@/data/types';
import { WizardStep } from '@/components/layout';
import { AgentWidget, TranscriptBubble } from '@/components/widget';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  CodeBlock,
  ConfirmDialog,
  CopyButton,
  CopyValue,
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Field,
  IconButton,
  Input,
  Logo,
  PageHeader,
  ProgressBar,
  SampleDataNote,
  Select,
  Skeleton,
  SkeletonRows,
  SkeletonText,
  Stat,
  StatusPill,
  Switch,
  SwitchRow,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TBody,
  TD,
  Textarea,
  TH,
  THead,
  Tooltip,
  TR,
  useToast,
  Waveform,
} from '@/components/ui';

/* The gallery is a review page: fixed example rows live here, not in the data layer. */
const NOW = Date.now();
const HOUR = 3_600_000;
const ROWS = [
  { id: '1', at: NOW - 2 * HOUR, sec: 498, outcome: 'booking' as const, name: 'Maja Kovač', summary: 'Nova spletna stran za računovodski servis. Rezerviran posvet.' },
  { id: '2', at: NOW - 21 * HOUR, sec: 204, outcome: 'question' as const, name: null, summary: 'Cena vodenja Google oglasov in priporočen proračun.' },
  { id: '3', at: NOW - 27 * HOUR, sec: 372, outcome: 'lead' as const, name: 'Tomaž Zupančič', summary: 'Spletna trgovina za športno opremo, želi ponudbo.' },
  { id: '4', at: NOW - 75 * HOUR, sec: 163, outcome: 'question' as const, name: null, summary: 'YouTube oglaševanje in snemanje videa.' },
];

const COLOR_TOKENS: { name: string; swatch: string; note: string }[] = [
  { name: 'bg', swatch: 'bg-bg', note: 'ozadje strani' },
  { name: 'surface', swatch: 'bg-surface', note: 'kartice, polja' },
  { name: 'surface-2', swatch: 'bg-surface-2', note: 'tiho polnilo' },
  { name: 'surface-3', swatch: 'bg-surface-3', note: 'močnejše polnilo' },
  { name: 'raised', swatch: 'bg-raised', note: 'meniji, okna, obvestila' },
  { name: 'raised-hover', swatch: 'bg-raised-hover', note: 'označena vrstica v meniju' },
  { name: 'border', swatch: 'bg-border', note: 'črte' },
  { name: 'border-strong', swatch: 'bg-border-strong', note: 'robovi polj' },
  { name: 'fg', swatch: 'bg-fg', note: 'besedilo' },
  { name: 'fg-muted', swatch: 'bg-fg-muted', note: 'drugotno besedilo' },
  { name: 'fg-subtle', swatch: 'bg-fg-subtle', note: 'namigi' },
  { name: 'accent', swatch: 'bg-accent', note: 'edina barva znamke' },
  { name: 'accent-hover', swatch: 'bg-accent-hover', note: 'poudarek ob lebdenju' },
  { name: 'accent-soft', swatch: 'bg-accent-soft', note: 'izbrano, aktivno' },
  { name: 'success', swatch: 'bg-success', note: 'uspeh' },
  { name: 'success-soft', swatch: 'bg-success-soft', note: '' },
  { name: 'warning', swatch: 'bg-warning', note: 'opozorilo' },
  { name: 'warning-soft', swatch: 'bg-warning-soft', note: '' },
  { name: 'danger', swatch: 'bg-danger', note: 'napaka, brisanje' },
  { name: 'danger-soft', swatch: 'bg-danger-soft', note: '' },
  { name: 'info', swatch: 'bg-info', note: 'obvestilo' },
  { name: 'info-soft', swatch: 'bg-info-soft', note: '' },
  { name: 'inverse', swatch: 'bg-inverse', note: 'namigi, skrbniški trak' },
  { name: 'ring', swatch: 'bg-ring', note: 'fokus' },
];

const TYPE_SCALE: { cls: string; name: string; use: string; display?: boolean }[] = [
  { cls: 'text-4xl', name: 'text-4xl', use: 'naslov na vstopni strani', display: true },
  { cls: 'text-3xl', name: 'text-3xl', use: 'naslovi razdelkov javnih strani', display: true },
  { cls: 'text-2xl', name: 'text-2xl', use: 'številke, naslov koraka', display: true },
  { cls: 'text-xl', name: 'text-xl', use: 'naslov strani v aplikaciji', display: true },
  { cls: 'text-lg', name: 'text-lg', use: 'naslov razdelka, okna' },
  { cls: 'text-md', name: 'text-md', use: 'naslov kartice, uvodno besedilo' },
  { cls: 'text-base', name: 'text-base', use: 'besedilo in kontrolniki' },
  { cls: 'text-sm', name: 'text-sm', use: 'namigi, drugotno' },
  { cls: 'text-xs', name: 'text-xs', use: 'oznake, glave tabel' },
];

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="min-w-0 border-t border-border py-8">
      <h2 className="font-display text-lg font-semibold text-fg">{title}</h2>
      {note ? <p className="mt-1 max-w-prose text-sm text-fg-muted">{note}</p> : null}
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="mb-4 min-w-0 last:mb-0">
      {label ? <p className="eyebrow mb-2">{label}</p> : null}
      <div className="flex min-w-0 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

type ThemeChoice = 'system' | 'light' | 'dark';

function setTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
}

export default function Gallery() {
  const toast = useToast();
  const [theme, setThemeState] = useState<ThemeChoice>(
    () => (document.documentElement.getAttribute('data-theme') as ThemeChoice | null) ?? 'system',
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [mode, setMode] = useState<'request' | 'auto'>('auto');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('new');
  const [voice, setVoice] = useState<string | undefined>(undefined);
  const [visitorMail, setVisitorMail] = useState(true);
  const [ownerMail, setOwnerMail] = useState(false);
  const [included, setIncluded] = useState(true);
  const [agree, setAgree] = useState(true);
  const [name, setName] = useState('Jan');
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-full">
      <header className="sticky-top z-30 border-b border-border bg-bg">
        <div className="page flex min-h-topbar flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size="sm" />
            <span className="truncate text-sm text-fg-muted">Gradniki vmesnika</span>
          </div>
          <Select<ThemeChoice>
            aria-label="Tema"
            size="sm"
            className="w-36"
            value={theme}
            onValueChange={(v) => {
              setThemeState(v);
              setTheme(v);
            }}
            options={[
              { value: 'system', label: 'Sistemska' },
              { value: 'light', label: 'Svetla' },
              { value: 'dark', label: 'Temna' },
            ]}
          />
        </div>
      </header>

      <div className="page pb-16 pt-8">
        <PageHeader
          title="Gradniki vmesnika"
          description={`Vsi skupni gradniki ${BRAND} v vseh različicah in stanjih. Zasloni so sestavljeni samo iz njih.`}
          meta={<SampleDataNote />}
          actions={
            <>
              <ButtonLink to="/" size="sm">
                Vstopna stran
              </ButtonLink>
              <ButtonLink to="/app/pregled" size="sm">
                Aplikacija
              </ButtonLink>
              <ButtonLink to="/admin" size="sm">
                Skrbnik
              </ButtonLink>
              <ButtonLink to="/zacetek/1" size="sm">
                Čarovnik
              </ButtonLink>
            </>
          }
        />

        <Section id="barve" title="Barve" note="Vse barve so žetoni iz tokens.css. Ena barva znamke (petrolej modra), štiri pomenske barve, hladni sivi toni.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {COLOR_TOKENS.map((t) => (
              <li key={t.name} className="min-w-0">
                <span className={`block h-12 rounded border border-border ${t.swatch}`} />
                <span className="mt-1.5 block truncate font-mono text-xs text-fg">{t.name}</span>
                <span className="block truncate text-xs text-fg-subtle">{t.note || ' '}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="tipografija" title="Tipografija" note="Bricolage Grotesque za naslove, Instrument Sans za besedilo in kontrolnike, IBM Plex Mono za kodo in oznake.">
          <div className="flex min-w-0 flex-col gap-4">
            {TYPE_SCALE.map((t) => (
              <div key={t.name} className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="w-44 shrink-0 font-mono text-xs text-fg-subtle">
                  {t.name} · {t.use}
                </span>
                <span className={`min-w-0 text-fg ${t.cls} ${t.display ? 'font-display font-semibold tracking-tight' : ''}`}>
                  Čas je, da vaša stran spregovori
                </span>
              </div>
            ))}
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-44 shrink-0 font-mono text-xs text-fg-subtle">font-mono · koda, številke</span>
              <span className="nums min-w-0 font-mono text-sm text-fg">agt_spletnost_jan · 040 555 012 · 86 / 300 min</span>
            </div>
            <p className="max-w-prose text-base text-fg-muted">
              Odstavek v osnovni velikosti. Šumniki morajo biti čisti: č, š, ž, Č, Š, Ž. Agent odgovarja obiskovalcem,
              dogovarja termine in vam po vsakem pogovoru pošlje povzetek.
            </p>
          </div>
        </Section>

        <Section id="znak" title="Logotip in zvočni znak" note="Zvočni znak je edini motiv izdelka. Uporablja se v logotipu in v pripomočku, ko agent govori. Nikjer drugje.">
          <Row label="Logotip">
            <Logo to={null} />
            <Logo to={null} size="sm" />
            <Logo to={null} markOnly />
          </Row>
          <Row label="Zvočni znak: miruje / govori">
            <Waveform className="text-accent" size={24} label="Zvočni znak" />
            <Waveform className="text-accent" size={24} animated label="Agent govori" />
            <Waveform className="text-fg-muted" bars={7} size={20} />
            <Waveform className="text-fg-muted" bars={7} size={20} animated />
          </Row>
        </Section>

        <Section id="gumbi" title="Gumbi" note="Na zaslonu je največ en glavni (primary) gumb. Napis pove natanko, kaj se zgodi.">
          <Row label="Različice">
            <Button variant="primary">Shrani spremembe</Button>
            <Button>Prekliči</Button>
            <Button variant="ghost">Preskoči</Button>
            <Button variant="danger">Izbriši račun</Button>
          </Row>
          <Row label="Manjša velikost">
            <Button variant="primary" size="sm">
              Shrani
            </Button>
            <Button size="sm">Prekliči</Button>
            <Button variant="ghost" size="sm">
              Preskoči
            </Button>
            <Button variant="danger" size="sm">
              Odstrani
            </Button>
          </Row>
          <Row label="Z ikono, med izvajanjem, onemogočen">
            <Button variant="primary" icon={Plus}>
              Dodaj besedilo
            </Button>
            <Button icon={RefreshCw}>Sinhroniziraj</Button>
            <Button
              variant="primary"
              loading={loading}
              onClick={() => {
                setLoading(true);
                window.setTimeout(() => setLoading(false), 1500);
              }}
            >
              Pošlji testno sporočilo
            </Button>
            <Button loading>Shranjujem</Button>
            <Button variant="primary" disabled>
              Shrani spremembe
            </Button>
            <Button disabled>Prekliči</Button>
          </Row>
          <Row label="Povezava v obliki gumba, gumb z ikono">
            <ButtonLink to="/_ui" variant="primary">
              Začnite brezplačno
            </ButtonLink>
            <ButtonLink to="/_ui" icon={CalendarPlus}>
              Poveži koledar
            </ButtonLink>
            <IconButton icon={Pencil} label="Uredi besedilo" />
            <IconButton icon={Trash2} label="Odstrani vir" variant="danger" />
            <IconButton icon={RefreshCw} label="Osveži seznam" variant="secondary" size="sm" />
          </Row>
        </Section>

        <Section id="obrazci" title="Obrazci" note="Vsako polje ima vidno oznako. Namig pove, čemu polje služi; napaka pove, kaj je narobe in kaj storiti.">
          <div className="grid min-w-0 gap-x-8 gap-y-5 md:grid-cols-2">
            <Field label="Ime agenta" hint="S tem imenom se agent predstavi obiskovalcem.">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="E-naslov za obvestila" error="E-naslov ni pravilno zapisan. Primer: info@podjetje.si">
              <Input type="email" defaultValue="info@podjetje" />
            </Field>
            <Field label="Naslov spletne strani" hint="Agent prebere besedilo vseh strani na tem naslovu.">
              <Input prefix="https://" placeholder="vasepodjetje.si" />
            </Field>
            <Field label="Dolžina termina">
              <Input type="number" defaultValue={30} suffix="min" className="max-w-[10rem]" />
            </Field>
            <Field label="Dovoljena domena" optional hint="Pripomoček deluje samo na tej domeni.">
              <Input mono defaultValue="spletnost.si" />
            </Field>
            <Field label="Naročnina">
              <Input defaultValue="Rast, 59 € na mesec" disabled />
            </Field>
            <Field label="Način dogovarjanja terminov" hint={BOOKING_MODE[mode].description}>
              <Select
                value={mode}
                onValueChange={setMode}
                options={[
                  { value: 'request', label: BOOKING_MODE.request.label, description: 'Deluje brez koledarja.' },
                  { value: 'auto', label: BOOKING_MODE.auto.label, description: 'Potrebuje Google Koledar.' },
                ]}
              />
            </Field>
            <Field label="Glas agenta" error="Izberite glas, s katerim bo agent govoril.">
              <Select
                value={voice}
                onValueChange={setVoice}
                placeholder="Izberite glas"
                options={[
                  { value: 'jan', label: 'Jan', description: 'moški glas, umirjen' },
                  { value: 'tina', label: 'Tina', description: 'ženski glas, topel' },
                  { value: 'peter', label: 'Peter', description: 'moški glas, globok', disabled: true },
                ]}
              />
            </Field>
            <Field
              className="md:col-span-2"
              label="Navodila agentu"
              hint="Napišite, kako naj agent govori in česa naj ne obljublja."
            >
              <Textarea
                rows={4}
                defaultValue={'Obiskovalce vikajte. Odgovarjajte v enem ali dveh kratkih stavkih.\nCen, ki jih ni v virih znanja, ne navajajte.'}
              />
            </Field>
          </div>

          <div className="mt-6 grid min-w-0 gap-x-8 gap-y-5 md:grid-cols-2">
            <Card>
              <CardBody className="flex flex-col gap-4">
                <SwitchRow
                  label="Potrditev obiskovalcu"
                  description="Obiskovalec po pogovoru prejme povzetek na svoj e-naslov."
                  checked={visitorMail}
                  onCheckedChange={setVisitorMail}
                />
                <SwitchRow
                  label="Obvestilo vam"
                  description="Po vsakem pogovoru prejmete povzetek in podatke obiskovalca."
                  checked={ownerMail}
                  onCheckedChange={setOwnerMail}
                />
                <SwitchRow label="Vnos besedila v pripomočku" checked onCheckedChange={() => {}} disabled />
              </CardBody>
            </Card>
            <div className="flex min-w-0 flex-col gap-4">
              <Checkbox
                label="Strinjam se s pogoji uporabe"
                description="Brez tega računa ni mogoče ustvariti."
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <Checkbox label="Pošljite mi mesečni povzetek porabe" defaultChecked={false} />
              <Checkbox label="Možnost, ki je ni mogoče spremeniti" checked disabled readOnly />
              <div className="flex items-center gap-3">
                <Switch checked={included} onCheckedChange={setIncluded} aria-label="Vključi stran Kontakt" />
                <span className="text-sm text-fg-muted">Stikalo brez vrstice (v tabeli), z aria-label</span>
              </div>
            </div>
          </div>
        </Section>

        <Section id="kartice" title="Kartice" note="Kartica je navaden okvir brez sence. Senco imajo samo stvari, ki lebdijo nad stranjo: meniji, okna, obvestila.">
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <Card>
              <CardHeader
                title="Viri znanja"
                description="15 strani, zadnja sinhronizacija včeraj ob 06:30"
                action={
                  <Button size="sm" icon={RefreshCw}>
                    Sinhroniziraj
                  </Button>
                }
              />
              <CardBody>
                <p className="text-base text-fg-muted">
                  Agent odgovarja iz besedila vaše spletne strani, datotek in besedil, ki jih dodate sami.
                </p>
              </CardBody>
              <CardFooter>
                <Button variant="ghost" size="sm">
                  Prekliči
                </Button>
                <Button variant="primary" size="sm">
                  Shrani
                </Button>
              </CardFooter>
            </Card>
            <div className="flex min-w-0 flex-col gap-5">
              <Card>
                <CardHeader title="Termini" action={<StatusPill tone="success">Koledar povezan</StatusPill>} />
                <CardBody>
                  <p className="text-base text-fg">Samodejna rezervacija</p>
                  <CopyValue value="koledar.spletnost@example.com" copyLabel="Kopiraj e-naslov" className="text-sm text-fg-muted" />
                </CardBody>
              </Card>
              <Card tone="quiet">
                <CardBody>
                  <p className="text-sm text-fg-muted">
                    Tiha kartica (tone=&quot;quiet&quot;) za pojasnila in drugotne bloke. Brez roba, z rahlim polnilom.
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        </Section>

        <Section id="zavihki" title="Zavihki">
          <Tabs defaultValue="stran">
            <TabsList aria-label="Vrste virov znanja">
              <TabsTrigger value="stran" count={18}>
                Spletna stran
              </TabsTrigger>
              <TabsTrigger value="datoteke" count={1}>
                Datoteke
              </TabsTrigger>
              <TabsTrigger value="besedilo" count={1}>
                Besedilo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="stran">
              <p className="text-base text-fg-muted">Strani, ki jih je agent prebral z vaše spletne strani.</p>
            </TabsContent>
            <TabsContent value="datoteke">
              <p className="text-base text-fg-muted">Datoteke PDF, DOCX ali TXT, ki jih dodate sami.</p>
            </TabsContent>
            <TabsContent value="besedilo">
              <p className="text-base text-fg-muted">Besedila z naslovom, na primer cenik ali delovni čas.</p>
            </TabsContent>
          </Tabs>
        </Section>

        <Section id="oznake" title="Oznake in stanja" note="Oznaka (Badge) pove vrsto stvari. Stanje (StatusPill) pove, kaj se z njo dogaja: pika in beseda, nikoli samo barva.">
          <Row label="Badge">
            <Badge>Start</Badge>
            <Badge tone="accent">Rast</Badge>
            <Badge tone="info">PDF</Badge>
            <Badge tone="success">Lastnik</Badge>
            <Badge tone="warning">Skrbnik</Badge>
            <Badge tone="danger">Zapadlo</Badge>
          </Row>
          <Row label="StatusPill: agent">
            {Object.values(AGENT_STATUS).map((s) => (
              <StatusPill key={s.label} tone={s.tone}>
                {s.label}
              </StatusPill>
            ))}
          </Row>
          <Row label="StatusPill: izid pogovora, kontakt, rezervacija">
            {[...Object.values(CONVERSATION_OUTCOME), ...Object.values(LEAD_STATUS), ...Object.values(BOOKING_STATUS)].map(
              (s, i) => (
                <StatusPill key={`${s.label}-${i}`} tone={s.tone}>
                  {s.label}
                </StatusPill>
              ),
            )}
          </Row>
          <Row label="StatusPill: vir znanja (v obdelavi utripa)">
            <StatusPill tone={SOURCE_STATUS.pending.tone} live>
              {SOURCE_STATUS.pending.label}
            </StatusPill>
            <StatusPill tone={SOURCE_STATUS.synced.tone}>{SOURCE_STATUS.synced.label}</StatusPill>
            <StatusPill tone={SOURCE_STATUS.excluded.tone}>{SOURCE_STATUS.excluded.label}</StatusPill>
            <StatusPill tone={SOURCE_STATUS.error.tone}>{SOURCE_STATUS.error.label}</StatusPill>
          </Row>
          <Row label="Vzorčni podatki">
            <SampleDataNote />
          </Row>
        </Section>

        <Section id="tabela" title="Tabela" note="Široka tabela se na ozkem zaslonu pomika vodoravno znotraj svojega okvira. Stran se nikoli ne pomika vodoravno.">
          <div className="flex min-w-0 flex-col gap-5">
            <Card>
              <CardHeader title="Pogovori" description="Zadnji pogovori z agentom" divider />
              <Table minWidth={680} caption="Zadnji pogovori">
                <THead>
                  <TR>
                    <TH>Datum</TH>
                    <TH numeric>Trajanje</TH>
                    <TH>Izid</TH>
                    <TH>Ime</TH>
                    <TH>Povzetek</TH>
                    <TH>
                      <span className="sr-only">Dejanja</span>
                    </TH>
                  </TR>
                </THead>
                <TBody>
                  {ROWS.map((r) => {
                    const o = CONVERSATION_OUTCOME[r.outcome];
                    return (
                      <TR key={r.id} interactive>
                        <TD nowrap>
                          <Link to="/_ui" className="rounded font-medium text-fg hover:underline">
                            {formatRelativeDateTime(r.at)}
                          </Link>
                        </TD>
                        <TD numeric>{formatDuration(r.sec)}</TD>
                        <TD>
                          <StatusPill tone={o.tone}>{o.label}</StatusPill>
                        </TD>
                        <TD nowrap muted={!r.name}>
                          {r.name ?? 'Brez imena'}
                        </TD>
                        <TD muted className="max-w-[22rem]">
                          <span className="line-clamp-1">{r.summary}</span>
                        </TD>
                        <TD numeric>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <IconButton icon={Ellipsis} label="Več dejanj" size="sm" tooltip={false} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem icon={MessagesSquare}>Odpri pogovor</DropdownMenuItem>
                              <DropdownMenuItem icon={Users}>Odpri kontakt</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </Card>

            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              <Card>
                <CardHeader title="Besedila" description="Prazno stanje" divider />
                <Table
                  empty={
                    <EmptyState
                      icon={FileText}
                      title="Dodajte prvo besedilo, na primer cenik ali delovni čas."
                      action={
                        <Button variant="primary" size="sm" icon={Plus}>
                          Dodaj besedilo
                        </Button>
                      }
                    />
                  }
                >
                  {null}
                </Table>
              </Card>
              <Card>
                <CardHeader title="Kontakti" description="Med nalaganjem" divider />
                <SkeletonRows rows={4} />
              </Card>
            </div>
          </div>
        </Section>

        <Section id="stevilke" title="Številke in poraba">
          <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Pogovori" value="20" sub="v tem obdobju" />
            <Stat label="Kontakti" value="8" sub="v tem obdobju" />
            <Stat label="Rezervacije" value="5" sub="2 prihajajoči" />
            <Stat label="Minute" value="86" unit="/ 300 min" progress={{ value: 86, max: 300 }} />
          </div>
          <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1.5 text-sm text-fg-muted">{formatMinutesOf(86, 300)}</p>
              <ProgressBar label="Porabljene minute" value={86} max={300} />
            </div>
            <div>
              <p className="mb-1.5 text-sm text-fg-muted">{formatMinutesOf(252, 300)} (nad 80 %)</p>
              <ProgressBar label="Porabljene minute" value={252} max={300} />
            </div>
            <div>
              <p className="mb-1.5 text-sm text-fg-muted">{formatMinutesOf(300, 300)} (porabljeno)</p>
              <ProgressBar label="Porabljene minute" value={300} max={300} />
            </div>
          </div>
        </Section>

        <Section id="okna" title="Okna, potrditve, obvestila, meniji" note="Potrditve so okna na strani. Brskalnikovih oken (alert, confirm) ne uporabljamo.">
          <Row label="Okno in potrditev">
            <Button onClick={() => setDialogOpen(true)}>Odpri okno</Button>
            <Button onClick={() => setConfirmOpen(true)}>Odpri potrditev</Button>
            <Button variant="danger" onClick={() => setDangerOpen(true)}>
              Odpri nevarno potrditev
            </Button>
          </Row>
          <Row label="Obvestila (toast)">
            <Button onClick={() => toast.success('Nastavitve so shranjene.')}>Uspeh</Button>
            <Button
              onClick={() => toast.error('Shranjevanje ni uspelo. Preverite internetno povezavo in poskusite znova.')}
            >
              Napaka
            </Button>
            <Button onClick={() => toast.info('Predogled: povezava z Google Koledarjem je simulirana.')}>
              Obvestilo o predogledu
            </Button>
          </Row>
          <Row label="Namig in meni">
            <Tooltip content="Minute se štejejo od začetka do konca pogovora.">
              <Button variant="ghost">Kako se štejejo minute?</Button>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button icon={Ellipsis}>Več dejanj</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Cenik storitev</DropdownMenuLabel>
                <DropdownMenuItem icon={Pencil}>Uredi besedilo</DropdownMenuItem>
                <DropdownMenuItem icon={RefreshCw}>Sinhroniziraj znova</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem icon={Trash2} tone="danger">
                  Odstrani vir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Select
              aria-label="Stanje kontakta"
              size="sm"
              className="w-40"
              value={leadStatus}
              onValueChange={setLeadStatus}
              options={LEAD_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS[s].label }))}
            />
          </Row>

          <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title="Dodaj besedilo"
            description="Besedilo, ki ga ni na vaši spletni strani, na primer cenik."
            footer={
              <>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Prekliči
                </Button>
                <Button variant="primary" onClick={() => setDialogOpen(false)}>
                  Dodaj besedilo
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <Field label="Naslov">
                <Input placeholder="Cenik storitev" />
              </Field>
              <Field label="Besedilo" hint="Pišite tako, kot bi povedali stranki.">
                <Textarea rows={5} />
              </Field>
            </div>
          </Dialog>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Odklopim Google Koledar?"
            description="Agent bo spet samo zapisoval želje za termin, potrdili jih boste sami."
            confirmLabel="Odklopi koledar"
            onConfirm={() => new Promise((r) => window.setTimeout(r, 800))}
          />
          <ConfirmDialog
            open={dangerOpen}
            onOpenChange={setDangerOpen}
            tone="danger"
            title="Odstranim vir »Cenik storitev«?"
            description="Agent tega besedila ne bo več uporabljal. Dejanja ni mogoče razveljaviti."
            confirmLabel="Odstrani vir"
            onConfirm={() => {
              toast.success('Vir »Cenik storitev« je odstranjen.');
            }}
          />
        </Section>

        <Section id="prazno" title="Prazna stanja in glava strani" note="Prazno stanje v enem stavku pove, kaj storiti. Glava strani je prva stvar na vsakem zaslonu.">
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <Card>
              <EmptyState
                icon={MessagesSquare}
                title="Ko bo agent opravil prvi pogovor, ga boste videli tukaj."
                description="Namestite pripomoček na svojo spletno stran, da lahko obiskovalci začnejo pogovor."
                action={
                  <ButtonLink to="/_ui" variant="primary" size="sm">
                    Odpri namestitev
                  </ButtonLink>
                }
              />
            </Card>
            <Card>
              <EmptyState compact icon={BookOpenText} title="Uvozite spletno stran, da bo agent imel iz česa odgovarjati." />
            </Card>
          </div>
          <Card className="mt-5">
            <CardBody>
              <PageHeader
                className="mb-0"
                back={{ to: '/_ui', label: 'Vsi pogovori' }}
                title="Pogovor z Majo Kovač"
                meta={<StatusPill tone="accent">Rezervacija</StatusPill>}
                description="Danes ob 10:12, trajanje 08:18."
                actions={<Button size="sm">Odpri kontakt</Button>}
              />
            </CardBody>
          </Card>
        </Section>

        <Section id="kopiranje" title="Kopiranje in koda" note="E-naslovi in telefonske številke so besedilo z gumbom za kopiranje, ne povezave.">
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <CodeBlock
              label="Koda za vgradnjo"
              code={'<script src="https://widget.example/v1.js" data-agent="agt_spletnost_jan" async></script>'}
              onCopied={() => toast.success('Koda je kopirana. Prilepite jo pred </body> na svoji spletni strani.')}
            />
            <div className="flex min-w-0 flex-col gap-3">
              <CopyValue value="maja.kovac@example.si" copyLabel="Kopiraj e-naslov" />
              <CopyValue value="040 555 012" copyLabel="Kopiraj telefonsko številko" mono />
              <div>
                <CopyButton text="spletnost.si" label="Kopiraj domeno" />
              </div>
            </div>
          </div>
        </Section>

        <Section id="nalaganje" title="Nalaganje" note="Med nalaganjem pokažemo obris vsebine, ne vrtečega se kroga sredi strani.">
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <Card>
              <CardBody className="flex flex-col gap-3">
                <Skeleton className="h-5 w-40" />
                <SkeletonText lines={3} />
              </CardBody>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </Section>

        <Section id="pripomocek" title="Pripomoček in zapis pogovora" note="Predogled pripomočka, kot ga vidi obiskovalec, in oblački shranjenega pogovora. Pripomoček v barvi stranke uporablja njeno barvo, ne naših žetonov.">
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <div className="flex min-w-0 flex-wrap gap-5">
              <AgentWidget
                agentName="Jan"
                businessName="Spletnost"
                firstMessage="Pozdravljeni, sem Jan, AI pomočnik agencije Spletnost. Kako vam lahko pomagam?"
              />
            </div>
            <Card>
              <CardHeader title="Zapis pogovora" divider />
              <CardBody className="flex flex-col gap-4 pt-4">
                <TranscriptBubble role="agent" speaker="Jan" time={formatDuration(0)}>
                  Pozdravljeni, sem Jan, AI pomočnik agencije Spletnost. Kako vam lahko pomagam?
                </TranscriptBubble>
                <TranscriptBubble role="visitor" speaker="Obiskovalec" time={formatDuration(9)}>
                  Zanima me, koliko stane vodenje Google oglasov.
                </TranscriptBubble>
                <TranscriptBubble role="agent" speaker="Jan" time={formatDuration(17)}>
                  Vodenje Google oglaševanja stane od sto devetdeset evrov na mesec. Proračun za oglase plačate posebej.
                </TranscriptBubble>
              </CardBody>
            </Card>
          </div>
        </Section>

        <Section id="carovnik" title="Korak čarovnika" note="Telo enega koraka z režami Nazaj, Preskoči in Naprej. Vrstico s petimi koraki riše WizardShell.">
          <Card>
            <CardBody>
              <WizardStep
                title="Vaša spletna stran"
                description="Vpišite naslov. Agent prebere besedilo strani in iz njega odgovarja obiskovalcem."
                back={<Button variant="ghost">Nazaj</Button>}
                skip={<Button variant="ghost">Preskoči</Button>}
                next={<Button variant="primary">Naprej</Button>}
              >
                <Field label="Naslov spletne strani">
                  <Input prefix="https://" placeholder="vasepodjetje.si" />
                </Field>
              </WizardStep>
            </CardBody>
          </Card>
          <p className="mt-4 text-sm text-fg-subtle">Primer cene iz pomožnih funkcij: {formatEur(59)} na mesec.</p>
        </Section>
      </div>
    </div>
  );
}

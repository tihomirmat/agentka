import { useState } from 'react';
import { CalendarCheck, Inbox, Plus, RefreshCw, Send } from 'lucide-react';
import { AgentWidget } from '@/components/widget';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  ChoiceCard,
  ClampedText,
  CodeBlock,
  copyFallbackSentence,
  FactList,
  Field,
  FilterChips,
  IconButton,
  Input,
  Notice,
  PlanCard,
  SaveBar,
  SearchField,
  Segmented,
  Stat,
  StatusPill,
  StepList,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TBody,
  TD,
  TH,
  THead,
  TimeSelect,
  TR,
  TypedConfirmDialog,
  useDraft,
  useToast,
} from '@/components/ui';
import { WIDGET_COLORS } from '@/data/api';
import {
  formatDate,
  formatDaysLeft,
  formatDuration,
  formatEurExact,
  formatRelativeDateTime,
  formatTimecode,
  formatTrialTerms,
  formatWeekdayDate,
} from '@/data/format';
import {
  AGENT_STATUS,
  AGENT_STATUS_HELP,
  agentStatusText,
  COUNT_LABELS,
  EMAIL_KIND,
  LEAD_STATUS,
  LEAD_STATUS_ORDER,
  PAUSED_BY,
  TRIAL,
} from '@/data/labels';
import type { AgentStatus, LeadStatus, PausedBy, Plan } from '@/data/types';
import { Row, Section } from './parts';

const DAY = 86_400_000;
const NOW = Date.now();

const INVOICES = [
  { id: 'VZOREC-0003', date: NOW - 26 * DAY, what: 'Paket Rast – mesečna naročnina', amount: 59, paid: true },
  { id: 'VZOREC-0002', date: NOW - 56 * DAY, what: 'Paket Rast – mesečna naročnina', amount: 59, paid: true },
  { id: 'VZOREC-0001', date: NOW - 86 * DAY, what: 'Paket Start – mesečna naročnina', amount: 29, paid: true },
];

const SAMPLE_PLAN: Plan = {
  key: 'rast',
  name: 'Rast',
  price_month_eur: 59,
  stripe_price_id: null,
  minutes_included: 300,
  max_pages: 150,
  max_agents: 1,
};

type Period = '7' | '30' | 'all';
type LeadFilter = 'all' | LeadStatus;
const LEAD_COUNTS: Record<LeadFilter, number> = { all: 8, new: 4, contacted: 2, won: 1, lost: 1 };

interface DemoSettings {
  name: string;
  from: string;
}

/**
 * The shared primitives added after review 1. Each block shows the primitive in its states
 * and says in one line when to use it (the rules are in CONVENTIONS.md).
 */
export function GalleryAdditions() {
  const toast = useToast();
  const [saved, setSaved] = useState<DemoSettings>({ name: 'Jan', from: '08:00' });
  const draft = useDraft<DemoSettings>(saved);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<Period>('30');
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all');
  const [mode, setMode] = useState<'request' | 'auto'>('request');
  const [to, setTo] = useState('16:00');
  const [typedOpen, setTypedOpen] = useState(false);
  const [codeNote, setCodeNote] = useState<string | null>(null);
  const [password, setPassword] = useState('predogled');
  const [showPassword, setShowPassword] = useState(false);

  const value = draft.value ?? saved;
  const nameMissing = value.name.trim() === '';

  return (
    <>
      <Section
        id="obvestilo-na-strani"
        title="Obvestilo na strani (Notice)"
        note="En gradnik za vse, kar stran pove sama: stanje, ki zahteva dejanje, pojasnilo ali rezultat dejanja, ki mora ostati berljiv. Rob in tiho polnilo, ikona, naslov, besedilo, eno dejanje."
      >
        <div className="flex min-w-0 flex-col gap-3">
          <Notice
            tone="danger"
            title="Zadnje plačilo ni uspelo."
            action={
              <Button variant="primary" size="sm">
                Uredi plačilo
              </Button>
            }
          >
            Agent je začasno ustavljen, dokler plačilo ni urejeno.
          </Notice>
          <Notice tone="warning" title="Porabili ste 84 % vključenih minut.">
            Ko minut zmanjka, se agent začasno ustavi do novega obračunskega obdobja.
          </Notice>
          <Notice tone="info" title="Agent je še osnutek." action={<ButtonLink to="/_ui" size="sm">Dodaj vire znanja</ButtonLink>}>
            {AGENT_STATUS_HELP.draft}
          </Notice>
          <Notice tone="success" title="Koledar je povezan.">
            Agent bo ponujal samo termine, ko ste po koledarju prosti.
          </Notice>
          <Notice tone="neutral" live={false}>
            Pojasnilo brez stanja: besedilo, ki je na strani vedno (live=false, bralnik zaslona ga ne napove kot novost).
          </Notice>
          <Row label="Majhna različica (size=sm): rezultat dejanja ob kontrolniku">
            <div className="grid w-full min-w-0 gap-3 md:grid-cols-2">
              <Notice size="sm" tone="neutral">
                Predogled: testno sporočilo na info@example.si ni bilo poslano. V polni različici ga prejmete v svoj poštni
                predal.
              </Notice>
              <Notice size="sm" tone="danger">
                E-naslov ni pravilno zapisan. Primer: ime@podjetje.si
              </Notice>
            </div>
          </Row>
        </div>
      </Section>

      <Section
        id="rezultat"
        title="Kako pokažemo rezultat"
        note="Eno pravilo. Rezultat, ki spremeni to, kar je na strani (vrstica, oznaka, shranjen obrazec): samo obvestilo na vrhu (toast). Rezultat, ki ga mora oseba prebrati in obdržati (simulirano zunanje dejanje): samo Notice ob kontrolniku. Nikoli oboje."
      >
        <div className="grid min-w-0 gap-5 md:grid-cols-2">
          <Card>
            <CardHeader title="Spremeni stran → toast" description="Obvestilo se pokaže zgoraj desno (na telefonu zgoraj na sredini), samo izgine in se ob menjavi strani počisti." />
            <CardBody className="flex flex-wrap gap-2">
              <Button onClick={() => toast.success('Stanje kontakta Maja Kovač je spremenjeno.')}>Spremeni stanje</Button>
              <Button onClick={() => toast.error('Shranjevanje ni uspelo. Preverite povezavo in poskusite znova.')}>
                Sproži napako
              </Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Treba prebrati → Notice" description="Stavek iz api-ja ostane ob gumbu, dokler oseba ne sproži naslednjega dejanja. Brez toasta." />
            <CardBody className="flex flex-col gap-3">
              <div>
                <Button
                  icon={Send}
                  onClick={() =>
                    setTestResult(
                      'Predogled: testno sporočilo na info@example.si ni bilo poslano. V polni različici ga prejmete v svoj poštni predal.',
                    )
                  }
                >
                  Pošlji testno sporočilo
                </Button>
              </div>
              {testResult ? (
                <Notice size="sm" tone="neutral">
                  {testResult}
                </Notice>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </Section>

      <Section
        id="shranjevanje"
        title="Shranjevanje (SaveBar, useDraft, useUnsavedGuard)"
        note="Ena lebdeča vrstica na stran. Pokaže se, ko se kaj spremeni, in nosi edini glavni gumb. Če oseba z neshranjenimi spremembami odide na drugo stran, jo okno prej vpraša. Spremenite polje in poskusite klikniti povezavo zgoraj."
      >
        <Card>
          <CardBody className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Field label="Ime agenta" error={nameMissing ? 'Vpišite ime agenta.' : undefined}>
              <Input key={draft.version} defaultValue={value.name} onChange={(e) => draft.patch({ name: e.target.value })} />
            </Field>
            <Field label="Začetek delovnega časa" hint="TimeSelect: vedno 24-urni zapis.">
              <TimeSelect value={value.from} onValueChange={(from) => draft.patch({ from })} min="06:00" max="12:00" step={30} />
            </Field>
          </CardBody>
        </Card>
        <SaveBar
          dirty={draft.dirty}
          saving={saving}
          canSave={!nameMissing}
          blockedReason="Najprej vpišite ime agenta."
          onDiscard={draft.discard}
          onSave={() => {
            setSaving(true);
            window.setTimeout(() => {
              const next = { ...saved, ...draft.changes };
              setSaved(next);
              draft.commit(next);
              setSaving(false);
              toast.success('Nastavitve so shranjene.');
            }, 500);
          }}
        />
      </Section>

      <Section
        id="iskanje-filtri"
        title="Iskanje in filtri"
        note="SearchField: namig pove, kaj se vpiše (nikoli glagol), gumb za brisanje je naš. Segmented: preklop pogleda med nekaj kratkimi možnostmi, pod 480 px postane izbirnik. FilterChips: filter po stanju s številom vrstic, na telefonu se prelomi."
      >
        <div className="flex min-w-0 flex-col gap-5">
          <Row label="SearchField">
            <SearchField
              label="Iskanje po pogovorih"
              placeholder="Ime, tema ali povzetek"
              value={query}
              onChange={setQuery}
              className="w-full sm:w-80"
            />
          </Row>
          <Row label="Segmented">
            <Segmented<Period>
              label="Obdobje"
              value={period}
              onChange={setPeriod}
              options={[
                { value: '7', label: 'Zadnjih 7 dni' },
                { value: '30', label: 'Zadnjih 30 dni' },
                { value: 'all', label: 'Vse' },
              ]}
            />
          </Row>
          <Row label="FilterChips (beseda na čipu je ista kot v vrstici)">
            <FilterChips<LeadFilter>
              label="Stanje kontakta"
              value={leadFilter}
              onChange={setLeadFilter}
              options={[
                { value: 'all', label: 'Vsi', count: LEAD_COUNTS.all },
                ...LEAD_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS[s].label, count: LEAD_COUNTS[s] })),
              ]}
            />
          </Row>
        </div>
      </Section>

      <Section
        id="izbirne-kartice"
        title="Izbirne kartice (ChoiceCard) in čas (TimeSelect)"
        note="Velika izbira med nekaj možnostmi: izbirni krožec levo, ikona, naslov, opis, po potrebi noga. Pravi radijski gumb pokriva vso kartico, zato delujejo klik, tipkovnica in bralnik zaslona."
      >
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-fg">Način dogovarjanja terminov</legend>
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <ChoiceCard
              name="gallery-mode"
              value="request"
              checked={mode === 'request'}
              onSelect={() => setMode('request')}
              icon={Inbox}
              title="Povpraševanje"
              description="Agent zapiše želeni termin, vi ga potrdite po e-pošti. Deluje brez koledarja."
              footer={mode === 'request' ? 'Trenutno velja' : undefined}
            />
            <ChoiceCard
              name="gallery-mode"
              value="auto"
              checked={mode === 'auto'}
              onSelect={() => setMode('auto')}
              icon={CalendarCheck}
              title="Samodejna rezervacija"
              aside={<Badge>Potrebuje koledar</Badge>}
              description="Agent ponudi proste termine iz vašega Google Koledarja in termin vpiše sam."
              footer={mode === 'auto' ? 'Trenutno velja' : undefined}
            />
          </div>
        </fieldset>
        <div className="mt-5 flex min-w-0 flex-wrap items-end gap-3">
          <Field label="Ponedeljek, od" className="w-32">
            <TimeSelect value="08:00" onValueChange={() => undefined} disabled />
          </Field>
          <Field label="do" className="w-32">
            <TimeSelect value={to} onValueChange={setTo} min="08:15" />
          </Field>
        </div>
      </Section>

      <Section
        id="polja-gumbi"
        title="Polje z opozorilom, gumb v polju, onemogočen gumb"
        note="Opozorilo na polju ne ustavi shranjevanja (napaka ga). Gumb v polju ima svoj obroč fokusa; rob polja zasveti samo, ko je fokus v samem polju. Gumb, ki ga zdaj ni mogoče uporabiti, pove razlog (lebdenje, fokus ali dotik)."
      >
        <div className="grid min-w-0 gap-5 md:grid-cols-2">
          <Field
            label="Pozdrav"
            warning="V pozdravu ni navedeno, da je agent AI pomočnik. Dodajte na primer »AI pomočnik«."
          >
            <Input defaultValue="Pozdravljeni, sem Jan. Kako vam lahko pomagam?" />
          </Field>
          <Field label="Geslo" hint="Reža trailing: gumb na koncu polja.">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={
                <Button variant="ghost" size="sm" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? 'Skrij' : 'Pokaži'}
                </Button>
              }
            />
          </Field>
        </div>
        <div className="mt-5">
          <Row label="Onemogočen gumb z razlogom (disabledReason)">
            <Button icon={RefreshCw} disabledReason="Najprej uvozite spletno stran ali vključite vsaj eno stran.">
              Znova preberi strani
            </Button>
            <Button variant="danger" onClick={() => setTypedOpen(true)}>
              Odpri potrditev z vpisom
            </Button>
          </Row>
        </div>
        <TypedConfirmDialog
          open={typedOpen}
          onOpenChange={setTypedOpen}
          title="Izbrišem uporabniški račun »Spletnost«?"
          description="Izbrisali se bodo agent, viri znanja, pogovori, kontakti in rezervacije. Tega ni mogoče razveljaviti."
          fieldLabel="Za potrditev vpišite ime podjetja"
          expected="Spletnost"
          confirmLabel="Izbriši uporabniški račun"
          onConfirm={() => {
            toast.info('Predogled gradnika: nič ni bilo izbrisano.');
          }}
        />
      </Section>

      <Section
        id="dejstva-stevilke"
        title="Dejstva (FactList), številke v vrstici (Stat inline), paket (PlanCard)"
        note="Dejstva ene stvari: tiha oznaka nad vrednostjo. Številke znotraj kartice: Stat brez okvira. Paket je povsod ista kartica z istimi imeni vrstic."
      >
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card>
            <CardHeader title="Naročnina" action={<StatusPill tone="info">{TRIAL.pill}</StatusPill>} />
            <CardBody className="flex flex-col gap-5">
              <FactList
                items={[
                  { label: 'Paket', value: 'Brez paketa' },
                  { label: TRIAL.name, value: `${formatTrialTerms({ days: 14, minutes: 30 })}, ${formatDaysLeft(9)}` },
                  { label: 'Konec obdobja', value: formatDate(NOW + 9 * DAY) },
                  { label: 'E-naslov za obvestila', value: 'info@example.si' },
                ]}
              />
              <div className="flex min-w-0 flex-wrap gap-x-8 gap-y-4 border-t border-border pt-4">
                <Stat variant="inline" label={COUNT_LABELS.conversationsInPeriod.label} value="20" sub={COUNT_LABELS.conversationsInPeriod.sub} />
                <Stat variant="inline" label={COUNT_LABELS.outcome.lead} value="3" />
                <Stat variant="inline" label={COUNT_LABELS.outcome.booking} value="5" />
                <Stat variant="inline" label={COUNT_LABELS.withContact} value="8" />
              </div>
            </CardBody>
          </Card>
          <PlanCard
            plan={SAMPLE_PLAN}
            current
            action={
              <Button block icon={Plus}>
                Izberi paket Pro
              </Button>
            }
          />
        </div>
      </Section>

      <Section
        id="tabela-telefon"
        title="Tabela na telefonu (stackBelow) in zavihki"
        note="Ko je okvir tabele ožji od stackBelow, vsaka vrstica postane kartica »oznaka: vrednost«. Nič se ne pomika vodoravno in noben stolpec ni skrit. Desni primer je ista tabela v ozkem okviru. Zavihki so pod 480 px čipi, ki se prelomijo v več vrstic; neaktiven zavihek ne zavzame prostora."
      >
        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {[0, 1].map((i) => (
            <Card key={i}>
              <Table minWidth={560} stackBelow={520} caption="Izdani računi">
                <THead>
                  <TR>
                    <TH>Številka</TH>
                    <TH>Datum</TH>
                    <TH>Opis</TH>
                    <TH numeric>Znesek</TH>
                    <TH>Stanje</TH>
                  </TR>
                </THead>
                <TBody>
                  {INVOICES.map((inv) => (
                    <TR key={inv.id}>
                      <TD nowrap className="font-mono text-sm">
                        {inv.id}
                      </TD>
                      <TD nowrap label="Datum">
                        {formatDate(inv.date)}
                      </TD>
                      <TD muted label="Opis">
                        {inv.what}
                      </TD>
                      <TD numeric label="Znesek">
                        {formatEurExact(inv.amount)}
                      </TD>
                      <TD label="Stanje">
                        <StatusPill tone="success">Plačano</StatusPill>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Tabs defaultValue="wp">
            <TabsList aria-label="Kje vstavite kodo">
              <TabsTrigger value="wp">WordPress</TabsTrigger>
              <TabsTrigger value="drugi">Drugi urejevalniki</TabsTrigger>
              <TabsTrigger value="izdelovalec">Izdelovalec strani</TabsTrigger>
            </TabsList>
            <TabsContent value="wp" className="flex flex-col gap-2">
              <p className="text-base text-fg-muted">Kodo prilepite v nogo strani z vtičnikom za dodajanje kode.</p>
            </TabsContent>
            <TabsContent value="drugi" className="flex flex-col gap-2">
              <p className="text-base text-fg-muted">V nastavitvah strani poiščite polje za kodo po meri.</p>
            </TabsContent>
            <TabsContent value="izdelovalec" className="flex flex-col gap-2">
              <p className="text-base text-fg-muted">Pošljite mu kodo in prošnjo, naj jo vstavi pred zaključno oznako body.</p>
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      <Section
        id="koraki"
        title="Koraki (StepList) in dolgo besedilo (ClampedText)"
        note="Številka ali kljukica, naslov, stanje z besedo, ena vrstica, po potrebi eno dejanje. Za sezname »Kaj še manjka« in korake namestitve."
      >
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Trije koraki do delujočega agenta" divider />
            <StepList
              steps={[
                { id: 'koda', title: 'Kopirajte kodo', detail: 'Kodo ste kopirali.', state: 'done' },
                {
                  id: 'domena',
                  title: 'Vpišite dovoljeno domeno',
                  detail: 'Pripomoček deluje samo na tej domeni.',
                  state: 'current',
                  action: (
                    <Button size="sm" variant="primary">
                      Vpiši domeno
                    </Button>
                  ),
                },
                { id: 'pogovor', title: 'Prvi pogovor s te domene', detail: 'Pojavi se sam, ko je koda na strani.', state: 'waiting' },
              ]}
            />
          </Card>
          <Card>
            <CardHeader title="Povzetek pogovora" />
            <CardBody>
              <ClampedText
                lines={2}
                text="Gospa Kovač vodi računovodski servis in želi novo spletno stran. Zanimala jo je cena in kaj je vključeno. Rezervirala je brezplačen posvet. Dogovorili so se za posvet po telefonu, termin je vpisan v koledar in potrditev je poslana na njen e-naslov."
              />
            </CardBody>
          </Card>
        </div>
      </Section>

      <Section
        id="stanje-agenta"
        title="Stanje agenta: ena razlaga povsod"
        note="Besedila so v labels.ts (AGENT_STATUS_HELP, PAUSED_BY). Kjer je ob oznaki prostor za stavek, zaslon izpiše to besedilo; v zgornji vrstici je v namigu oznake. Štirje razlogi ustavitve so ločeni: odprava enega ne odpravi drugega."
      >
        <Card>
          <ul>
            {(Object.keys(AGENT_STATUS) as AgentStatus[]).map((s) => (
              <li key={s} className="flex min-w-0 flex-col gap-1 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
                <span className="shrink-0 sm:w-56">
                  <StatusPill tone={AGENT_STATUS[s].tone}>{agentStatusText(s)}</StatusPill>
                </span>
                <span className="min-w-0 text-base text-fg">{AGENT_STATUS_HELP[s]}</span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
          {(Object.keys(PAUSED_BY) as PausedBy[]).map((r) => (
            <Notice key={r} size="sm" tone="warning" live={false} title={PAUSED_BY[r].label}>
              {PAUSED_BY[r].help}
            </Notice>
          ))}
        </div>
      </Section>

      <Section
        id="datumi"
        title="Datumi, čas in trajanje: eno pravilo"
        note="Vse izpiše format.ts. V seznamih: danes, včeraj, jutri, sicer dan v tednu z datumom. Čas je vedno 24-urni. Trajanje je v besedah, nikoli 08:18."
      >
        <Card>
          <CardBody>
            <FactList
              columns={3}
              items={[
                { label: 'formatRelativeDateTime, danes', value: formatRelativeDateTime(NOW - 2 * 3_600_000) },
                { label: 'včeraj', value: formatRelativeDateTime(NOW - DAY) },
                { label: 'pred tremi dnevi', value: formatRelativeDateTime(NOW - 3 * DAY) },
                { label: 'jutri', value: formatRelativeDateTime(NOW + DAY) },
                { label: 'formatWeekdayDate', value: formatWeekdayDate(NOW + 4 * DAY) },
                { label: 'formatDate', value: formatDate(NOW) },
                { label: 'formatDuration(498)', value: formatDuration(498) },
                { label: 'formatTimecode(84), oznaka v prepisu', value: formatTimecode(84) },
                { label: `E-sporočili: ${EMAIL_KIND.owner_notification} / ${EMAIL_KIND.visitor_confirmation}`, value: 'eno ime za vsako' },
              ]}
            />
          </CardBody>
        </Card>
      </Section>

      <Section
        id="pripomocek-barve"
        title="Pripomoček v barvi stranke in kopiranje brez odložišča"
        note="Pripomoček je slika tega, kar vidi obiskovalec na strankini strani, zato ne sledi naši temi: telo je vedno svetlo, glava v strankini barvi. Vir odgovorov izbere replySource. Kopiranje: onCopied se sproži samo ob resničnem uspehu, onFallback, ko je besedilo samo označeno."
      >
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-wrap gap-5">
            <AgentWidget
              agentName="Jan"
              businessName="Frizerski salon Lana"
              firstMessage="Pozdravljeni, sem Jan, AI pomočnik salona Lana. Kako vam lahko pomagam?"
              accentHex={WIDGET_COLORS[3]?.hex}
              replySource="demo"
              className="h-[26rem]"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <CodeBlock
              label="Koda za vgradnjo"
              code={'<script src="https://widget.example/v1.js" data-agent="agt_vzorec" async></script>'}
              onCopied={() => setCodeNote('Koda je kopirana.')}
              onFallback={() => setCodeNote(copyFallbackSentence('Kodo'))}
            />
            {codeNote ? (
              <Notice size="sm" tone="neutral">
                {codeNote}
              </Notice>
            ) : null}
            <Row label="Gumb samo z ikono v polju">
              <Input
                className="w-64"
                defaultValue="spletnost.si"
                aria-label="Dovoljena domena"
                trailing={<IconButton size="sm" icon={RefreshCw} label="Ponastavi na domeno spletne strani" />}
              />
            </Row>
          </div>
        </div>
      </Section>
    </>
  );
}

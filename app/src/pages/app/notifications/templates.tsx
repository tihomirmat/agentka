import type { ReactNode } from 'react';
import type { Conversation } from '@/data/types';

/*
 * Default texts of the two e-mails. The api has no "get the default text" function and screens
 * may not read sample.ts, so the two texts are written out here, identical to the ones every
 * account starts with (src/data/sample.ts). Keep them in sync if those change.
 */
export const DEFAULT_VISITOR_TEMPLATE = `Pozdravljeni, {{ime}},

hvala za pogovor z našim pomočnikom. Tukaj je povzetek:

{{povzetek}}

Dogovorjeno: {{dogovorjeno}}

Če želite kaj dodati ali spremeniti, odgovorite na to sporočilo.

Lep pozdrav,
{{podjetje}}`;

export const DEFAULT_OWNER_TEMPLATE = `Nov pogovor na vaši spletni strani.

Obiskovalec: {{ime}}
E-pošta: {{eposta}}
Telefon: {{telefon}}

Povzetek: {{povzetek}}

Dogovorjeno: {{dogovorjeno}}

Celoten zapis pogovora: {{povezava}}`;

export interface TemplateVariable {
  /** name between the double braces */
  name: string;
  /** what it becomes, in plain words */
  hint: string;
}

/** The variables the templates of every account already use (see the default texts above). */
export const VARIABLES: TemplateVariable[] = [
  { name: 'ime', hint: 'Ime obiskovalca' },
  { name: 'eposta', hint: 'E-naslov obiskovalca' },
  { name: 'telefon', hint: 'Telefonska številka obiskovalca' },
  { name: 'podjetje', hint: 'Ime vašega podjetja' },
  { name: 'povzetek', hint: 'Povzetek pogovora' },
  { name: 'dogovorjeno', hint: 'Kaj je bilo dogovorjeno' },
  { name: 'povezava', hint: 'Povezava do zapisa pogovora' },
];

/** Variables offered as chips: the visitor gets no link to the business's own record. */
export const VISITOR_VARIABLES = ['ime', 'podjetje', 'povzetek', 'dogovorjeno'];
export const OWNER_VARIABLES = ['ime', 'eposta', 'telefon', 'podjetje', 'povzetek', 'dogovorjeno', 'povezava'];

const VARIABLE_RE = /\{\{\s*([^{}\s]+)\s*\}\}/g;

/** Names written between {{ }} that are not a known variable (typos), without duplicates. */
export function unknownVariables(template: string): string[] {
  const known = new Set(VARIABLES.map((v) => v.name));
  const found = new Set<string>();
  for (const m of template.matchAll(VARIABLE_RE)) {
    const name = m[1];
    if (name && !known.has(name)) found.add(name);
  }
  return [...found];
}

/** The values of a real conversation; without one, each variable shows its own name in brackets. */
export function valuesFor(conversation: Conversation | undefined, business: string): Record<string, string> {
  if (!conversation) {
    return Object.fromEntries(VARIABLES.map((v) => [v.name, `[${v.name}]`]));
  }
  return {
    ime: conversation.visitor_name ?? '(brez imena)',
    eposta: conversation.visitor_email ?? '(ni vpisan)',
    telefon: conversation.visitor_phone ?? '(ni vpisan)',
    podjetje: business,
    povzetek: conversation.summary,
    dogovorjeno: conversation.agreed ?? 'Ni bilo dogovora.',
    povezava: '(povezava do zapisa pogovora)',
  };
}

/** The template with every known variable replaced and marked, so the person sees what came from where. */
export function renderTemplate(template: string, values: Record<string, string>): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of template.matchAll(VARIABLE_RE)) {
    const name = m[1] ?? '';
    const value = values[name];
    const at = m.index ?? 0;
    if (at > last) parts.push(template.slice(last, at));
    if (value === undefined) {
      parts.push(m[0]);
    } else {
      parts.push(
        <mark key={key++} className="rounded-sm bg-accent-soft px-0.5 text-accent-soft-fg">
          {value}
        </mark>,
      );
    }
    last = at + m[0].length;
  }
  if (last < template.length) parts.push(template.slice(last));
  return parts;
}

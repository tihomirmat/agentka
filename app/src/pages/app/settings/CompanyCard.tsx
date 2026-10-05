import { useState, type FormEvent } from 'react';
import { Card, CardBody, CardHeader, Field, Input, Select, useToast } from '@/components/ui';
import * as api from '@/data/api';
import { LANGUAGES, TIMEZONES } from '@/data/labels';
import { SaveFooter } from './SaveFooter';
import { useDraft } from './useDraft';

const HOST_RE = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;

/** Accepts "firma.si", "www.firma.si/kontakt" or "https://firma.si"; returns the stored form. */
function parseWebsite(input: string): { value: string; error: string | null } {
  const raw = input.trim();
  if (!raw) return { value: '', error: null };
  const bad = { value: raw, error: 'Naslov spletne strani ni pravilno zapisan. Primer: vasepodjetje.si' };
  if (/\s/.test(raw)) return bad;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!HOST_RE.test(url.hostname)) return bad;
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return { value: `https://${url.host}${path}`, error: null };
  } catch {
    return bad;
  }
}

export function CompanyCard({ account }: { account: api.Account }) {
  const toast = useToast();
  const saveAccount = api.useAction(api.updateAccount);
  const saveAgent = api.useAction(api.updateAgent);
  const [attempted, setAttempted] = useState(false);

  const form = useDraft({
    name: account.name,
    website: account.website_url.replace(/^https?:\/\//i, ''),
    language: account.language,
    timezone: account.timezone,
  });
  const draft = form.value;

  const site = parseWebsite(draft.website);
  const nameError = draft.name.trim() ? undefined : 'Vpišite ime podjetja.';
  const siteError = site.error ?? undefined;

  const languageOptions = LANGUAGES.map((l) => ({ value: l.value, label: l.label }));
  const timezoneOptions = TIMEZONES.some((t) => t.value === account.timezone)
    ? TIMEZONES
    : [...TIMEZONES, { value: account.timezone, label: account.timezone }];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (nameError || siteError) return;
    const saved = await saveAccount.run({
      name: draft.name.trim(),
      website_url: site.value,
      language: draft.language,
      timezone: draft.timezone,
    });
    if (!saved) return;
    // The language is the agent's language too, so both records stay the same.
    if (draft.language !== account.language) {
      const agent = await saveAgent.run({ language: draft.language });
      if (!agent) return;
    }
    setAttempted(false);
    toast.success('Podatki o podjetju so shranjeni.');
  }

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader title="Podjetje" description="Ime in spletna stran podjetja, jezik agenta in časovni pas." />
        <CardBody>
          <div className="grid min-w-0 gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Ime podjetja" required error={attempted ? nameError : undefined}>
              <Input value={draft.name} onChange={(e) => form.patch({ name: e.target.value })} autoComplete="organization" />
            </Field>
            <Field
              label="Naslov spletne strani"
              optional
              error={attempted ? siteError : undefined}
              hint="Uvoz strani za agenta poženete v Virih znanja."
            >
              <Input
                prefix="https://"
                value={draft.website}
                placeholder="vasepodjetje.si"
                inputMode="url"
                autoComplete="url"
                onChange={(e) => form.patch({ website: e.target.value })}
              />
            </Field>
            <Field label="Jezik agenta" hint="V tem jeziku agent govori z obiskovalci.">
              <Select
                value={draft.language}
                options={languageOptions}
                onValueChange={(language) => form.patch({ language })}
              />
            </Field>
            <Field label="Časovni pas" hint="Uporabi se za delovni čas in termine.">
              <Select
                value={draft.timezone}
                options={timezoneOptions}
                onValueChange={(timezone) => form.patch({ timezone })}
              />
            </Field>
          </div>
        </CardBody>
        <SaveFooter
          dirty={form.dirty}
          pending={saveAccount.pending || saveAgent.pending}
          error={saveAccount.error ?? saveAgent.error}
          onReset={() => {
            form.reset();
            setAttempted(false);
          }}
        />
      </form>
    </Card>
  );
}

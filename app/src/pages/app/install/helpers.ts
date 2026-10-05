/** What the api keeps as the allowed domain: no protocol, no path (api.updateAgent does the same). */
export function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
}

const HOST_RE = /^([\p{L}\p{N}]([\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+\p{L}{2,}$/iu;

/** An empty domain is allowed (nothing is set yet); anything else must look like a host name. */
export function domainError(domain: string): string | undefined {
  if (!domain) return undefined;
  if (domain.length > 253 || !HOST_RE.test(domain)) {
    return 'Domena ni pravilno zapisana. Primer: vasepodjetje.si';
  }
  return undefined;
}

/** The ready message a customer can send to whoever builds their website. */
export function builderMessage(opts: { code: string; business: string; agentName: string; domain: string }): string {
  const { code, business, agentName, domain } = opts;
  const site = domain ? `spletno stran ${domain}` : 'našo spletno stran';
  const lines = [
    'Pozdravljeni,',
    '',
    `na ${site} bi radi dodali AI pomočnika »${agentName}«. Prosim vas, da na vseh straneh, kjer naj se pripomoček prikaže, v nogo strani (tik pred zaključno oznako </body>) vstavite to vrstico kode:`,
    '',
    code,
    '',
    'Vrstice ni treba spreminjati. Ko je koda vstavljena, nam prosim sporočite, da lahko pripomoček preizkusimo.',
    '',
    business ? `Hvala in lep pozdrav,\n${business}` : 'Hvala in lep pozdrav',
  ];
  return lines.join('\n');
}

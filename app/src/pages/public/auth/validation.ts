/**
 * Checks for the sign-in and sign-up forms. Every message says what is wrong and what
 * to do (CONVENTIONS: "Errors"). They return null when the value is fine.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailError(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Vpišite e-naslov. Primer: ime@podjetje.si';
  if (!EMAIL_RE.test(v)) return 'E-naslov ni pravilno zapisan. Primer: ime@podjetje.si';
  return null;
}

/** A host name such as "salon-lana.si" or "čebelarstvo.si" (letters from any language, digits, hyphens). */
const HOST_RE = /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+\p{L}{2,63}$/u;
const SCHEME_RE = /^https?:\/\//i;

export type WebsiteCheck = { ok: true; url: string } | { ok: false; message: string };

/**
 * Accepts "vasepodjetje.si", "www.vasepodjetje.si/kontakt" and "https://vasepodjetje.si".
 * `url` is the cleaned address with a scheme ("https://" when the person left it out).
 */
export function checkWebsite(raw: string): WebsiteCheck {
  const v = raw.trim();
  if (!v) {
    return { ok: false, message: 'Vpišite naslov svoje spletne strani. Primer: vasepodjetje.si' };
  }
  const scheme = SCHEME_RE.exec(v)?.[0].toLowerCase() ?? 'https://';
  const rest = v.replace(SCHEME_RE, '');
  const host = (rest.split(/[/?#]/)[0] ?? '').replace(/:\d{1,5}$/, '');
  const invalid =
    /\s/.test(rest) || /^[a-z][a-z0-9+.-]*:\/\//i.test(rest) || host.length > 253 || !HOST_RE.test(host);
  if (invalid) {
    return { ok: false, message: 'Naslov spletne strani ni pravilno zapisan. Primer: vasepodjetje.si' };
  }
  return { ok: true, url: `${scheme}${rest.replace(/\/+$/, '')}` };
}

export const PASSWORD_MIN = 8;

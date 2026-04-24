import { toUnicodeDomainName } from '@namefi-astra/registrars/lib/data/validations';

/** Render a punycode domain as unicode; fall back to the input on decode error. */
export function safeToUnicode(domain: string): string {
  try {
    return toUnicodeDomainName(domain);
  } catch {
    return domain;
  }
}

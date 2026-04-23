import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

/**
 * Browser-safe twin of the backend helper at
 * `apps/backend/src/lib/namefi-registry.ts`
 * (`computeDefaultAdditionalAllowedHostnames`). Used by the Powered-by-
 * Namefi admin form to preview the default `additionalAllowedHostnames`
 * list that will be seeded on create. Keep the rules in sync with the
 * backend.
 */
export function computeDefaultAdditionalAllowedHostnames(
  normalizedDomainName: string,
  firstPartyHostnames: readonly string[],
): string[] {
  const set = new Set(firstPartyHostnames);
  const out: string[] = [];
  if (set.has('poweredby.namefi.io')) {
    out.push(
      `${normalizedDomainName}.astra.namefi.io`,
      `${normalizedDomainName}.poweredby.namefi.io`,
    );
  }
  if (set.has('poweredby.namefi.dev')) {
    out.push(
      `${normalizedDomainName}.astra.namefi.dev`,
      `${normalizedDomainName}.poweredby.namefi.dev`,
    );
  }
  if (set.has('localhost')) {
    out.push(`${normalizedDomainName}.localhost`);
  }
  return out;
}

/**
 * True when `domain` is a bare TLD (single DNS label). Used to render the
 * "Vercel N/A" state in the admin setup UI — Vercel's Domains API rejects
 * single-label names.
 */
export function isTldOnly(
  domain: NamefiNormalizedDomain | string | null | undefined,
): boolean {
  if (!domain) return false;
  const parsed = parseDomainName(domain as NamefiNormalizedDomain);
  return parsed.valid && parsed.labels.length === 1;
}

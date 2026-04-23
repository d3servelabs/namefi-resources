import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';

/**
 * Vercel's Domains API (`POST /projects/{idOrName}/domains`) rejects
 * single-label names (TLDs) with HTTP 400 — TLDs cannot be provisioned
 * as Vercel domains.
 *
 * Returns `true` iff the Vercel API will accept `domain` for addition to
 * a project. Only valid FQDNs with at least two labels qualify.
 */
export function isVercelProvisionable(
  domain: NamefiNormalizedDomain | string,
): boolean {
  const parsed = parseDomainName(domain as NamefiNormalizedDomain);
  if (!parsed.valid) return false;
  return parsed.labels.length >= 2;
}

export type VercelNotApplicableReason = 'tld' | 'invalid-domain';

/**
 * Thrown by Vercel client methods when the caller's domain is not
 * provisionable as a Vercel resource (most commonly a TLD). Callers
 * should catch this specifically to translate it into a user-facing
 * "N/A" state rather than bubbling as a generic 500.
 */
export class VercelNotApplicableError extends Error {
  readonly domain: string;
  readonly reason: VercelNotApplicableReason;

  constructor(domain: string, reason: VercelNotApplicableReason) {
    super(
      reason === 'tld'
        ? `Domain "${domain}" is a TLD and cannot be provisioned as a Vercel project domain.`
        : `Domain "${domain}" is not a valid FQDN and cannot be provisioned as a Vercel project domain.`,
    );
    this.name = 'VercelNotApplicableError';
    this.domain = domain;
    this.reason = reason;
  }
}

/**
 * Convenience helper: resolves the reason a domain is not Vercel-
 * provisionable, or `null` if it is.
 */
export function vercelApplicabilityReason(
  domain: NamefiNormalizedDomain | string,
): VercelNotApplicableReason | null {
  const parsed = parseDomainName(domain as NamefiNormalizedDomain);
  if (!parsed.valid) return 'invalid-domain';
  if (parsed.labels.length < 2) return 'tld';
  return null;
}

import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

const HOSTNAME_CLEANUP_RE = /^(?:https?:\/\/)?/i;
const HOSTNAME_SEGMENT_RE = /[/?#]/;
const TRAILING_DOT_RE = /\.$/;
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function normalizeLeadgenDomain(
  input: string,
): NamefiNormalizedDomain | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(HOSTNAME_CLEANUP_RE, '');
  const hostCandidate = withoutProtocol
    .split(HOSTNAME_SEGMENT_RE)[0]
    ?.replace(TRAILING_DOT_RE, '');
  if (!hostCandidate?.includes('.')) return null;

  const parsed = parseDomainName(hostCandidate as NamefiNormalizedDomain);
  if (parsed.valid && parsed.publicSuffixPlusOne) {
    return parsed.publicSuffixPlusOne.toLowerCase() as NamefiNormalizedDomain;
  }

  if (!DOMAIN_RE.test(hostCandidate)) {
    return null;
  }

  return hostCandidate as NamefiNormalizedDomain;
}

export function normalizeLeadgenEmail(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  const [localPart, domainPart, extraPart] = trimmed.split('@');
  if (!localPart || !domainPart || extraPart !== undefined) return null;
  if (trimmed.length > 320) return null;
  if (!DOMAIN_RE.test(domainPart)) return null;
  return trimmed;
}

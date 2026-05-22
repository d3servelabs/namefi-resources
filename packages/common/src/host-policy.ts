/**
 * Host indexing policy for the Namefi multi-host platform.
 *
 * The platform serves many subdomains under namefi.io (and namefi.dev for
 * staging). Default policy is **deny**: any host not on the explicit
 * INDEXABLE_HOSTS allowlist is treated as non-indexable by both
 * robots.txt (Disallow: /) and middleware (X-Robots-Tag: noindex,nofollow).
 *
 * Adding a host to INDEXABLE_HOSTS is an explicit decision that this
 * surface is intended for public search. Reviewers should challenge
 * additions.
 *
 * Some non-indexable hosts also have a canonical redirect target — when
 * a user lands on a deprecated/duplicate host (e.g., astra.namefi.io that
 * serves the same code as namefi.io), we 308 them to the canonical host
 * so existing links keep working and SEO rank consolidates.
 */

/**
 * Hosts whose pages may appear in search engine results.
 *
 * Includes the production and dev apex domains. Everything else — APIs,
 * internal proxy origins, machine metadata endpoints, tenant subdomains,
 * deprecated hosts — is non-indexable.
 */
export const INDEXABLE_HOSTS: ReadonlySet<string> = new Set([
  'namefi.io',
  'namefi.dev',
]);

/**
 * Hosts that should 308 redirect to a canonical equivalent.
 *
 * Used for:
 * - apex normalization (www.* → apex)
 * - deprecated hosts that serve the same code (astra.namefi.io → namefi.io)
 * - retired hosts (app.namefi.io was the old version; redirect any stragglers)
 *
 * Value is the absolute origin to redirect to; the path and query string
 * are preserved by the middleware that consumes this map.
 */
export const HOST_CANONICAL_REDIRECTS: ReadonlyMap<string, string> = new Map([
  ['www.namefi.io', 'https://namefi.io'],
  ['astra.namefi.io', 'https://namefi.io'],
  ['app.namefi.io', 'https://namefi.io'],
  ['www.namefi.dev', 'https://namefi.dev'],
  ['astra.namefi.dev', 'https://namefi.dev'],
]);

/**
 * Strip port and lowercase a host header value.
 *
 * Browsers and proxies sometimes include a port (e.g., `localhost:3000`)
 * or vary capitalization. Comparison-friendly form is "bare" host.
 */
export function bareHost(host: string | null | undefined): string {
  if (!host) return '';
  return host.split(':')[0].toLowerCase();
}

/**
 * True iff the host is on the public-indexable allowlist.
 *
 * Use this for both robots.txt decisions (Allow vs Disallow) and
 * X-Robots-Tag header decisions (omit vs noindex,nofollow).
 */
export function isIndexableHost(host: string | null | undefined): boolean {
  return INDEXABLE_HOSTS.has(bareHost(host));
}

/**
 * Returns the canonical origin to 308 redirect to, or undefined when the
 * host has no canonical redirect rule. Callers should preserve the
 * incoming pathname and search string.
 */
export function getCanonicalRedirect(
  host: string | null | undefined,
): string | undefined {
  return HOST_CANONICAL_REDIRECTS.get(bareHost(host));
}

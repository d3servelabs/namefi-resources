// Hosts owned by us — outbound links to these keep SEO link equity (no nofollow).
const FIRST_PARTY_HOSTS = ['namefi.io', 'd3serve.xyz'];

const isFirstPartyHost = (host: string): boolean =>
  FIRST_PARTY_HOSTS.some(
    (entry) => host === entry || host.endsWith(`.${entry}`),
  );

/**
 * Compute the `rel` attribute for an outbound link. Callers pair this with
 * `target="_blank"`, so the result is always **at least** `noopener`.
 *
 * - `noopener` is always set (severs `window.opener` on `target="_blank"` tabs,
 *   guarding against reverse tab-nabbing) but intentionally WITHOUT
 *   `noreferrer`, so destination sites still see namefi.io as the traffic
 *   source in their analytics.
 * - `nofollow` is added for any http(s) host that is not first-party
 *   (`namefi.io` / `d3serve.xyz` and their subdomains), so search engines don't
 *   treat our outbound citations as PageRank-passing endorsements.
 *
 * Non-http(s) hrefs (`mailto:`, `tel:`, relative paths) get a bare `noopener`:
 * `nofollow` is meaningless there, but the tab-safety floor must not be lost.
 */
export function getExternalLinkRel(href: string | undefined | null): string {
  if (!href) return 'noopener';
  let host: string;
  try {
    const url = new URL(href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      return 'noopener';
    host = url.hostname.toLowerCase();
  } catch {
    return 'noopener';
  }
  return isFirstPartyHost(host) ? 'noopener' : 'noopener nofollow';
}

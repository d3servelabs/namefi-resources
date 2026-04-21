export interface RelayMatch {
  logicalHost: string;
  relayZone: string;
}

function normalizeSuffix(value: string): string {
  return value.toLowerCase().replace(/^\.+|\.+$/g, '');
}

/**
 * Detects whether `host` is a relay-form alias under `relayZone` and, if so,
 * returns the logical host with the relay suffix stripped.
 *
 * The relay zone (e.g. `gtld.namefi.dev`) is a real DNS zone that fronts
 * logical Namefi domains that don't live in public DNS (for example
 * unofficial TLDs like `.nfi`). A request for `sami.nfi.gtld.namefi.dev`
 * should render the parking page for `sami.nfi`.
 *
 * Matching rules:
 * - Suffix match on `.{relayZone}` (anchored; substring-match rejected).
 * - At least one label must precede the relay zone — the relay zone apex
 *   itself (`gtld.namefi.dev`) is not rewritten.
 * - The park app does not validate that the logical host uses an unofficial
 *   TLD; any suffix match is stripped. The backend authoritative DNS server
 *   is the source of truth for which logical names actually resolve, and any
 *   logical host we can't find data for renders the generic fallback.
 *
 * @example
 *   matchRelayHost('sami.nfi.gtld.namefi.dev', { relayZone: 'gtld.namefi.dev' })
 *   // => { logicalHost: 'sami.nfi', relayZone: 'gtld.namefi.dev' }
 */
export function matchRelayHost(
  host: string,
  { relayZone }: { relayZone: string },
): RelayMatch | null {
  const normalizedRelay = normalizeSuffix(relayZone);
  if (!normalizedRelay) return null;

  const normalizedHost = host.toLowerCase().replace(/\.+$/, '');
  const relaySuffix = `.${normalizedRelay}`;
  if (!normalizedHost.endsWith(relaySuffix)) return null;

  const logicalHost = normalizedHost.slice(0, -relaySuffix.length);
  if (!logicalHost) return null;

  return { logicalHost, relayZone: normalizedRelay };
}

/**
 * Returns the logical host for internal data lookups. When `host` ends in the
 * relay zone, returns the stripped logical host; otherwise returns `host`
 * unchanged. The original request host should still be used for anything that
 * transits public DNS (TXT forwarding lookup, share URL).
 */
export function resolveLogicalHost(
  host: string,
  { relayZone }: { relayZone: string },
): string {
  const match = matchRelayHost(host, { relayZone });
  return match ? match.logicalHost : host;
}

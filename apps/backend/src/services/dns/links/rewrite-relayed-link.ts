import type { DnsRequestLink } from '../dns-request-handler.types';
import { mergeLinks } from './combinators';
import { createRelayZoneAuthorityLink } from './relay-zone-authority-link';
import { createUnofficialTldRelayLink } from './unofficial-tld-relay-link';

/**
 * Single-entry link for the relay-zone rewrite flow. Composes two focused
 * primitives via `mergeLinks`:
 *
 * 1. `createRelayZoneAuthorityLink` — short-circuits NS/SOA at the relay
 *    apex, and on NXDOMAIN from downstream injects an Authority SOA
 *    pointing at the relay zone.
 * 2. `createUnofficialTldRelayLink` — if the query is
 *    `<labels>.<unofficialTld>.<relayZone>`, strips the relay suffix for
 *    the downstream chain and rewrites answer `name` fields back on unwind.
 *
 * Callers should gate this link to queries under the relay zone (typically
 * via `switchLink` + `isRelayZoneHost`); when invoked for non-relay queries
 * the composed behavior still works but adds no value over the regular
 * chain.
 */
export function createRewriteRelayedLink(): DnsRequestLink {
  return mergeLinks(
    createRelayZoneAuthorityLink(),
    createUnofficialTldRelayLink(),
  );
}

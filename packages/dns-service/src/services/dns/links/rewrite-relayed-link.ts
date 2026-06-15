/**
 * Single-entry composition for the relay-zone rewrite flow. See
 * `../TREE-SEMANTICS.md` for the tree-semantic model the two inner links
 * cooperate on.
 */

import type { DnsRequestLink } from '../dns-request-handler.types';
import { mergeLinks } from './combinators';
import { createRelayZoneAuthorityLink } from './relay-zone-authority-link';
import { createUnofficialTldRelayLink } from './unofficial-tld-relay-link';

/**
 * Single-entry link for the relay-zone rewrite flow. Composes two focused
 * primitives via `mergeLinks`, outer → inner:
 *
 * 1. `createRelayZoneAuthorityLink` — owns the relay zone's authoritative
 *    view. Answers NS/SOA at the apex directly; clamps any apex NXDOMAIN
 *    to NODATA (RFC 1034 §4.3.2 / RFC 8020 — the zone origin always
 *    exists); attaches the zone SOA in Authority for every empty-Answer
 *    negative response (both NXDOMAIN and NODATA, RFC 2308 §3).
 * 2. `createUnofficialTldRelayLink` — if the query matches
 *    `<labels>.<unofficialTld>.<relayZone>`, strips the relay suffix for
 *    the downstream chain and rewrites Answer/Authority `name` fields
 *    back on unwind. Never touches RCODE.
 *
 * The outer link runs first on the way in and last on the way out, so
 * NS/SOA short-circuit at the apex never reaches the inner rewrite, and
 * Authority/RCODE decoration is applied after names are rewritten back.
 *
 * Callers should gate this link to queries under the relay zone (the
 * V2.1/V2.2 handlers do this via `switchLink` + `isRelayZoneHost`).
 */
export function createRewriteRelayedLink(): DnsRequestLink {
  return mergeLinks(
    createRelayZoneAuthorityLink(),
    createUnofficialTldRelayLink(),
  );
}

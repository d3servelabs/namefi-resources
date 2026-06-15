import { getUnofficialTlds } from '@namefi-astra/utils/parse-domain-name';
import { config } from '#lib/env';
import type { DnsRequestLink } from '../dns-request-handler.types';
import {
  buildNsAndSoaRecordsForZone,
  isRecordZoneApex,
  normalizeZone,
} from './zone-helpers';

/**
 * True when `recordName` sits exactly one label above the relay zone AND
 * that label is one of the declared unofficial TLDs (e.g.
 * `nfi.gtld.namefi.dev` when `NAMEFI_UNOFFICIAL_TLDS` contains `nfi`).
 *
 * These nodes are ENTs of the relay tree by construction: declaring a
 * TLD in the env var is what mints the namespace node. Concrete records
 * live one level deeper (e.g. `sami.nfi`), so the TLD node itself
 * "exists" only because its descendants do — the textbook RFC 8020 case.
 *
 * Callers use this to clamp a downstream NXDOMAIN to NODATA on the TLD
 * apex, matching the tree-semantic rule:
 *
 *     if sami.nfi exists and nfi has no records on its own,
 *     then nfi is an ENT → NODATA, not NXDOMAIN.
 */
export function isUnofficialTldApexUnderRelay(
  recordName: string,
  relayZone: string,
  tlds: readonly string[],
): boolean {
  const normalizedZone = normalizeZone(relayZone);
  if (!normalizedZone) return false;

  const normalizedName = recordName.toLowerCase().replace(/\.+$/, '');
  const zoneSuffix = `.${normalizedZone}`;
  if (!normalizedName.endsWith(zoneSuffix)) return false;

  const candidate = normalizedName.slice(0, -zoneSuffix.length);
  if (candidate === '' || candidate.includes('.')) return false;

  return tlds.some(
    (tld) => tld.toLowerCase().replace(/^\.+|\.+$/g, '') === candidate,
  );
}

/**
 * Owns the relay zone's NS/SOA/Authority semantics.
 *
 * Assumes the caller has already gated this link to queries under the
 * relay zone (see `isRelayZoneHost` + `switchLink` wiring in the V2.1
 * handler, or the `createGatedLink` wrapping in V2.2).
 *
 * Behavior:
 *
 * 1. At the relay-zone apex (e.g. `gtld.namefi.dev` itself):
 *    - NS / SOA queries are answered directly with synthesized records.
 *    - Other types still delegate downstream in case stored records
 *      exist, but because the zone origin *always* exists as a tree
 *      node (RFC 1034 §4.3.2 / RFC 8020), a downstream NXDOMAIN is
 *      downgraded to NODATA on unwind — the apex can never be NXDOMAIN
 *      in a zone we're authoritative for.
 * 2. At the **unofficial-TLD apex** (e.g. `nfi.gtld.namefi.dev` when
 *    `nfi` is in `NAMEFI_UNOFFICIAL_TLDS`): same clamp as case 1. The
 *    TLD node is a tree-level ENT by construction — it exists because
 *    the relay defines the namespace and (usually) has records one
 *    level deeper. Downstream NXDOMAIN from zone-ns-soa / resolvers is
 *    overridden to NODATA here, locally, so the relay zone's authority
 *    over this namespace isn't lost on the way back up the chain.
 * 3. For all other names under the relay zone, delegate downstream and
 *    attach the zone SOA in Authority whenever the result carries no
 *    Answer (both NXDOMAIN and NODATA per RFC 2308 §3). Non-NOERROR /
 *    non-NXDOMAIN RCODEs (e.g. SERVFAIL) are passed through untouched.
 *
 * Contributes to the tree-semantic response described in
 * `../TREE-SEMANTICS.md`. The configured zone is
 * `config.NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE`; NS/SOA records are
 * synthesized from `config.NAMEFI_ASTRA_NAMESERVERS` via
 * `buildNsAndSoaRecordsForZone`.
 */
export function createRelayZoneAuthorityLink(): DnsRequestLink {
  return async (context, next) => {
    const zone = normalizeZone(config.NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE);
    const { recordName, recordType } = context.question;
    const { nsRecords, soaRecords } = buildNsAndSoaRecordsForZone(zone);
    const atApex = isRecordZoneApex(recordName, zone);
    const atTldApex = isUnofficialTldApexUnderRelay(
      recordName,
      zone,
      getUnofficialTlds(),
    );
    // Both the relay apex and a declared-TLD apex are tree-level ENTs
    // from the relay zone's perspective. They must never be NXDOMAIN.
    const isRelayTreeEnt = atApex || atTldApex;

    if (atApex) {
      if (recordType === 'NS') return { RCODE: 0, Answer: nsRecords };
      if (recordType === 'SOA') return { RCODE: 0, Answer: soaRecords };
    }

    const result = await next();

    // Non-empty Answer → authoritative response, nothing to add.
    if (result.Answer && result.Answer.length > 0) {
      return result;
    }

    // Only act on negative responses we own:
    // - NXDOMAIN (RCODE=3): the name does not exist in the tree.
    // - NODATA (RCODE=0, empty Answer): the name exists but carries no
    //   records of the requested type (includes the ENT case).
    // Other RCODEs (SERVFAIL, REFUSED, …) are passed through untouched.
    const downstreamRcode = result.RCODE ?? 3;
    if (downstreamRcode !== 0 && downstreamRcode !== 3) {
      return result;
    }

    // ENT clamp: the relay zone owns this namespace. A downstream
    // NXDOMAIN on the relay apex or an unofficial-TLD apex would
    // violate RFC 8020 (NXDOMAIN cut) — descendants live below these
    // nodes via the relay rewrite, so the nodes themselves must exist
    // as ENTs. Force NOERROR/NODATA.
    const rcode = isRelayTreeEnt ? 0 : downstreamRcode;

    return {
      ...result,
      RCODE: rcode,
      Answer: result.Answer ?? [],
      Authority: soaRecords,
    };
  };
}

import { config } from '#lib/env';
import type { DnsRequestLink } from '../dns-request-handler.types';
import {
  buildNsAndSoaRecordsForZone,
  isRecordZoneApex,
  normalizeZone,
} from './zone-helpers';

/**
 * Owns the relay zone's NS/SOA/Authority semantics.
 *
 * Assumes the caller has already gated this link to queries under the
 * relay zone (see `isRelayZoneHost` + `switchLink` wiring in the V2.1
 * handler).
 *
 * Behavior:
 *
 * 1. At the relay-zone apex (e.g. `gtld.namefi.dev` itself):
 *    - NS / SOA queries are answered directly with synthesized records.
 *    - Other types still delegate downstream in case stored records
 *      exist, but because the zone origin *always* exists as a tree
 *      node (RFC 1034 §4.3.2 / RFC 8020), a downstream NXDOMAIN is
 *      downgraded to NODATA on unwind — the apex can never be
 *      NXDOMAIN in a zone we're authoritative for.
 * 2. For non-apex names under the relay zone, delegate downstream and
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

    // Apex clamp: the zone origin always exists as a tree node. A downstream
    // NXDOMAIN at the apex would violate RFC 8020 (NXDOMAIN cut) because the
    // zone has descendants served through the relay. Force NOERROR/NODATA.
    const rcode = atApex ? 0 : downstreamRcode;

    return {
      ...result,
      RCODE: rcode,
      Answer: result.Answer ?? [],
      Authority: soaRecords,
    };
  };
}

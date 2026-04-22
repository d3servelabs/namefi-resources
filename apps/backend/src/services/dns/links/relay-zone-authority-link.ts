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
 * Assumes the caller has already gated this link to queries under the relay
 * zone (see `isRelayZoneHost` + `switchLink` wiring in the V2.1 handler). The
 * link:
 *
 * 1. Short-circuits NS and SOA queries at the relay-zone apex with
 *    synthesized records — no DB lookup needed.
 * 2. Otherwise delegates downstream, and on NXDOMAIN (RCODE=3) injects an
 *    Authority SOA for the relay zone so clients cache correctly. NODATA
 *    (RCODE=0 with empty Answer) is left untouched.
 *
 * The configured zone is `config.NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE` (e.g.
 * `gtld.namefi.dev`). NS/SOA records are synthesized from
 * `config.NAMEFI_ASTRA_NAMESERVERS` via `buildNsAndSoaRecordsForZone`.
 */
export function createRelayZoneAuthorityLink(): DnsRequestLink {
  return async (context, next) => {
    const zone = normalizeZone(config.NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE);
    const { recordName, recordType } = context.question;
    const { nsRecords, soaRecords } = buildNsAndSoaRecordsForZone(zone);

    if (isRecordZoneApex(recordName, zone)) {
      if (recordType === 'NS') return { RCODE: 0, Answer: nsRecords };
      if (recordType === 'SOA') return { RCODE: 0, Answer: soaRecords };
    }

    const result = await next();

    if (result.Answer && result.Answer.length > 0) {
      return result;
    }

    const rcode = result.RCODE ?? 3;
    if (rcode !== 3) {
      return result;
    }

    return {
      ...result,
      RCODE: 3,
      Answer: result.Answer ?? [],
      Authority: soaRecords,
    };
  };
}

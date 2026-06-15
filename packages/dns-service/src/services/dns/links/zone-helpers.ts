import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { equals, filter, pipe, split, isNotNil, isNotEmpty, both } from 'ramda';
import { config } from '#lib/env';
import { dnsRecordTypeCodes } from '#lib/dns/record-type-codes';
import type { DnsResponse } from '#lib/dns/types';

// Matches the first DNS label (e.g. `ns3.` in `ns3.namefi.dev.`). Used to
// derive the SOA MNAME's admin email by replacing the leading label with
// `admin.`. Kept local here so zone-helpers doesn't pull in the heavier
// `./helpers` module (which imports DB clients).
const nameserverAdminPrefixRegex = /^.*?\./;

const toParts = pipe(split('.'), filter(both(isNotNil, isNotEmpty)));

/**
 * True when `recordName` and `zone` identify the same DNS node
 * (label-wise comparison after filtering empty labels).
 */
export function isRecordZoneApex(
  recordName: NamefiNormalizedDomain | string,
  zone: string,
): boolean {
  return equals(toParts(recordName), toParts(zone));
}

/**
 * Normalizes a zone name for comparison: lowercase, no leading/trailing dots.
 */
export function normalizeZone(zone: string): string {
  return zone.toLowerCase().replace(/^\.+|\.+$/g, '');
}

/**
 * Synthesizes NS and SOA records for `zone` using
 * `config.NAMEFI_ASTRA_NAMESERVERS`. Returns arrays that match the shape of
 * `DnsResponse['Answer']`. Pure — no I/O.
 */
export function buildNsAndSoaRecordsForZone(zone: string): {
  nsRecords: NonNullable<DnsResponse['Answer']>;
  soaRecords: NonNullable<DnsResponse['Answer']>;
} {
  const nsRecords = config.NAMEFI_ASTRA_NAMESERVERS.map((nameserver) => ({
    name: zone,
    type: dnsRecordTypeCodes.get('NS') as number,
    TTL: 300,
    data: nameserver,
  }));
  const primaryNameserver = config.NAMEFI_ASTRA_NAMESERVERS[0];
  const soaRecords = [
    {
      name: zone,
      type: dnsRecordTypeCodes.get('SOA') as number,
      TTL: 300,
      data: `${primaryNameserver} ${primaryNameserver.replace(nameserverAdminPrefixRegex, 'admin.')} 2023080901 60 30 300 60`,
    },
  ];
  return { nsRecords, soaRecords };
}

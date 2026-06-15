/**
 * Serves the Caddy DNS-JWT park-gate authorization token as a TXT record at
 * `<NAMEFI_PARK_GATE_LABEL>.<host>` (e.g. `_namefi-gate.example.com`).
 *
 * This is the DNS-side counterpart of the Caddy plugin under
 * `caddy/namefi-park-gate/`: the plugin looks up this TXT record, verifies
 * the signed JWT locally, and only then proxies the request upstream.
 *
 * The token is issued only for hosts that currently serve parking records
 * (parked or forwarding), so the gate record is part of the parking record
 * set — it appears and disappears with the domain's parking state. The
 * signed JWT itself is Redis-cached by the issuer, so a `_namefi-gate.*`
 * query re-signs at most once per cache window.
 *
 * For any non-gate name (or when the gate is disabled / the host is not
 * parked) the resolver returns `null`, letting the rest of the link chain
 * answer as usual (typically NXDOMAIN for the gate label).
 */

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { dnsRecordTypeCodes } from '#lib/dns/record-type-codes';
import type { DnsStringRecordTypeCode } from '#lib/dns/record-type-codes';
import { config } from '#lib/env';
import type { DnsResponse } from '#lib/dns/types';
import { getDomainManagedDnsState } from '../managed-records';
import {
  formatGateTxtRdata,
  getOrIssueGateToken,
  isParkGateEnabled,
} from '../park-gate/issuer';
import type {
  DnsAnswerResolver,
  DnsRequestLink,
} from '../dns-request-handler.types';
import { createResolvingLink } from './resolving-link';

/**
 * If `recordName` is the gate label for some host, return that host;
 * otherwise return `null`. The comparison is case-insensitive and the label
 * is matched as a literal leading prefix (the security boundary is the JWT
 * signature, not the record name — PRD §9).
 */
export function parseGateHost(
  recordName: string,
  label: string,
): NamefiNormalizedDomain | null {
  const prefix = `${label.toLowerCase()}.`;
  const name = recordName.toLowerCase();
  if (!name.startsWith(prefix)) {
    return null;
  }
  const host = name.slice(prefix.length);
  if (host.length === 0) {
    return null;
  }
  return host as NamefiNormalizedDomain;
}

const TXT_TYPE_CODE = dnsRecordTypeCodes.get('TXT') as number;

export const resolveParkGateAnswer: DnsAnswerResolver = async (
  recordName: NamefiNormalizedDomain,
  recordType: DnsStringRecordTypeCode,
): Promise<DnsResponse | null> => {
  if (recordType !== 'TXT' || !isParkGateEnabled()) {
    return null;
  }

  const host = parseGateHost(recordName, config.NAMEFI_PARK_GATE_LABEL);
  if (!host) {
    return null;
  }

  // Only parked / forwarding hosts get a gate token. A non-managed or
  // unparked host falls through to a normal negative response.
  const state = await getDomainManagedDnsState(host);
  if (!state.shouldServeParkingRecords) {
    return null;
  }

  const token = await getOrIssueGateToken(host);
  if (!token) {
    return null;
  }

  return {
    RCODE: 0,
    Answer: [
      {
        name: recordName,
        type: TXT_TYPE_CODE,
        TTL: config.NAMEFI_PARK_GATE_RECORD_TTL_SECONDS,
        // Split into <=255-byte character-strings so an oversized JWT is a
        // valid multi-string TXT RR (see formatGateTxtRdata).
        data: formatGateTxtRdata(token),
      },
    ],
  };
};

/**
 * Link that answers `<label>.<host>` TXT queries with the signed gate JWT and
 * passes every other query through untouched.
 */
export function createParkGateLink(): DnsRequestLink {
  return createResolvingLink(resolveParkGateAnswer);
}

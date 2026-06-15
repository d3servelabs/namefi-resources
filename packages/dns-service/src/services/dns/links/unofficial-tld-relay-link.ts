/**
 * Label rewrite for queries under the synthetic relay zone — strips
 * `<unofficialTld>.<relayZone>` so downstream resolvers can answer against
 * the underlying logical domain, then rewrites Answer/Authority `name`
 * fields back on unwind. Does **not** change RCODE: tree-semantic decisions
 * (NXDOMAIN vs NODATA) live in `./helpers.ts`, and Authority SOA injection
 * lives in `./relay-zone-authority-link.ts`. See `../TREE-SEMANTICS.md`.
 */

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { getUnofficialTlds } from '@namefi-astra/utils/parse-domain-name';
import { config } from '#lib/env';
import type { DnsResponse } from '#lib/dns/types';
import type { DnsRequestLink } from '../dns-request-handler.types';

export interface RelayPatternInput {
  tlds: string[];
  relayZone: string;
}

export interface RelayPatternMatch {
  logicalName: NamefiNormalizedDomain;
}

/**
 * True when `recordName` is the relay zone itself or any subdomain beneath
 * it (e.g. `gtld.namefi.dev` or `*.gtld.namefi.dev`). Used as a chain
 * predicate to gate the relay-specific sub-chain. Tolerant of case and
 * trailing dots on both inputs.
 */
export function isRelayZoneHost(
  recordName: string,
  { relayZone }: { relayZone: string },
): boolean {
  const normalizedRelay = relayZone.toLowerCase().replace(/^\.+|\.+$/g, '');
  if (!normalizedRelay) return false;
  const normalizedHost = recordName.toLowerCase().replace(/\.+$/, '');
  return (
    normalizedHost === normalizedRelay ||
    normalizedHost.endsWith(`.${normalizedRelay}`)
  );
}

export function matchRelayPattern(
  recordName: string,
  { tlds, relayZone }: RelayPatternInput,
): RelayPatternMatch | null {
  if (!relayZone || tlds.length === 0) {
    return null;
  }

  const normalizedName = recordName.toLowerCase();
  const normalizedRelay = relayZone.toLowerCase().replace(/\.+$/, '');
  const relaySuffix = `.${normalizedRelay}`;

  if (!normalizedName.endsWith(relaySuffix)) {
    return null;
  }

  const candidate = normalizedName.slice(0, -relaySuffix.length);
  if (candidate.length === 0) {
    return null;
  }

  for (const tld of tlds) {
    const normalizedTld = tld.toLowerCase().replace(/^\.+|\.+$/g, '');
    if (!normalizedTld) continue;
    // Match the TLD apex itself (`nfi.gtld.namefi.dev` → `nfi`) as well as
    // any descendant (`sami.nfi.gtld.namefi.dev` → `sami.nfi`). The apex
    // case is important for ENT correctness: the tree-aware resolver will
    // find records below the TLD (e.g. `sami.nfi`) as descendants of the
    // bare TLD node and return NODATA instead of NXDOMAIN per RFC 8020.
    if (
      candidate === normalizedTld ||
      candidate.endsWith(`.${normalizedTld}`)
    ) {
      return { logicalName: candidate as NamefiNormalizedDomain };
    }
  }

  return null;
}

type DnsResponseRecord = NonNullable<DnsResponse['Answer']>[number];

function rewriteName(
  name: string,
  logicalName: string,
  relayName: string,
): string {
  if (name === logicalName) return relayName;
  const suffix = `.${logicalName}`;
  if (name.endsWith(suffix)) {
    return `${name.slice(0, -logicalName.length)}${relayName}`;
  }
  return name;
}

function rewriteRecordList(
  records: DnsResponseRecord[] | undefined,
  logicalName: string,
  relayName: string,
): DnsResponseRecord[] | undefined {
  if (!records) return records;
  return records.map((record) => ({
    ...record,
    name: rewriteName(record.name, logicalName, relayName),
  }));
}

export function rewriteAnswerNames(
  response: DnsResponse,
  logicalName: string,
  relayName: string,
): DnsResponse {
  const Answer = rewriteRecordList(response.Answer, logicalName, relayName);
  const Authority = rewriteRecordList(
    response.Authority,
    logicalName,
    relayName,
  );

  return {
    ...response,
    ...(Answer !== undefined ? { Answer } : {}),
    ...(Authority !== undefined ? { Authority } : {}),
  };
}

export function createUnofficialTldRelayLink(): DnsRequestLink {
  return async (context, next) => {
    const tlds = getUnofficialTlds();
    const relayZone = config.NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE;

    const match = matchRelayPattern(context.question.recordName, {
      tlds,
      relayZone,
    });
    if (!match) {
      return next();
    }

    const originalName = context.question.recordName;
    context.logger.debug(
      { logicalName: match.logicalName, relayName: originalName },
      'Unofficial TLD relay rewrite',
    );

    context.question = {
      ...context.question,
      recordName: match.logicalName,
    };

    try {
      const response = await next();
      return rewriteAnswerNames(response, match.logicalName, originalName);
    } finally {
      context.question = {
        ...context.question,
        recordName: originalName,
      };
    }
  };
}

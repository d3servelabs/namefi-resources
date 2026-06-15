/**
 * Short-circuits wildcard queries (`*.foo.example.com`) to NXDOMAIN.
 * Namefi's authoritative server does not serve wildcard expansions, so
 * treating the literal wildcard label as a non-existent node matches the
 * tree-semantic model in `../TREE-SEMANTICS.md`.
 */

import { dnsRcodes } from '#lib/dns/rcodes';
import type { DnsRequestLink } from '../dns-request-handler.types';

export const wildcardTerminationLink: DnsRequestLink = async (
  context,
  next,
) => {
  if (context.question.wildcard) {
    return {
      RCODE: dnsRcodes.get('NXDOMAIN'),
      Answer: [],
    };
  }

  return next();
};

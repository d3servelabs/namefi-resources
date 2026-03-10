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

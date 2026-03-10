import type { DnsRequestLink } from '../dns-request-handler.types';

export const terminationLink: DnsRequestLink = async (context) => {
  return {
    ...context.result,
    RCODE: 0,
    Answer: context.result.Answer ?? [],
  };
};

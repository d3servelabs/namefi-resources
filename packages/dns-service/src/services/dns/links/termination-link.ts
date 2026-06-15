/**
 * Finalizer link that guarantees the response carries a concrete `RCODE`
 * and `Answer`. If upstream links forgot to set them, defaults are
 * `RCODE=0` (NOERROR) and `Answer=[]`. The tree-semantic outcome is always
 * decided upstream — see `../TREE-SEMANTICS.md`.
 */

import type { DnsRequestLink } from '../dns-request-handler.types';

export const terminationLink: DnsRequestLink = async (context) => {
  return {
    ...context.result,
    RCODE: 0,
    Answer: context.result.Answer ?? [],
  };
};

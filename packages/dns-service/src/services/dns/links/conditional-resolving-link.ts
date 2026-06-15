/**
 * Unary gate: runs `link` when `predicate` is true, otherwise skips to
 * `next()`. Equivalent to `switchLink(predicate, link)` from
 * `./combinators.ts` — kept for existing call sites. Has no tree-semantic
 * role; see `../TREE-SEMANTICS.md`.
 */

import type {
  DnsRequestLink,
  DnsRequestContext,
} from '../dns-request-handler.types';

export function createGatedLink(
  link: DnsRequestLink,
  predicate: (context: DnsRequestContext) => boolean,
): DnsRequestLink {
  return async (context, next) => {
    if (predicate(context)) {
      return link(context, next);
    }

    return next();
  };
}

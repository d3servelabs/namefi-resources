import type {
  DnsRequestContext,
  DnsRequestLink,
  DnsRequestNext,
} from '../dns-request-handler.types';

/**
 * Compose N links into a single composite link, dispatched sequentially.
 *
 * `mergeLinks(a, b, c)(context, outerNext)` runs `a` with a next that runs
 * `b` with a next that runs `c` with a next that calls `outerNext`. Any
 * link can short-circuit the remaining merged links by returning without
 * calling its `next`. With zero links it behaves like a passthrough —
 * calling `outerNext` directly.
 *
 * Each inner `next` is single-shot; calling it more than once throws,
 * matching the guarantee provided by the top-level dispatcher at
 * `apps/backend/src/services/dns/dns-request-handler.ts`.
 */
export function mergeLinks(...links: DnsRequestLink[]): DnsRequestLink {
  return async (context, outerNext) => {
    let lastDispatchedIndex = -1;

    const dispatch = (index: number): ReturnType<DnsRequestNext> => {
      if (index <= lastDispatchedIndex) {
        throw new Error(
          'mergeLinks: next() called more than once within the merged chain',
        );
      }
      lastDispatchedIndex = index;

      const link = links[index];
      if (!link) return outerNext();
      return link(context, () => dispatch(index + 1));
    };

    return dispatch(0);
  };
}

/**
 * Binary switch with an optional else branch. If `predicate(context)` is
 * true, runs `ifTrue`. Otherwise runs `ifFalse` if provided, else falls
 * through by calling the outer `next()` directly.
 *
 * With `ifFalse` omitted this is equivalent to `createGatedLink(ifTrue,
 * predicate)` at `apps/backend/src/services/dns/links/conditional-resolving-link.ts`.
 */
export function switchLink(
  predicate: (context: DnsRequestContext) => boolean,
  ifTrue: DnsRequestLink,
  ifFalse?: DnsRequestLink,
): DnsRequestLink {
  return async (context, next) => {
    if (predicate(context)) {
      return ifTrue(context, next);
    }
    if (ifFalse) {
      return ifFalse(context, next);
    }
    return next();
  };
}

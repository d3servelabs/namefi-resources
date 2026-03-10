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

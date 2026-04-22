/**
 * Observer link — stamps the request logger with the query metadata so
 * downstream log lines carry query context. Does not alter the response.
 * See `../TREE-SEMANTICS.md` for the overall model.
 */

import type { DnsRequestLink } from '../dns-request-handler.types';

export function createLoggingLink(): DnsRequestLink {
  return async (context, next) => {
    context.logger.assign({
      query: {
        name: context.question.rawName,
        type: context.question.rawType,
      },
      heartbeat: context.meta.heartbeat ? true : undefined,
    });

    return next();
  };
}

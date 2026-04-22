/**
 * Generic adapter that turns a `DnsAnswerResolver` into a link. The link
 * merges any resolver response into `context.result` and short-circuits
 * the chain once an RCODE is present. The resolver decides the
 * tree-semantic outcome (see `../TREE-SEMANTICS.md`); this link never
 * rewrites it.
 */

import { isNotNil } from 'ramda';
import type {
  DnsRequestLink,
  DnsAnswerResolver,
} from '../dns-request-handler.types';
import { mergeResponses } from './helpers';

export function createResolvingLink(
  resolver: DnsAnswerResolver,
): DnsRequestLink {
  return async (context, next) => {
    const response = await resolver(
      context.question.recordName,
      context.question.recordType,
    );

    if (response) {
      mergeResponses(context.result, response);
    }
    if (isNotNil(context.result.RCODE)) {
      return context.result;
    }
    return next();
  };
}

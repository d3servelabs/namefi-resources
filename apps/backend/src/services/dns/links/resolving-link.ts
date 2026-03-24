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

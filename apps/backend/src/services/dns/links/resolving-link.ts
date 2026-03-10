import type {
  DnsRequestLink,
  DnsAnswerResolver,
} from '../dns-request-handler.types';
import { appendAnswers } from './helpers';

export function createResolvingLink(
  resolver: DnsAnswerResolver,
): DnsRequestLink {
  return async (context, next) => {
    const response = await resolver(
      context.question.recordName,
      context.question.recordType,
    );

    if (!response) {
      return next();
    }

    if (response.RCODE !== undefined) {
      return response;
    }

    appendAnswers(context.result, response);

    return next();
  };
}

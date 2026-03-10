import type { DnsResponse } from '#lib/dns/types';
import type {
  CreateDnsRequestHandlerOptions,
  DnsQuestion,
  DnsRequestContext,
  DnsRequestHandler,
} from './dns-request-handler.types';
import { createLogger } from '#lib/logger';

const MULTIPLE_NEXT_CALLS_ERROR =
  'DNS request link next() called multiple times';

export function createDnsRequestContext(
  question: DnsQuestion,
  options: {
    useMockDnsTable?: boolean;
  } = {},
): DnsRequestContext {
  return {
    question,
    result: {
      Answer: [],
    },
    meta: {
      heartbeat: question.rawName === '041.ai.',
      useMockDnsTable: options.useMockDnsTable ?? false,
    },
    logger: createLogger({ context: 'DNS-Request-Handler' }),
  };
}

function normalizeDnsResponse(response: DnsResponse): DnsResponse {
  return {
    ...response,
    RCODE: response.RCODE ?? 0,
    Answer: response.Answer ?? [],
  };
}

export function createDnsRequestHandler(
  options: CreateDnsRequestHandlerOptions = {},
): DnsRequestHandler {
  const links = options.links ?? [];
  const createInitialContext =
    options.createInitialContext ??
    ((question: DnsQuestion) => createDnsRequestContext(question));

  return {
    async handle(question) {
      const context = createInitialContext(question);
      let lastDispatchedIndex = -1;

      const dispatch = async (index: number): Promise<DnsResponse> => {
        if (index <= lastDispatchedIndex) {
          throw new Error(MULTIPLE_NEXT_CALLS_ERROR);
        }

        lastDispatchedIndex = index;

        const link = links[index];
        if (!link) {
          return normalizeDnsResponse(context.result);
        }

        const response = await link(context, () => dispatch(index + 1));

        return normalizeDnsResponse(response);
      };

      return dispatch(0);
    },
  };
}

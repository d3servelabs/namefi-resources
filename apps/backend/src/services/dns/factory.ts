import { getAnswerForDnsQueryFromPreferences } from '#lib/domains/domain-preferences';
import {
  createDnsRequestContext,
  createDnsRequestHandler,
} from './dns-request-handler';
import type {
  DnsAnswerResolver,
  DnsQuestion,
  DnsRequestContext,
  DnsRequestHandler,
  DnsRequestLink,
} from './dns-request-handler.types';
import { wildcardTerminationLink } from './links/wildcard-termination-link';
import { createLoggingLink } from './links/logging-link';
import { createResolvingLink } from './links/resolving-link';
import { getAnswerForDnsQueryMock } from './links/mock';
import {
  DEFAULT_USE_MOCK_DNS_TABLE,
  getAnswerForDnsQueryFromDnsRecords,
  getNsAndSoaRecords,
  hasAnswers,
} from './links/helpers';
import { terminationLink } from './links/termination-link';
import { createGatedLink } from './links/conditional-resolving-link';
import { createZoneNsAndSoaLink } from './links/zone-ns-soa-link';

export interface DnsRequestLinkDependencies {
  getNsAndSoaRecords: DnsAnswerResolver;
  getAnswerFromPreferences: DnsAnswerResolver;
  getAnswerFromDnsRecords: DnsAnswerResolver;
  getAnswerFromMockTable: DnsAnswerResolver;
}

export interface CreateDefaultDnsRequestHandlerOptions {
  links?: DnsRequestLink[];
  createInitialContext?: (question: DnsQuestion) => DnsRequestContext;
  dependencies?: Partial<DnsRequestLinkDependencies>;
  useMockDnsTable?: boolean;
}

export function createDefaultDnsRequestLinksV2(
  dependencies: Partial<DnsRequestLinkDependencies> = {},
): DnsRequestLink[] {
  const resolvedDependencies: DnsRequestLinkDependencies = {
    getNsAndSoaRecords,
    getAnswerFromPreferences: getAnswerForDnsQueryFromPreferences,
    getAnswerFromDnsRecords: async (...args: Parameters<DnsAnswerResolver>) => {
      const result = await getAnswerForDnsQueryFromDnsRecords(...args);
      if (result?.RCODE === 3) {
        return null; // make v2.1 backward compatible with v2
      }
      return result;
    },
    getAnswerFromMockTable: getAnswerForDnsQueryMock,
    ...dependencies,
  };

  return [
    createLoggingLink(),
    wildcardTerminationLink,
    createResolvingLink(resolvedDependencies.getNsAndSoaRecords),
    createResolvingLink(resolvedDependencies.getAnswerFromPreferences),
    createResolvingLink(resolvedDependencies.getAnswerFromDnsRecords),
    createGatedLink(
      createResolvingLink(resolvedDependencies.getAnswerFromMockTable),
      (context) => context.meta.useMockDnsTable && !hasAnswers(context.result),
    ),
    terminationLink,
  ];
}

export function createDnsRequestHandlerV2(
  options: CreateDefaultDnsRequestHandlerOptions = {},
): DnsRequestHandler {
  const {
    links,
    createInitialContext,
    dependencies,
    useMockDnsTable = DEFAULT_USE_MOCK_DNS_TABLE,
  } = options;

  return createDnsRequestHandler({
    links: links ?? createDefaultDnsRequestLinksV2(dependencies),
    createInitialContext:
      createInitialContext ??
      ((question) => createDnsRequestContext(question, { useMockDnsTable })),
  });
}

export function createDefaultDnsRequestLinksV2_1(
  dependencies: Partial<DnsRequestLinkDependencies> = {},
): DnsRequestLink[] {
  const resolvedDependencies: DnsRequestLinkDependencies = {
    getNsAndSoaRecords,
    getAnswerFromPreferences: getAnswerForDnsQueryFromPreferences,
    getAnswerFromDnsRecords: getAnswerForDnsQueryFromDnsRecords,
    getAnswerFromMockTable: getAnswerForDnsQueryMock,
    ...dependencies,
  };

  return [
    createLoggingLink(),
    wildcardTerminationLink,
    createZoneNsAndSoaLink(),
    createResolvingLink(resolvedDependencies.getAnswerFromPreferences),
    createResolvingLink(resolvedDependencies.getAnswerFromDnsRecords),
    createGatedLink(
      createResolvingLink(resolvedDependencies.getAnswerFromMockTable),
      (context) => context.meta.useMockDnsTable && !hasAnswers(context.result),
    ),
    terminationLink,
  ];
}

export function createDnsRequestHandlerV2_1(
  options: CreateDefaultDnsRequestHandlerOptions = {},
): DnsRequestHandler {
  const {
    links,
    createInitialContext,
    dependencies,
    useMockDnsTable = DEFAULT_USE_MOCK_DNS_TABLE,
  } = options;

  return createDnsRequestHandler({
    links: links ?? createDefaultDnsRequestLinksV2_1(dependencies),
    createInitialContext:
      createInitialContext ??
      ((question) => createDnsRequestContext(question, { useMockDnsTable })),
  });
}

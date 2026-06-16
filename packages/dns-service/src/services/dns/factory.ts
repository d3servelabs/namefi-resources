import { getAnswerForDnsQueryFromPreferences } from '#lib/domains/domain-preferences';
import { config } from '#lib/env';
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
import { mergeLinks, switchLink } from './links/combinators';
import { createZoneNsAndSoaLink } from './links/zone-ns-soa-link';
import {
  createUnofficialTldRelayLink,
  isRelayZoneHost,
} from './links/unofficial-tld-relay-link';
import { createRewriteRelayedLink } from './links/rewrite-relayed-link';
import { createRelayZoneAuthorityLink } from './links/relay-zone-authority-link';
import { createParkGateLink } from './links/park-gate-link';
import { createLruCacheLink } from './links/lru-cache-link';
import { createRedisCacheLink } from './links/redis-cache-link';

/**
 * Build the cache layers that sit in front of the resolver chain, ordered
 * fastest-first (LRU then Redis), gated by config. `namespace` keeps each
 * resolver version's entries distinct in the shared Redis cache.
 */
function createDefaultCacheLinks(namespace: string): DnsRequestLink[] {
  const links: DnsRequestLink[] = [];
  const ttlOptions = {
    namespace,
    maxTtlSeconds: config.NAMEFI_DNS_CACHE_MAX_TTL_SECONDS,
    negativeTtlSeconds: config.NAMEFI_DNS_CACHE_NEGATIVE_TTL_SECONDS,
  };
  if (config.NAMEFI_DNS_LRU_CACHE_ENABLED) {
    links.push(
      createLruCacheLink({
        ...ttlOptions,
        maxEntries: config.NAMEFI_DNS_LRU_CACHE_MAX_ENTRIES,
        maxSizeBytes: config.NAMEFI_DNS_LRU_CACHE_MAX_SIZE_BYTES,
      }),
    );
  }
  if (config.NAMEFI_DNS_REDIS_CACHE_ENABLED) {
    links.push(
      createRedisCacheLink({
        ...ttlOptions,
        timeoutMs: config.NAMEFI_DNS_REDIS_CACHE_TIMEOUT_MS,
      }),
    );
  }
  return links;
}

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
    ...createDefaultCacheLinks('v2'),
    createResolvingLink(resolvedDependencies.getNsAndSoaRecords),
    createParkGateLink(),
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
    ...createDefaultCacheLinks('v2.1'),
    switchLink(
      (ctx) =>
        process.env.ENVIRONMENT !== 'production' &&
        isRelayZoneHost(ctx.question.recordName, {
          relayZone: config.NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE,
        }),
      mergeLinks(
        createRelayZoneAuthorityLink(),
        createUnofficialTldRelayLink(),
      ),
      createZoneNsAndSoaLink(),
    ),
    createParkGateLink(),
    createResolvingLink(resolvedDependencies.getAnswerFromPreferences),
    createResolvingLink(resolvedDependencies.getAnswerFromDnsRecords),
    createGatedLink(
      createResolvingLink(resolvedDependencies.getAnswerFromMockTable),
      (context) => context.meta.useMockDnsTable && !hasAnswers(context.result),
    ),
    terminationLink,
  ];
}

export function createDefaultDnsRequestLinksV2_2(
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
    ...createDefaultCacheLinks('v2.2'),
    createGatedLink(
      createRewriteRelayedLink(),
      (ctx) =>
        process.env.ENVIRONMENT !== 'production' &&
        isRelayZoneHost(ctx.question.recordName, {
          relayZone: config.NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE,
        }),
    ),
    createZoneNsAndSoaLink(),
    createParkGateLink(),
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

export function createDnsRequestHandlerV2_2(
  options: CreateDefaultDnsRequestHandlerOptions = {},
): DnsRequestHandler {
  const {
    links,
    createInitialContext,
    dependencies,
    useMockDnsTable = DEFAULT_USE_MOCK_DNS_TABLE,
  } = options;

  return createDnsRequestHandler({
    links: links ?? createDefaultDnsRequestLinksV2_2(dependencies),
    createInitialContext:
      createInitialContext ??
      ((question) => createDnsRequestContext(question, { useMockDnsTable })),
  });
}

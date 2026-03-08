import { z } from 'zod';
import { parseJsonOrUndefined } from './safe-parse-json';

const allowedChainIdsSchema = z.number().array();

export const ALLOWED_CHAINS_CONTEXT_SCHEMA = z.enum([
  'NFT_ALLOWED_CHAINS',
  'DNS_SERVING_ALLOWED_NFT_CHAINS',
  'NFSC_BALANCE_ALLOWED_CHAINS',
]);

export type AllowedChainsContext = z.infer<
  typeof ALLOWED_CHAINS_CONTEXT_SCHEMA
>;

const allowedChainsByParentDomainSchema = z.object({
  NFSC_BALANCE_ALLOWED_CHAINS: allowedChainIdsSchema,
  NFT_ALLOWED_CHAINS: allowedChainIdsSchema,
});

export const ALLOWED_CHAINS_DETAILS_SCHEMA = z.object({
  NFT_ALLOWED_CHAINS: allowedChainIdsSchema,
  DNS_SERVING_ALLOWED_NFT_CHAINS: allowedChainIdsSchema,
  NFSC_BALANCE_ALLOWED_CHAINS: allowedChainIdsSchema,
  BY_PARENT_DOMAIN: z
    .record(z.string(), allowedChainsByParentDomainSchema)
    .optional(),
});

export const ALLOWED_CHAINS_SCHEMA = z.union([
  allowedChainIdsSchema
    .transform((chainIds) => ({
      NFT_ALLOWED_CHAINS: chainIds,
      DNS_SERVING_ALLOWED_NFT_CHAINS: chainIds,
      NFSC_BALANCE_ALLOWED_CHAINS: chainIds,
    }))
    .pipe(ALLOWED_CHAINS_DETAILS_SCHEMA),
  ALLOWED_CHAINS_DETAILS_SCHEMA,
]);

export type AllowedChainsInput = z.input<typeof ALLOWED_CHAINS_SCHEMA>;
export type AllowedChainsDetails = z.output<typeof ALLOWED_CHAINS_SCHEMA>;

const dedupeChainIds = (chainIds: readonly number[]) =>
  Array.from(new Set(chainIds));

export function normalizeAllowedChainsParentDomain(
  parentDomain?: string | null,
): string | undefined {
  const normalizedParentDomain = parentDomain?.trim().toLowerCase();
  return normalizedParentDomain ? normalizedParentDomain : undefined;
}

export function getAllowedChainsForContext(
  allowedChains: AllowedChainsDetails,
  context: AllowedChainsContext,
  parentDomain?: string | null,
): number[] {
  const normalizedParentDomain =
    normalizeAllowedChainsParentDomain(parentDomain);

  if (
    normalizedParentDomain &&
    context !== 'DNS_SERVING_ALLOWED_NFT_CHAINS' &&
    allowedChains.BY_PARENT_DOMAIN?.[normalizedParentDomain]
  ) {
    const byParentDomain =
      allowedChains.BY_PARENT_DOMAIN[normalizedParentDomain];

    return dedupeChainIds(
      context === 'NFT_ALLOWED_CHAINS'
        ? byParentDomain.NFT_ALLOWED_CHAINS
        : byParentDomain.NFSC_BALANCE_ALLOWED_CHAINS,
    );
  }

  return dedupeChainIds(allowedChains[context]);
}

export function getAllowedChainsForNft(
  allowedChains: AllowedChainsDetails,
  parentDomain?: string | null,
): number[] {
  return getAllowedChainsForContext(
    allowedChains,
    'NFT_ALLOWED_CHAINS',
    parentDomain,
  );
}

export function getAllowedChainsForDnsServingNft(
  allowedChains: AllowedChainsDetails,
): number[] {
  return getAllowedChainsForContext(
    allowedChains,
    'DNS_SERVING_ALLOWED_NFT_CHAINS',
  );
}

export function getAllowedChainsForNfscBalance(
  allowedChains: AllowedChainsDetails,
  parentDomain?: string | null,
): number[] {
  return getAllowedChainsForContext(
    allowedChains,
    'NFSC_BALANCE_ALLOWED_CHAINS',
    parentDomain,
  );
}

export function getConfiguredAllowedChainIds(
  allowedChains: AllowedChainsDetails,
): number[] {
  return dedupeChainIds([
    ...allowedChains.NFT_ALLOWED_CHAINS,
    ...allowedChains.DNS_SERVING_ALLOWED_NFT_CHAINS,
    ...allowedChains.NFSC_BALANCE_ALLOWED_CHAINS,
    ...Object.values(allowedChains.BY_PARENT_DOMAIN ?? {}).flatMap(
      ({ NFSC_BALANCE_ALLOWED_CHAINS, NFT_ALLOWED_CHAINS }) => [
        ...NFSC_BALANCE_ALLOWED_CHAINS,
        ...NFT_ALLOWED_CHAINS,
      ],
    ),
  ]);
}

export function intersectAllowedChainIds(
  chainIdsSets: readonly (readonly number[])[],
): number[] {
  const [firstChainIds, ...restChainIds] = chainIdsSets;

  if (!firstChainIds) {
    return [];
  }

  return dedupeChainIds(firstChainIds).filter((chainId) =>
    restChainIds.every((candidateChainIds) =>
      candidateChainIds.includes(chainId),
    ),
  );
}

export function pickPreferredAllowedChainId(
  chainIds: readonly number[],
  preferredChainIds: readonly number[],
  fallbackChainId: number,
): number {
  const uniqueChainIds = dedupeChainIds(chainIds);

  for (const preferredChainId of preferredChainIds) {
    if (uniqueChainIds.includes(preferredChainId)) {
      return preferredChainId;
    }
  }

  return uniqueChainIds[0] ?? fallbackChainId;
}

export function parseAllowedChainsConfigValue(
  value: string | undefined,
  fallbackChainIds: readonly number[],
): AllowedChainsInput {
  const parsedJson = parseJsonOrUndefined<AllowedChainsInput>(value);
  if (parsedJson !== undefined) {
    return parsedJson;
  }

  if (!value) {
    return [...fallbackChainIds];
  }

  return value
    .split(',')
    .map((chainId) => Number(chainId))
    .filter((chainId) => !Number.isNaN(chainId));
}

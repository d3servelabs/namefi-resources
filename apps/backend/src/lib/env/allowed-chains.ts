import { CHAINS } from '@namefi-astra/utils/chains';
import {
  getAllowedChainsForDnsServingNft as getAllowedChainsForDnsServingNftFromDetails,
  getAllowedChainsForNft as getAllowedChainsForNftFromDetails,
  getAllowedChainsForNfscBalance as getAllowedChainsForNfscBalanceFromDetails,
  getConfiguredAllowedChainIds as getConfiguredAllowedChainIdsFromDetails,
  intersectAllowedChainIds,
  normalizeAllowedChainsParentDomain,
  pickPreferredAllowedChainId,
} from '@namefi-astra/utils/allowed-chains';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { config } from './index';

const NFT_DEFAULT_CHAIN_ID_ORDER = [
  CHAINS.sepolia.id,
  CHAINS.base.id,
  CHAINS.mainnet.id,
] as const;

function getParentDomainsFromDomainNames(
  domainNames?: readonly (string | null | undefined)[],
): string[] {
  const parentDomains = new Set<string>();

  for (const domainName of domainNames ?? []) {
    const normalizedDomainName = normalizeAllowedChainsParentDomain(domainName);

    if (!normalizedDomainName) {
      continue;
    }

    const parsedDomainName = parseDomainName(
      normalizedDomainName as NamefiNormalizedDomain,
    );

    if (
      parsedDomainName.valid &&
      parsedDomainName.registryType === 'subdomain'
    ) {
      parentDomains.add(parsedDomainName.nearestTraditionalParentDomain);
    }
  }

  return Array.from(parentDomains);
}

export function getAllowedChainsForNft(parentDomain?: string): number[] {
  return getAllowedChainsForNftFromDetails(config.ALLOWED_CHAINS, parentDomain);
}

export function getAllowedChainsForNftByDomainNames(
  domainNames?: readonly (string | null | undefined)[],
): number[] {
  const parentDomains = getParentDomainsFromDomainNames(domainNames);

  if (parentDomains.length === 0) {
    return getAllowedChainsForNft();
  }

  return intersectAllowedChainIds(
    parentDomains.map((parentDomain) => getAllowedChainsForNft(parentDomain)),
  );
}

export function getDefaultAllowedNftChainId(parentDomain?: string): number {
  return pickPreferredAllowedChainId(
    getAllowedChainsForNft(parentDomain),
    NFT_DEFAULT_CHAIN_ID_ORDER,
    CHAINS.base.id,
  );
}

export function getAllowedChainsForDnsServingNft(): number[] {
  return getAllowedChainsForDnsServingNftFromDetails(config.ALLOWED_CHAINS);
}

export function getAllowedChainsForNfscBalance(
  parentDomain?: string,
): number[] {
  return getAllowedChainsForNfscBalanceFromDetails(
    config.ALLOWED_CHAINS,
    parentDomain,
  );
}

export function getConfiguredAllowedChainIds(): number[] {
  return getConfiguredAllowedChainIdsFromDetails(config.ALLOWED_CHAINS);
}

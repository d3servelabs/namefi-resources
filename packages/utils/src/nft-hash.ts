import { hexToBytes, isHex, keccak256, pad } from 'viem';
import { getChain } from './chains';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from './contract-addresses';
import { assert } from './assert';

export type NftId = bigint;
export type NftHexId = SizedHexString<32>;
/**
 * A hex string with a prefix of 0x.
 */
export type HexString = `0x${string}` & {
  readonly __brand: {
    /**
     * The charset of the hex string.
     */
    readonly charset: 'hex';
    /**
     * Whether the hex string is prefixed with 0x.
     */
    readonly isPrefixed: true;
    /**
     * Whether the hex string is lowercase.
     */
    readonly isLowercase: true;
  };
};

export type SizedHexString<N extends number> = HexString & {
  readonly __brand: {
    /**
     * size of the hex string in bytes (characters/2) (not including the 0x prefix)
     */
    readonly size: N;
  };
};

export function assertSizedHexString<N extends number>(
  value: `0x${string}`,
  size: N,
): asserts value is SizedHexString<N> {
  // all characters are valid lowercase hex characters
  assert(
    !!value.match(/^0x[0-9a-f]+$/),
    `Not a valid HexString, characters must be 0-9, a-f and prefixed with 0x, got: ${value}`,
  );

  assert(isHex(value), `Not a HexString, got: ${value}`);
  const receivedSize = hexToBytes(value).length;
  assert(
    receivedSize === size,
    `Expected a HexString of size ${size}, got ${receivedSize}`,
  );
}

/**
 * Hashes a domain name using the keccak256 hash function and pads the result to 32 bytes.
 * @param maybeNormalizedDomainName - The domain name to hash.
 * @returns The hashed domain name.
 */
const encoder = new TextEncoder();

export function nftHexIdFromDomainName(
  maybeNormalizedDomainName: string,
): SizedHexString<32> {
  const normalizedDomainName = toAsciiDomain(maybeNormalizedDomainName);
  const result = pad(keccak256(encoder.encode(normalizedDomainName)), {
    size: 32,
    dir: 'left',
  });
  assertSizedHexString(result, 32);
  return result as SizedHexString<32>;
}

/**
 * Converts a domain name to a bigint.
 * @param maybeNormalizedDomainName - The domain name to convert.
 * @returns The bigint representation of the domain name.
 */
export function nftIdFromDomainName(maybeNormalizedDomainName: string): NftId {
  const hexId = nftHexIdFromDomainName(maybeNormalizedDomainName);
  return BigInt(hexId);
}

/**
 * Safely derives the string token ID from a domain name, returning null when hashing fails.
 */
export function getTokenIdFromDomainName(domainName: string): string | null {
  try {
    return nftIdFromDomainName(domainName).toString();
  } catch {
    return null;
  }
}

/**
 * Builds a URL to view an NFT on the chain's default block explorer, if available.
 */
export function getNftExplorerUrl(
  chainId: number | null | undefined,
  tokenId: string | null | undefined,
): string | null {
  if (chainId === null || chainId === undefined) return null;
  if (!tokenId) return null;
  const chain = getChain(chainId);
  const baseUrl = chain?.blockExplorers?.default?.url;
  if (!baseUrl) return null;
  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;
  return `${normalizedBaseUrl}/nft/${NAMEFI_NFT_CONTRACT_ADDRESS}/${tokenId}`;
}

function toAsciiDomain(domain: string): string {
  const lower = domain.toLowerCase();
  try {
    const parsed = new URL(`http://${lower}`);
    return parsed.hostname;
  } catch (error) {
    throw new Error(
      `Failed to normalize domain ${domain}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

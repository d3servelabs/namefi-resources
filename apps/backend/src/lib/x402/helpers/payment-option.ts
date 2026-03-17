import { config } from '#lib/env';
import { getUsdcContractAddress } from '#lib/crypto/x402-viem-clients';
import { X402_MAX_TIMEOUT_SECONDS } from './constants';
import { parseChainIdFromNetwork } from './network';
import { CHAINS } from '@namefi-astra/utils/chains';

export type X402UsdcPrice = {
  asset: `0x${string}`;
  amount: string;
  extra: {
    name: string;
    version: string;
  };
};

export function getX402ConfiguredChainId(): number {
  return parseChainIdFromNetwork(config.X402_NETWORK);
}

export function getX402ConfiguredUsdcContractAddress(): `0x${string}` {
  return getUsdcContractAddress(getX402ConfiguredChainId());
}

export function getX402ConfiguredUsdcEIP712Domain() {
  const chainId = getX402ConfiguredChainId();
  return {
    name: chainId === CHAINS.baseSepolia.id ? 'USDC' : 'USD Coin',
    version: '2',
    verifyingContract: getX402ConfiguredUsdcContractAddress(),
    chainId,
  };
}

export function centsToUsdc(
  cents: number,
  asset: `0x${string}` = getX402ConfiguredUsdcContractAddress(),
): X402UsdcPrice {
  return {
    asset,
    amount: (cents * 10_000).toFixed(0),
    extra: getX402ConfiguredUsdcEIP712Domain(),
  };
}

export function buildX402ExactPaymentOption(price: X402UsdcPrice): {
  scheme: 'exact';
  network: `${string}:${string}`;
  price: X402UsdcPrice;
  payTo: string;
  maxTimeoutSeconds: number;
} {
  return {
    scheme: 'exact',
    network: config.X402_NETWORK as `${string}:${string}`,
    price,
    payTo: config.X402_SIGNER_ADDRESS ?? 'namefidao.eth',
    maxTimeoutSeconds: X402_MAX_TIMEOUT_SECONDS,
  };
}

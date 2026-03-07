import { config } from '#lib/env';
import { getUsdcContractAddress } from '#lib/crypto/x402-viem-clients';
import { X402_EIP712_DOMAIN, X402_MAX_TIMEOUT_SECONDS } from './constants';
import { parseChainIdFromNetwork } from './network';

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

export function centsToUsdc(
  cents: number,
  asset: `0x${string}` = getX402ConfiguredUsdcContractAddress(),
): X402UsdcPrice {
  return {
    asset,
    amount: (cents * 10_000).toFixed(0),
    extra: {
      name: X402_EIP712_DOMAIN.name,
      version: X402_EIP712_DOMAIN.version,
    },
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

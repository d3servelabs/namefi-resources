import { createConfig } from '@privy-io/wagmi';
import { fallback } from 'viem';
import { http } from 'wagmi';
import { CHAINS } from '@namefi-astra/utils/chains';
import { getAlchemyHttpRpcUrl } from '@namefi-astra/utils';
import { clientSideEnv } from './env';

export const supportedChains = [
  CHAINS.mainnet,
  CHAINS.sepolia,
  CHAINS.base,
  CHAINS.baseSepolia,
  CHAINS.robinhoodTestnet,
] as const;

/**
 * CORS-enabled, keyless public RPC per chain, used only when no Alchemy
 * frontend key is configured (preview deployments, local without a key).
 *
 * Without this, viem's `http()` default for mainnet resolves to
 * `eth.merkle.io`, which rejects browser requests from non-allowlisted origins
 * (e.g. `*.vercel.app` previews) with a CORS error — breaking every mainnet
 * read (price feeds, tx-receipt polling) on those builds. publicnode endpoints
 * send permissive CORS headers, so the browser can call them from any origin.
 * Production sets the Alchemy key and never falls through to these.
 */
const PUBLIC_RPC_FALLBACKS: Record<number, string> = {
  [CHAINS.mainnet.id]: 'https://ethereum-rpc.publicnode.com',
  [CHAINS.sepolia.id]: 'https://ethereum-sepolia-rpc.publicnode.com',
  [CHAINS.base.id]: 'https://base-rpc.publicnode.com',
  [CHAINS.baseSepolia.id]: 'https://base-sepolia-rpc.publicnode.com',
};

/**
 * Per-chain HTTP transports shared by every wagmi config we build — the
 * Privy-owned default (`getWagmiConfig`) and the Reown AppKit adapter behind
 * `ff_mobile_walletconnect` (see `components/providers/reown-wallet-stack`).
 * Kept here (without importing Reown) so the default path stays light.
 */
export const getSupportedChainTransports = () => {
  const generateAlchemyRpcUrlForChain =
    clientSideEnv.NEXT_PUBLIC_ALCHEMY_FRONTEND_API_KEY
      ? getAlchemyHttpRpcUrl(clientSideEnv.NEXT_PUBLIC_ALCHEMY_FRONTEND_API_KEY)
      : null;

  const getHttpTransport = (chainId: number) => {
    if (generateAlchemyRpcUrlForChain) {
      return http(generateAlchemyRpcUrlForChain(chainId));
    }
    // No Alchemy key: prefer a CORS-friendly public RPC, falling back to the
    // chain's viem default if that endpoint is unreachable.
    const publicUrl = PUBLIC_RPC_FALLBACKS[chainId];
    return publicUrl ? fallback([http(publicUrl), http()]) : http();
  };

  return {
    [CHAINS.mainnet.id]: getHttpTransport(CHAINS.mainnet.id),
    [CHAINS.sepolia.id]: getHttpTransport(CHAINS.sepolia.id),
    [CHAINS.base.id]: getHttpTransport(CHAINS.base.id),
    [CHAINS.baseSepolia.id]: getHttpTransport(CHAINS.baseSepolia.id),
    [CHAINS.robinhoodTestnet.id]: getHttpTransport(CHAINS.robinhoodTestnet.id),
  };
};

export const getWagmiConfig = () => {
  return createConfig({
    chains: supportedChains,
    transports: getSupportedChainTransports(),
  });
};

import { createTRPCRouter, publicProcedure } from '../base';
import { config } from '../../lib/env';
import {
  X402_EIP712_DOMAIN,
  X402_MAX_TIMEOUT_SECONDS,
  X402_VALID_AFTER_LEEWAY_SECONDS,
  getX402ConfiguredChainId,
  getX402ConfiguredUsdcContractAddress,
} from '#lib/x402/helpers';

export const configRouter = createTRPCRouter({
  allowedChains: publicProcedure.query(() => {
    return {
      chains: config.ALLOWED_CHAINS,
    };
  }),
  x402Payment: publicProcedure.query(() => {
    if (!config.X402_ENABLED || !config.X402_SIGNER_ADDRESS) {
      return {
        enabled: false as const,
      };
    }

    const chainId = getX402ConfiguredChainId();

    return {
      enabled: config.X402_ENABLED,
      chainId,
      network: config.X402_NETWORK,
      payTo: config.X402_SIGNER_ADDRESS,
      asset: getX402ConfiguredUsdcContractAddress(),
      maxTimeoutSeconds: X402_MAX_TIMEOUT_SECONDS,
      validAfterLeewaySeconds: X402_VALID_AFTER_LEEWAY_SECONDS,
      eip712DomainName: X402_EIP712_DOMAIN.name,
      eip712DomainVersion: X402_EIP712_DOMAIN.version,
      x402Version: 2 as const,
    };
  }),
});

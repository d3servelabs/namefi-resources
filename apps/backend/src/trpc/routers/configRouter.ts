import { configContract } from '@namefi-astra/common/config-contract';
import {
  X402_MAX_TIMEOUT_SECONDS,
  X402_VALID_AFTER_LEEWAY_SECONDS,
  getX402ConfiguredChainId,
  getX402ConfiguredUsdcContractAddress,
} from '#lib/x402/helpers';
import { getX402ConfiguredUsdcEIP712Domain } from '#lib/x402/helpers/payment-option';
import { config } from '../../lib/env';
import { publicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';

export const configRouter = createContractTRPCRouter<typeof configContract>({
  allowedChains: publicProcedure
    .input(configContract.allowedChains.input)
    .output(configContract.allowedChains.output)
    .query(() => config.ALLOWED_CHAINS),

  x402Payment: publicProcedure
    .input(configContract.x402Payment.input)
    .output(configContract.x402Payment.output)
    .query(() => {
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
        eip712DomainName: getX402ConfiguredUsdcEIP712Domain().name,
        eip712DomainVersion: getX402ConfiguredUsdcEIP712Domain().version,
        x402Version: 2 as const,
      };
    }),
});

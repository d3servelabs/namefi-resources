import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { x402ResourceServer as X402ResourceServer } from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import {
  HTTPFacilitatorClient,
  type FacilitatorConfig,
} from '@x402/core/server';
import { createFacilitatorConfig } from '../coinbase/facilitator';
const logger = createLogger({ context: 'X402' });

function getFacilitatorConfig(): FacilitatorConfig {
  if (secrets.CDP_API_KEY_ID && secrets.CDP_API_KEY_SECRET) {
    return createFacilitatorConfig(
      secrets.CDP_API_KEY_ID,
      secrets.CDP_API_KEY_SECRET,
    );
  }
  return {
    url: config.X402_FACILITATOR_URL,
  };
}

export const facilitatorClient = new HTTPFacilitatorClient(
  getFacilitatorConfig(),
);

export const x402ResourceServer = new X402ResourceServer(
  facilitatorClient,
).register(config.X402_NETWORK, new ExactEvmScheme());
await x402ResourceServer.initialize();

logger.info(
  x402ResourceServer.hasRegisteredScheme('eip155:84532', 'exact'),
  'hasRegisteredScheme',
);
logger.info(
  x402ResourceServer.getSupportedKind(2, 'eip155:84532', 'exact'),
  'getSupportedKind',
);
